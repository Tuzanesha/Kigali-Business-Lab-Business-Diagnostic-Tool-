from rest_framework import viewsets, status, permissions, serializers
import logging
import re
from rest_framework.decorators import action
from rest_framework.response import Response

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
        # Map email to username field expected by parent
        email = attrs.get('email')
        if email:
            attrs['username'] = email
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


from django.contrib.auth import get_user_model
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


class AssessmentReportPageView(TemplateView):
    template_name = "diagnostic/assessment_report.html"

from django.shortcuts import render

# Create your views here.
