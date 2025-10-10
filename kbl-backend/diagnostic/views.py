from rest_framework import viewsets, status, permissions, serializers
import logging
import re
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

from .models import Category, Question, Enterprise, QuestionResponse, ScoreSummary, Attachment, EmailOTP, PhoneOTP
from .serializers import (
    CategorySerializer,
    QuestionSerializer,
    EnterpriseSerializer,
    QuestionResponseSerializer,
    ScoreSummarySerializer,
    AttachmentSerializer,
    EmailOTPSerializer,
)
from .services import recompute_and_store_summary
from rest_framework_simplejwt.tokens import RefreshToken, TokenError


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.select_related('category').all().order_by('category__name', 'number')
    serializer_class = QuestionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category_name = self.request.query_params.get('category')
        if category_name:
            qs = qs.filter(category__name__iexact=category_name)
        return qs


class EnterpriseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EnterpriseSerializer

    def get_queryset(self):
        return Enterprise.objects.filter(owner=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def recompute(self, request, pk=None):
        enterprise = self.get_object()
        summary = recompute_and_store_summary(enterprise)
        return Response(ScoreSummarySerializer(summary).data)

    @action(detail=True, methods=['post'], url_path='bulk-answers')
    def bulk_answers(self, request, pk=None):
        enterprise = self.get_object()
        payload = request.data
        if not isinstance(payload, list):
            return Response({"detail": "Expected a JSON list"}, status=400)

        from .models import Question, QuestionResponse

        created = 0
        updated = 0
        errors = []
        for idx, item in enumerate(payload):
            if not isinstance(item, dict):
                errors.append({"index": idx, "error": "Item must be an object"})
                continue
            question_id = item.get('question_id')
            number = str(item.get('question_number', '')).strip()
            try:
                score = int(item.get('score'))
            except Exception:
                errors.append({"index": idx, "number": number, "error": "score must be integer (-1 or 0..4)"})
                continue
            evidence = item.get('evidence', '') or ''
            comments = item.get('comments', '') or ''

            try:
                if question_id:
                    question = Question.objects.get(id=question_id)
                else:
                    if not number:
                        raise Question.DoesNotExist
                    # Fallback to number (not unique across categories). If multiple, pick the first by category order.
                    question = Question.objects.filter(number=number).order_by('category_id').first()
                    if not question:
                        raise Question.DoesNotExist
            except Question.DoesNotExist:
                errors.append({"index": idx, "number": number, "error": "question not found"})
                continue

            obj, was_created = QuestionResponse.objects.update_or_create(
                enterprise=enterprise,
                question=question,
                defaults={
                    'score': score,
                    'evidence': evidence,
                    'comments': comments,
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response({
            'created': created,
            'updated': updated,
            'errors': errors,
        })


# Custom JWT obtain pair that accepts email/password
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        # Ensure the expected username_field (which is User.USERNAME_FIELD) is populated
        email = attrs.get('email')
        if email:
            attrs[self.username_field] = email
        return super().validate(attrs)


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class QuestionResponseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuestionResponseSerializer

    def get_queryset(self):
        return (
            QuestionResponse.objects
            .select_related('enterprise', 'question', 'question__category')
            .filter(enterprise__owner=self.request.user)
        )


class ScoreSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ScoreSummarySerializer

    def get_queryset(self):
        return ScoreSummary.objects.select_related('enterprise').filter(enterprise__owner=self.request.user)


class AttachmentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AttachmentSerializer

    def get_queryset(self):
        return Attachment.objects.select_related('response').filter(response__enterprise__owner=self.request.user)


from rest_framework.views import APIView
from django.views.generic import TemplateView


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        full_name = request.data.get('full_name', '')
        email = request.data.get('email')
        password = request.data.get('password')
        phone = request.data.get('phone', '').strip()
        if not email or not password:
            return Response({"detail": "email and password are required"}, status=400)
        
        # Check for existing user by both username and email fields
        User = get_user_model()
        if User.objects.filter(email=email).exists():
            return Response({"detail": "This email is already registered."}, status=400)
        
        first_name = full_name.split(' ')[0] if full_name else ''
        last_name = ' '.join(full_name.split(' ')[1:]) if ' ' in full_name else ''
        user = User.objects.create_user(email=email, password=password, first_name=first_name, last_name=last_name, username=email, phone=phone)
        return Response({"id": user.id, "email": user.email}, status=201)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        u = request.user
        avatar_url = ''
        try:
            if getattr(u, 'avatar', None) and u.avatar:
                avatar_url = u.avatar.url
        except Exception:
            avatar_url = ''
        return Response({
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'full_name': f"{u.first_name} {u.last_name}".strip(),
            'phone': getattr(u, 'phone', ''),
            'title': getattr(u, 'title', ''),
            'avatar_url': avatar_url,
        })

    def put(self, request):
        u = request.user
        u.first_name = request.data.get('first_name', u.first_name)
        u.last_name = request.data.get('last_name', u.last_name)
        u.phone = request.data.get('phone', getattr(u, 'phone', ''))
        u.title = request.data.get('title', getattr(u, 'title', ''))
        # email change optional; ensure uniqueness
        new_email = (request.data.get('email') or '').strip()
        if new_email and new_email.lower() != u.email.lower():
            User = get_user_model()
            if User.objects.filter(email__iexact=new_email).exclude(pk=u.pk).exists():
                return Response({'detail': 'Email is already in use'}, status=400)
            u.email = new_email
            u.username = new_email
        u.save()
        return self.get(request)


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.parsers import MultiPartParser, FormParser


class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('avatar')
        if not file:
            return Response({'detail': 'avatar file is required'}, status=400)
        u = request.user
        u.avatar = file
        u.save(update_fields=['avatar'])
        return Response({'avatar_url': getattr(u.avatar, 'url', '')})


class AvatarRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        u = request.user
        if getattr(u, 'avatar', None):
            try:
                u.avatar.delete(save=False)
            except Exception:
                pass
        u.avatar = None
        u.save(update_fields=['avatar'])
        return Response({'detail': 'Avatar removed'})


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current = request.data.get('current_password') or ''
        new = request.data.get('new_password') or ''
        confirm = request.data.get('confirm_password') or ''
        if not (current and new and confirm):
            return Response({'detail': 'current_password, new_password, confirm_password are required'}, status=400)
        if new != confirm:
            return Response({'detail': 'New passwords do not match'}, status=400)
        u = request.user
        if not u.check_password(current):
            return Response({'detail': 'Current password is incorrect'}, status=400)
        u.set_password(new)
        u.save(update_fields=['password'])
        return Response({'detail': 'Password updated'})


class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Optionally require a confirmation phrase
        _ = request.data.get('confirm', '')
        user = request.user
        user_id = user.id
        try:
            user.delete()
        except Exception:
            logging.exception('Account deletion failed for user %s', user_id)
            return Response({'detail': 'Failed to delete account'}, status=500)
        return Response({'detail': 'Account deleted'})


from .models import NotificationPreference


class NotificationPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        return Response({
            'email_notifications': prefs.email_notifications,
            'push_notifications': prefs.push_notifications,
            'weekly_reports': prefs.weekly_reports,
            'marketing_communications': prefs.marketing_communications,
        })

    def put(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)
        for f in ['email_notifications', 'push_notifications', 'weekly_reports', 'marketing_communications']:
            if f in request.data:
                setattr(prefs, f, bool(request.data.get(f)))
        prefs.save()
        return self.get(request)


class EnterpriseProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        # If pk not provided, pick first enterprise
        from .models import Enterprise
        e = None
        if pk:
            try:
                e = Enterprise.objects.get(pk=pk, owner=request.user)
            except Enterprise.DoesNotExist:
                return Response({'detail': 'Not found'}, status=404)
        else:
            e = Enterprise.objects.filter(owner=request.user).order_by('id').first()
            if not e:
                return Response({'detail': 'No enterprise yet'}, status=404)
        data = {
            'id': e.id,
            'name': e.name,
            'location': e.location,
            'year_founded': e.year_founded,
            'legal_structure': e.legal_structure,
            'description': e.description,
            'full_time_employees_total': e.full_time_employees_total,
            'part_time_employees_total': e.part_time_employees_total,
            'revenue_this_year': e.revenue_this_year,
        }
        return Response(data)

    def put(self, request, pk=None):
        from .models import Enterprise
        try:
            if pk:
                e = Enterprise.objects.get(pk=pk, owner=request.user)
            else:
                e = Enterprise.objects.filter(owner=request.user).order_by('id').first()
                if not e:
                    return Response({'detail': 'No enterprise yet'}, status=404)
        except Enterprise.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        # Update subset of fields
        for f in ['name','location','year_founded','legal_structure','description','full_time_employees_total','part_time_employees_total','revenue_this_year']:
            if f in request.data:
                setattr(e, f, request.data.get(f))
        e.save()
        return self.get(request, pk=e.pk)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Explicitly notify if account does not exist per user request
        email = (request.data.get('email') or '').strip().lower()
        User = get_user_model()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "You don't have an account yet. Please sign up first."}, status=404)

        token = PasswordResetTokenGenerator().make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

        # Build absolute URL to our confirm page
        # Use request.get_host() to support different environments
        scheme = 'https' if request.is_secure() else 'http'
        base = f"{scheme}://{request.get_host()}"
        confirm_url = f"{base}/api/web/password-reset/confirm/?uid={uidb64}&token={token}"

        # Email body
        subject = 'Password reset instructions'
        message = (
            'You requested a password reset.\n\n'
            f'Open the following link to set a new password: {confirm_url}\n\n'
            'If you did not request this, you can ignore this email.'
        )

        try:
            send_mail(subject, message, None, [user.email], fail_silently=False)
        except Exception:
            logging.exception('Failed to send password reset email')
            return Response({"detail": "Failed to send reset email. Please try again later."}, status=502)
        return Response({"detail": "Password reset link sent to your email."})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid') or ''
        token = request.data.get('token') or ''
        new_password = request.data.get('new_password') or ''
        if not (uidb64 and token and new_password):
            return Response({"detail": "uid, token and new_password are required"}, status=400)

        User = get_user_model()
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({"detail": "Invalid link"}, status=400)

        gen = PasswordResetTokenGenerator()
        if not gen.check_token(user, token):
            return Response({"detail": "Invalid or expired token"}, status=400)

        try:
            user.set_password(new_password)
            user.save(update_fields=['password'])
        except Exception:
            logging.exception('Failed to set new password')
            return Response({"detail": "Could not set password"}, status=500)

        return Response({"detail": "Password has been reset"})


class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Allow access if either email or phone has been verified
        has_email_verified = EmailOTP.objects.filter(
            user=request.user,
            is_verified=True
        ).exists()
        has_phone_verified = PhoneOTP.objects.filter(
            user=request.user,
            is_verified=True
        ).exists()

        if not (has_email_verified or has_phone_verified):
            return Response({"detail": "Verification required", "needs_otp": True}, status=403)
        
        enterprises_count = Enterprise.objects.filter(owner=request.user).count()
        summaries = ScoreSummary.objects.select_related('enterprise').filter(enterprise__owner=request.user)
        overall = [float(s.overall_percentage or 0) for s in summaries]
        latest_overall = overall[-1] if overall else 0
        return Response({
            "enterprises": enterprises_count,
            "latest_overall_percentage": latest_overall,
        })


from django.utils import timezone
from datetime import timedelta
import random
from django.core.mail import send_mail
from django.conf import settings
import requests
import os
from .services import send_sms_vonage
from .services import recompute_and_store_summary


class SendEmailOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # If already verified by email or phone, do not resend
        already_verified = (
            EmailOTP.objects.filter(user=request.user, is_verified=True).exists() or
            PhoneOTP.objects.filter(user=request.user, is_verified=True).exists()
        )
        if already_verified:
            return Response({"detail": "Phone/email already verified."})
        # generate 6-digit code
        code = f"{random.randint(0,999999):06d}"
        expires = timezone.now() + timedelta(minutes=10)
        otp = EmailOTP.objects.create(user=request.user, code=code, expires_at=expires)
        # Send email using configured backend
        try:
            send_mail(
                subject='Your verification code',
                message=f'Your verification code is {code}. It expires in 10 minutes.',
                from_email=None,
                recipient_list=[request.user.email],
                fail_silently=False,
            )
            delivery = 'email'
        except Exception as e:
            print('Email send failed:', e)
            delivery = 'console'
        resp = {"detail": "OTP sent to your email.", "expires_at": expires}
        return Response(resp)


class VerifyEmailOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '')
        now = timezone.now()
        # If already verified by email or phone
        if EmailOTP.objects.filter(user=request.user, is_verified=True).exists() or \
           PhoneOTP.objects.filter(user=request.user, is_verified=True).exists():
            return Response({"detail": "Phone/email already verified."})
        otp = (
            EmailOTP.objects
            .filter(user=request.user, code=code, is_verified=False, expires_at__gte=now)
            .order_by('-created_at')
            .first()
        )
        if not otp:
            return Response({"detail": "Invalid or expired code"}, status=400)
        otp.is_verified = True
        otp.save(update_fields=['is_verified', 'updated_at'])
        return Response({"detail": "Email verified"})


class SendPhoneOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # If already verified by email or phone, do not resend
        already_verified = (
            EmailOTP.objects.filter(user=request.user, is_verified=True).exists() or
            PhoneOTP.objects.filter(user=request.user, is_verified=True).exists()
        )
        if already_verified:
            return Response({"detail": "Phone/email already verified."})

        phone = (request.data.get('phone') or '').strip()
        # Basic E.164 normalization (very naive): remove spaces/dashes, ensure starts with '+'
        phone = re.sub(r"[\s-]", "", phone)
        if phone and not phone.startswith('+') and phone.isdigit():
            phone = '+' + phone
        if not phone:
            # fall back to stored user phone
            try:
                phone = request.user.phone
            except Exception:
                phone = ''
        if not phone:
            return Response({"detail": "Phone number is required"}, status=400)

        # Generate OTP and send via Vonage SMS API
        code = f"{random.randint(0,999999):06d}"
        expires = timezone.now() + timedelta(minutes=10)
        text = f"Your verification code is {code}. It expires in 10 minutes."
        ok, err, meta = send_sms_vonage(phone, text)
        if not ok:
            # Log detailed provider error internally but do not expose to end users
            try:
                logging.error('SMS send failed: %s | meta=%s', err, meta)
            except Exception:
                pass
            return Response({"detail": "Delivery not available right now."}, status=502)
        # Store OTP only after SMS accepted by provider
        PhoneOTP.objects.create(user=request.user, phone=phone, code=code, expires_at=expires)
        return Response({"detail": "OTP sent to your phone number.", "expires_at": expires})


class VerifyPhoneOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # If already verified by email or phone
        if EmailOTP.objects.filter(user=request.user, is_verified=True).exists() or \
           PhoneOTP.objects.filter(user=request.user, is_verified=True).exists():
            return Response({"detail": "Phone/email already verified."})

        code = request.data.get('code', '')
        phone = (request.data.get('phone') or '').strip()
        if not phone:
            try:
                phone = request.user.phone
            except Exception:
                phone = ''
        if not phone:
            return Response({"detail": "Phone number is required"}, status=400)
        now = timezone.now()
        otp = (
            PhoneOTP.objects
            .filter(user=request.user, phone=phone, code=code, is_verified=False, expires_at__gte=now)
            .order_by('-created_at')
            .first()
        )
        if not otp:
            return Response({"detail": "Invalid or expired code"}, status=400)
        otp.is_verified = True
        otp.save(update_fields=['is_verified', 'updated_at'])
        return Response({"detail": "Phone verified"})


class AuthStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        has_email_verified = EmailOTP.objects.filter(user=request.user, is_verified=True).exists()
        has_phone_verified = PhoneOTP.objects.filter(user=request.user, is_verified=True).exists()
        user_phone = ''
        try:
            user_phone = request.user.phone
        except Exception:
            user_phone = ''
        return Response({
            "verified": bool(has_email_verified or has_phone_verified),
            "has_email_verified": has_email_verified,
            "has_phone_verified": has_phone_verified,
            "phone": user_phone,
        })


class MyEnterprisesSummariesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Return all enterprises owned by current user with their latest summary
        enterprises = Enterprise.objects.filter(owner=request.user).order_by('name')
        data = []
        for e in enterprises:
            summary = ScoreSummary.objects.filter(enterprise=e).order_by('-updated_at').first()
            if not summary:
                # compute lazily if missing
                summary = recompute_and_store_summary(e)
            # Determine if any responses exist for this enterprise (used by UI)
            has_responses = QuestionResponse.objects.filter(enterprise=e).exists()
            data.append({
                'id': e.id,
                'name': e.name,
                'overall_percentage': summary.overall_percentage if summary else 0,
                'section_scores': summary.section_scores if summary else {},
                'has_responses': has_responses,
                'updated_at': getattr(summary, 'updated_at', None),
            })
        return Response({'results': data})


class RecomputeAllSummariesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        enterprises = Enterprise.objects.filter(owner=request.user)
        out = []
        for e in enterprises:
            s = recompute_and_store_summary(e)
            out.append({
                'id': e.id,
                'name': e.name,
                'overall_percentage': s.overall_percentage,
            })
        return Response({'results': out})


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Client may pass refresh token; if present, blacklist it
        refresh = request.data.get('refresh')
        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except TokenError:
                # Ignore invalid/expired refresh tokens and still succeed
                pass
            except Exception:
                # Log but do not leak details to user
                logging.exception('Failed to blacklist refresh token')
        # Nothing else to do for stateless JWT; instruct client to clear storage
        return Response({"detail": "Logged out"})


class EnterpriseReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk: int):
        try:
            e = Enterprise.objects.get(pk=pk, owner=request.user)
        except Enterprise.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        summary = ScoreSummary.objects.filter(enterprise=e).order_by('-updated_at').first()
        if not summary:
            summary = recompute_and_store_summary(e)
        return Response({
            'id': e.id,
            'name': e.name,
            'overall_percentage': summary.overall_percentage if summary else 0,
            'section_scores': summary.section_scores if summary else {},
            'priorities': summary.priorities if summary else {},
            'updated_at': getattr(summary, 'updated_at', None),
        })


# Minimal web pages (static HTML + JS calling the API)

class LoginPageView(TemplateView):
    template_name = "diagnostic/login.html"


class SignupPageView(TemplateView):
    template_name = "diagnostic/signup.html"


class DashboardPageView(TemplateView):
    template_name = "diagnostic/dashboard.html"

    def dispatch(self, request, *args, **kwargs):
        # Gate the page: if not verified, redirect to verify page
        if not request.user.is_authenticated:
            return super().dispatch(request, *args, **kwargs)
        has_email_verified = EmailOTP.objects.filter(user=request.user, is_verified=True).exists()
        has_phone_verified = PhoneOTP.objects.filter(user=request.user, is_verified=True).exists()
        if not (has_email_verified or has_phone_verified):
            from django.shortcuts import redirect
            return redirect('/api/web/verify/')
        return super().dispatch(request, *args, **kwargs)


class EnterpriseCreatePageView(TemplateView):
    template_name = "diagnostic/enterprise_new.html"


class AssessmentPageView(TemplateView):
    template_name = "diagnostic/assessment.html"


class VerifyPageView(TemplateView):
    template_name = "diagnostic/verify.html"


class PasswordResetRequestPageView(TemplateView):
    template_name = "diagnostic/password_reset_request.html"


class PasswordResetConfirmPageView(TemplateView):
    template_name = "diagnostic/password_reset_confirm.html"


class SettingsPageView(TemplateView):
    template_name = "diagnostic/settings.html"


class AssessmentReportPageView(TemplateView):
    template_name = "diagnostic/assessment_report.html"

from django.shortcuts import render

# Create your views here.
