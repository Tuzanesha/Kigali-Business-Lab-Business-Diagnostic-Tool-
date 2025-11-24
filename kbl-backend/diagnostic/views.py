from rest_framework import viewsets, status, permissions, serializers
from django.db import models
import logging
import re
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.urls import reverse

# Email utilities
from .utils.email import send_team_invitation_email

from .models import Category, Question, Enterprise, QuestionResponse, ScoreSummary, Attachment, EmailOTP, PhoneOTP, ActionItem, TeamMember
from .serializers import (
    CategorySerializer,
    QuestionSerializer,
    EnterpriseSerializer,
    QuestionResponseSerializer,
    ScoreSummarySerializer,
    AttachmentSerializer,
    EmailOTPSerializer,
    ActionItemSerializer,
    TeamMemberSerializer,
)
from .models import NotificationPreference
from rest_framework import serializers


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['email_notifications', 'push_notifications', 'weekly_reports', 'marketing_communications']
        read_only_fields = ['user']
from .services import recompute_and_store_summary, compute_public_base_url, send_verification_email
from rest_framework_simplejwt.tokens import RefreshToken, TokenError


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    pagination_class = None


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

    def create(self, request, *args, **kwargs):
        # Enforce one enterprise per user but behave idempotently: if exists, return it
        existing = Enterprise.objects.filter(owner=request.user).first()
        if existing is not None:
            return Response(EnterpriseSerializer(existing).data)
        # accept partial payload for minimal creation
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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

    @action(detail=True, methods=['post'], url_path='reset-responses')
    def reset_responses(self, request, pk=None):
        enterprise = self.get_object()
        from .models import QuestionResponse
        try:
            deleted, _ = QuestionResponse.objects.filter(enterprise=enterprise).delete()
        except Exception:
            deleted = 0
        summary = recompute_and_store_summary(enterprise)
        return Response({
            'deleted': deleted,
            'overall_percentage': summary.overall_percentage,
        })


# Custom JWT obtain pair that accepts email/password
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        # Ensure the expected username_field (which is User.USERNAME_FIELD) is populated
        email = (attrs.get('email') or '').strip().lower()
        if email:
            attrs[self.username_field] = email
        # Block login until email verified
        data = super().validate(attrs)
        User = get_user_model()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return data
        from .models import EmailOTP
        has_email_verified = EmailOTP.objects.filter(user=user, is_verified=True).exists()
        if not has_email_verified:
            # Re-send verification link only if a recent unverified OTP doesn't already exist
            try:
                now = timezone.now()
                recent = EmailOTP.objects.filter(user=user, is_verified=False, expires_at__gte=now).order_by('-created_at').first()
                # Throttle re-sends: if an OTP exists and was created within last 2 minutes, skip sending another
                should_send = True
                if recent and (now - recent.created_at).total_seconds() < 120:
                    should_send = False
                if should_send:
                    base = compute_public_base_url(self.context['request'])
                    send_verification_email(self.context['request'], user, base)
            except Exception:
                pass
            raise serializers.ValidationError({'detail': 'Please verify your email. We have re-sent the verification link to your inbox.'})
        return data


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


class ActionItemViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActionItemSerializer

    def get_queryset(self):
        qs = ActionItem.objects.filter(owner=self.request.user)
        status_q = self.request.query_params.get('status')
        if status_q in {ActionItem.STATUS_TODO, ActionItem.STATUS_INPROGRESS, ActionItem.STATUS_COMPLETED}:
            qs = qs.filter(status=status_q)
        enterprise_id = self.request.query_params.get('enterprise')
        if enterprise_id:
            try:
                qs = qs.filter(enterprise_id=int(enterprise_id))
            except Exception:
                pass
        return qs.order_by('status', 'order', 'id')

    def perform_create(self, serializer):
        # Require the user to have an enterprise; default to it if not passed
        enterprise = serializer.validated_data.get('enterprise')
        if not enterprise:
            enterprise = Enterprise.objects.filter(owner=self.request.user).first()
            if not enterprise:
                raise serializers.ValidationError({'enterprise': 'Please create your enterprise profile first.'})
        elif not Enterprise.objects.filter(id=enterprise.id, owner=self.request.user).exists():
            raise serializers.ValidationError({'enterprise': 'Not permitted'})

        # Place at end of the column by default
        status_val = serializer.validated_data.get('status') or ActionItem.STATUS_TODO
        max_order = (
            ActionItem.objects
            .filter(owner=self.request.user, status=status_val)
            .aggregate(models.Max('order'))
            .get('order__max') or 0
        )
        serializer.save(owner=self.request.user, enterprise=enterprise, order=max_order + 1)

    @action(detail=False, methods=['get'])
    def board(self, request):
        items = ActionItem.objects.filter(owner=request.user).order_by('status', 'order', 'id')
        def to_card(it: ActionItem):
            # Convert assigned_to (email) to initials if it's an email
            user_display = it.assigned_to or ''
            if '@' in user_display:
                # Extract initials from email (e.g., "john.doe@example.com" -> "JD")
                parts = user_display.split('@')[0].split('.')
                if len(parts) >= 2:
                    initials = (parts[0][0] + parts[1][0]).upper()
                else:
                    initials = user_display[:2].upper()
                user_display = initials
            
            return {
                'id': it.id,
                'title': it.title,
                'source': it.source,
                'date': it.due_date.isoformat() if it.due_date else '',
                'user': user_display,
                'priority': it.priority,
            }
        out = {k: [] for k in [ActionItem.STATUS_TODO, ActionItem.STATUS_INPROGRESS, ActionItem.STATUS_COMPLETED]}
        for it in items:
            out[it.status].append(to_card(it))
        return Response(out)

    @action(detail=False, methods=['post'], url_path='bulk-move')
    def bulk_move(self, request):
        """Reorder and/or move items across columns.
        Payload: { items: [ {id, status, order}, ... ] }
        """
        payload = request.data if isinstance(request.data, dict) else {}
        items = payload.get('items') or []
        if not isinstance(items, list):
            return Response({'detail': 'items must be a list'}, status=400)
        # Validate all belong to user
        ids = [i.get('id') for i in items if isinstance(i, dict)]
        existing = {it.id: it for it in ActionItem.objects.filter(owner=request.user, id__in=ids)}
        updates_by_status = {ActionItem.STATUS_TODO: [], ActionItem.STATUS_INPROGRESS: [], ActionItem.STATUS_COMPLETED: []}
        for i in items:
            try:
                it = existing[int(i.get('id'))]
            except Exception:
                continue
            status_val = i.get('status') or it.status
            if status_val not in updates_by_status:
                status_val = it.status
            try:
                order_val = int(i.get('order'))
            except Exception:
                order_val = it.order
            updates_by_status[status_val].append((it, order_val))
        # Apply new status and order; normalize ordering per column
        for status_val, pairs in updates_by_status.items():
            # sort pairs by provided order then id for stability
            pairs.sort(key=lambda p: (p[1], p[0].id))
            for new_index, (it, _given_order) in enumerate(pairs):
                it.status = status_val
                it.order = new_index
                it.save(update_fields=['status', 'order', 'updated_at'])
        return Response({'detail': 'Updated'})


class TeamMemberViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TeamMemberSerializer

    def get_queryset(self):
        try:
            enterprises = Enterprise.objects.filter(owner=self.request.user)
            return TeamMember.objects.filter(enterprise__in=enterprises).select_related('enterprise').order_by('created_at')
        except Exception as e:
            # Handle case where team_members table doesn't exist yet
            from django.db import connection, ProgrammingError
            if isinstance(e, ProgrammingError) and 'team_members' in str(e):
                logger = logging.getLogger(__name__)
                logger.error("team_members table does not exist. Please run migrations: python manage.py migrate")
                # Return empty queryset instead of crashing
                return TeamMember.objects.none()
            # For other errors, re-raise
            raise

    def list(self, request, *args, **kwargs):
        """Override list to provide better error message if table doesn't exist"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            from django.db import ProgrammingError
            if isinstance(e, ProgrammingError) and 'team_members' in str(e):
                return Response({
                    'detail': 'Team members feature is not available. Please run migrations: python manage.py migrate',
                    'error': 'team_members_table_missing',
                    'fix': 'Run migrations in Render Shell: python manage.py migrate'
                }, status=503)  # Service Unavailable
            raise

    def perform_create(self, serializer):
        import secrets
        from django.utils import timezone
        from datetime import timedelta
        
        # Ensure enterprise belongs to user
        enterprise = serializer.validated_data.get('enterprise')
        if enterprise is None:
            raise serializers.ValidationError({'enterprise': 'Enterprise is required'})
        
        # Handle both object and ID
        if isinstance(enterprise, int):
            try:
                enterprise = Enterprise.objects.get(id=enterprise, owner=self.request.user)
            except Enterprise.DoesNotExist:
                raise serializers.ValidationError({'enterprise': 'Enterprise not found or not permitted'})
        elif not Enterprise.objects.filter(id=enterprise.id, owner=self.request.user).exists():
            raise serializers.ValidationError({'enterprise': 'Not permitted'})
        
        # Generate token and set expiration (7 days from now)
        token = secrets.token_hex(16)
        expires_at = timezone.now() + timedelta(days=7)
        
        # Save the team member with invitation details
        team_member = serializer.save(
            invited_by=self.request.user,
            invitation_token=token,
            status=TeamMember.STATUS_INVITED,
            invitation_expires_at=expires_at
        )
        
        # Send invitation email
        try:
            accept_url = self.request.build_absolute_uri(
                '/api/team/accept/'
            ) + f'?token={token}'
            
            send_team_invitation_email(
                inviter_name=self.request.user.get_full_name() or self.request.user.email,
                invitee_email=team_member.email,
                enterprise_name=enterprise.name,
                invite_url=accept_url
            )
            
            # Log successful email sending
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f'Sent invitation email to {team_member.email} for enterprise {enterprise.id}')
            
        except Exception as e:
            # Log the error but don't fail the request
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Failed to send invitation email: {str(e)}', exc_info=True)

    @action(detail=False, methods=['get', 'post'], 
             permission_classes=[permissions.AllowAny],
             authentication_classes=[])
    def accept(self, request):
        # For GET requests, show a form or redirect
        if request.method == 'GET':
            token = request.query_params.get('token', '').strip()
            if not token:
                return Response({'detail': 'Token is required'}, status=400)
                
            try:
                member = TeamMember.objects.get(
                    invitation_token=token, 
                    status=TeamMember.STATUS_INVITED
                )
                
                if member.invitation_expires_at and member.invitation_expires_at < timezone.now():
                    return Response({'detail': 'Invitation has expired'}, status=400)
                
                # If it's a GET request, we'll return the member details for the frontend
                return Response({
                    'detail': 'Valid invitation',
                    'enterprise_name': member.enterprise.name,
                    'invited_by': member.invited_by.get_full_name() or member.invited_by.email,
                    'email': member.email,
                    'token': token
                })
                
            except TeamMember.DoesNotExist:
                return Response({'detail': 'Invalid or expired token'}, status=400)
        
        # For POST requests, process the acceptance
        elif request.method == 'POST':
            token = (request.data.get('token') or '').strip()
            if not token:
                return Response({'detail': 'Token is required'}, status=400)
                
            try:
                member = TeamMember.objects.get(
                    invitation_token=token, 
                    status=TeamMember.STATUS_INVITED
                )
                
                if member.invitation_expires_at and member.invitation_expires_at < timezone.now():
                    return Response({'detail': 'Invitation has expired'}, status=400)
                
                # If user is already registered, link them
                if request.user.is_authenticated:
                    member.user = request.user
                
                # Update the member status to active
                member.status = TeamMember.STATUS_ACTIVE
                member.accepted_at = timezone.now()
                member.save()
                
                return Response({
                    'detail': 'Invitation accepted successfully',
                    'enterprise_id': member.enterprise_id,
                    'enterprise_name': member.enterprise.name,
                    'is_authenticated': request.user.is_authenticated,
                    'redirect_url': '/login/' if not request.user.is_authenticated else f'/enterprise/{member.enterprise_id}/'
                })
                
            except TeamMember.DoesNotExist:
                return Response({'detail': 'Invalid or expired token'}, status=400)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.generic import TemplateView


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger = logging.getLogger(__name__)
        logger.info(f"Registration request received. Data: {request.data}")
        
        try:
            full_name = request.data.get('full_name', '')
            email = (request.data.get('email') or '').strip().lower()
            password = request.data.get('password')
            phone = request.data.get('phone', '').strip()
            
            logger.debug(f"Processing registration for email: {email}")
            
            # Validate required fields
            if not email or not password:
                error_msg = "Email and password are required"
                logger.warning(f"Validation failed: {error_msg}")
                return Response({"detail": error_msg}, status=400)
            
            # Validate email format
            try:
                from django.core.validators import validate_email
                validate_email(email)
            except ValidationError as e:
                error_msg = f"Invalid email format: {str(e)}"
                logger.warning(error_msg)
                return Response({"detail": error_msg}, status=400)
            
            # Check for existing user
            User = get_user_model()
            if User.objects.filter(email=email).exists():
                error_msg = f"Email {email} is already registered."
                logger.warning(error_msg)
                return Response({"detail": error_msg}, status=400)
            
            # Create user
            first_name = full_name.split(' ')[0] if full_name else ''
            last_name = ' '.join(full_name.split(' ')[1:]) if ' ' in full_name else ''
            
            logger.debug(f"Creating user: email={email}, first_name={first_name}, last_name={last_name}")
            
            user = User.objects.create_user(
                email=email, 
                password=password, 
                first_name=first_name, 
                last_name=last_name, 
                username=email, 
                phone=phone
            )
            
            logger.info(f"User {user.id} created successfully")
            
            # Send verification email
            try:
                base_url = compute_public_base_url(request)
                logger.info(f"Sending verification email to {email} with base URL: {base_url}")
                
                # Use the enhanced send_verification_email function
                email_sent = send_verification_email(request, user, base_url)
                
                response_data = {
                    "id": user.id,
                    "email": user.email,
                    "detail": "Registration successful. Please check your email to verify your account.",
                    "email_sent": email_sent
                }
                
                if not email_sent:
                    logger.error(f"Failed to send verification email to {email}")
                    response_data["warning"] = "We couldn't send a verification email. Please try logging in to request a new verification email."
                else:
                    logger.info(f"Verification email sent to {email}")
                
                return Response(response_data, status=201)
                
            except Exception as e:
                logger.error(f"Error during email sending for {email}: {str(e)}", exc_info=True)
                # Still return success but indicate email wasn't sent
                return Response({
                    "id": user.id,
                    "email": user.email,
                    "detail": "Registration successful, but there was an issue sending the verification email.",
                    "warning": "Please try logging in to request a new verification email.",
                    "email_sent": False
                }, status=201)
                
        except Exception as e:
            logger.error(f"Unexpected error during registration: {str(e)}", exc_info=True)
            return Response({
                "detail": "An error occurred during registration. Please try again.",
                "error": str(e)
            }, status=500)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        u = request.user
        avatar_url = ''
        try:
            if getattr(u, 'avatar', None) and u.avatar:
                # Build full URL for avatar
                avatar_relative = u.avatar.url
                # If it's already a full URL, use it; otherwise build it
                if avatar_relative.startswith('http'):
                    avatar_url = avatar_relative
                else:
                    # Use request to build absolute URL
                    avatar_url = request.build_absolute_uri(avatar_relative)
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
from django.core.exceptions import ValidationError


class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        logger = logging.getLogger(__name__)
        file = request.FILES.get('avatar')
        if not file:
            return Response({'detail': 'avatar file is required'}, status=400)
        
        # Validate file size (max 5MB)
        if file.size > 5 * 1024 * 1024:
            return Response({'detail': 'File size exceeds 5MB limit'}, status=400)
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            return Response({'detail': f'Invalid file type. Allowed: {", ".join(allowed_types)}'}, status=400)
        
        try:
            u = request.user
            # Delete old avatar if it exists
            if u.avatar:
                try:
                    u.avatar.delete(save=False)
                except Exception as e:
                    logger.warning(f"Could not delete old avatar: {str(e)}")
            
            u.avatar = file
            u.save(update_fields=['avatar'])
            
            # Build full URL for avatar
            avatar_relative = getattr(u.avatar, 'url', '')
            if avatar_relative.startswith('http'):
                avatar_url = avatar_relative
            else:
                # Use request to build absolute URL
                avatar_url = request.build_absolute_uri(avatar_relative)
            
            logger.info(f"Avatar uploaded successfully for user {u.id}: {avatar_url}")
            return Response({'avatar_url': avatar_url})
        except Exception as e:
            logger.error(f"Error uploading avatar for user {request.user.id}: {str(e)}", exc_info=True)
            return Response({'detail': f'Error uploading avatar: {str(e)}'}, status=500)


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
        logger = logging.getLogger(__name__)
        # Optionally require a confirmation phrase
        confirm = request.data.get('confirm', '')
        user = request.user
        user_id = user.id
        user_email = user.email
        
        logger.info(f"Account deletion requested for user {user_id} ({user_email})")
        
        try:
            # Delete related data first to avoid foreign key constraint issues
            from .models import Enterprise, QuestionResponse, ScoreSummary, EmailOTP, PhoneOTP, ActionItem, TeamMember
            
            # Delete user's enterprises and related data
            enterprises = Enterprise.objects.filter(owner=user)
            for enterprise in enterprises:
                # Delete enterprise-related data
                QuestionResponse.objects.filter(enterprise=enterprise).delete()
                ScoreSummary.objects.filter(enterprise=enterprise).delete()
                ActionItem.objects.filter(enterprise=enterprise).delete()
                TeamMember.objects.filter(enterprise=enterprise).delete()
            
            # Delete user's other data
            EmailOTP.objects.filter(user=user).delete()
            PhoneOTP.objects.filter(user=user).delete()
            ActionItem.objects.filter(owner=user).delete()
            
            # Delete enterprises
            enterprises.delete()
            
            # Finally delete the user
            user.delete()
            
            logger.info(f"Successfully deleted account for user {user_id} ({user_email})")
            return Response({'detail': 'Account deleted successfully'}, status=200)
            
        except Exception as e:
            logger.error(f'Account deletion failed for user {user_id}: {str(e)}', exc_info=True)
            return Response({
                'detail': 'Failed to delete account',
                'error': str(e)
            }, status=500)


from .models import NotificationPreference, ScoreSummary, QuestionResponse, AssessmentSession

class AssessmentSessionDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Received DELETE request for assessment session {pk} from user {request.user.id}")
        
        try:
            # Get the assessment session and verify the user has permission
            assessment = AssessmentSession.objects.select_related('enterprise').get(pk=pk)
            
            # Check if the user is the owner of the enterprise
            if assessment.enterprise.owner_id != request.user.id:
                logger.warning(f"User {request.user.id} is not the owner of enterprise {assessment.enterprise_id}")
                return Response(
                    {"detail": "You don't have permission to delete this assessment session."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            logger.info(f"Found assessment session: {assessment.id} for enterprise: {assessment.enterprise_id}")
            
            # Delete the assessment session
            assessment_id = assessment.id
            assessment.delete()
            logger.info(f"Successfully deleted assessment session {assessment_id}")
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except AssessmentSession.DoesNotExist:
            logger.warning(f"Assessment session {pk} not found")
            return Response(
                {"detail": "The requested assessment session does not exist or has already been deleted."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.exception(f"Error deleting assessment session {pk}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




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
                return Response({'detail': 'Enterprise not found'}, status=404)
        else:
            e = Enterprise.objects.filter(owner=request.user).order_by('id').first()
            if not e:
                # Return empty structure instead of 404 to allow frontend to handle gracefully
                return Response({
                    'id': None,
                    'name': '',
                    'location': '',
                    'year_founded': None,
                    'legal_structure': '',
                    'description': '',
                    'full_time_employees_total': None,
                    'part_time_employees_total': None,
                    'revenue_this_year': None,
                    'exists': False
                }, status=200)
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
            'exists': True
        }
        return Response(data)

    def put(self, request, pk=None):
        from .models import Enterprise
        # Upsert behavior: create enterprise if missing
        e = None
        if pk:
            try:
                e = Enterprise.objects.get(pk=pk, owner=request.user)
            except Enterprise.DoesNotExist:
                return Response({'detail': 'Not found'}, status=404)
        else:
            e = Enterprise.objects.filter(owner=request.user).order_by('id').first()
            if not e:
                # create minimal enterprise and then update
                name = request.data.get('name') or 'My Enterprise'
                e = Enterprise.objects.create(owner=request.user, name=name)
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

        # Build a URL to the frontend reset page, honoring proxy/public base URL
        base = compute_public_base_url(request)
        confirm_url = f"{base}/reset-password?uid={uidb64}&token={token}"

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
        # Require email verification only
        has_email_verified = EmailOTP.objects.filter(user=request.user, is_verified=True).exists()
        if not has_email_verified:
            return Response({"detail": "Verification required", "needs_otp": True}, status=403)
        
        enterprises_count = Enterprise.objects.filter(owner=request.user).count()
        summaries = ScoreSummary.objects.select_related('enterprise').filter(enterprise__owner=request.user)
        overall = [float(s.overall_percentage or 0) for s in summaries]
        latest_overall = overall[-1] if overall else 0
        return Response({
            "enterprises": enterprises_count,
            "latest_overall_percentage": latest_overall,
        })


class MyAssessmentStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import ActionItem, AssessmentSession, ScoreSummary, Category

        # Get user's enterprises
        enterprises = Enterprise.objects.filter(owner=request.user)
        
        # Count completed assessments
        completed = AssessmentSession.objects.filter(enterprise__in=enterprises).count()
        
        # Action items summary
        open_items = ActionItem.objects.filter(owner=request.user).exclude(status=ActionItem.STATUS_COMPLETED)
        high_priority = open_items.filter(priority=ActionItem.PRIORITY_HIGH).count()

        # Get score summaries for all enterprises
        summaries = ScoreSummary.objects.filter(enterprise__in=enterprises).select_related('enterprise')
        
        # Calculate greatest improvement
        greatest_improvement = None
        if summaries.count() > 1:
            # Get the two most recent summaries for each enterprise
            enterprises_with_improvement = []
            for enterprise in enterprises:
                enterprise_summaries = summaries.filter(enterprise=enterprise).order_by('-created_at')[:2]
                if len(enterprise_summaries) == 2:
                    latest, previous = enterprise_summaries
                    improvement = float(latest.overall_percentage or 0) - float(previous.overall_percentage or 0)
                    if improvement > 0:  # Only show positive improvements
                        enterprises_with_improvement.append({
                            'enterprise': enterprise.name,
                            'improvement': improvement
                        })
            
            if enterprises_with_improvement:
                # Find the enterprise with the greatest improvement
                greatest = max(enterprises_with_improvement, key=lambda x: x['improvement'])
                greatest_improvement = {
                    'enterprise': greatest['enterprise'],
                    'improvement': round(greatest['improvement'], 1)
                }

        # Find priority focus area (category with lowest score)
        priority_focus = None
        if summaries.exists():
            # Get the latest summary
            latest_summary = summaries.latest('created_at')
            
            # Get section scores from JSONField
            section_scores = latest_summary.section_scores or {}
            category_scores = []
            
            # Extract category scores from section_scores JSON
            for category_name, score_data in section_scores.items():
                if isinstance(score_data, dict):
                    percentage = score_data.get('percentage', 0)
                    if percentage and percentage > 0:
                        category_scores.append({
                            'name': category_name,
                            'score': float(percentage)
                        })
            
            if category_scores:
                # Find the category with the lowest score
                lowest_category = min(category_scores, key=lambda x: x['score'])
                priority_focus = {
                    'category': lowest_category['name'],
                    'score': round(lowest_category['score'], 1)
                }

        return Response({
            'assessments_completed': completed,
            'open_action_items': open_items.count(),
            'high_priority_actions': high_priority,
            'greatest_improvement': greatest_improvement,
            'priority_focus': priority_focus
        })


class MyAssessmentSessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import AssessmentSession
        enterprises = Enterprise.objects.filter(owner=request.user)
        sessions = (
            AssessmentSession.objects
            .filter(enterprise__in=enterprises)
            .select_related('enterprise')
            .order_by('-created_at')
        )
        results = []
        for s in sessions:
            results.append({
                'id': s.id,
                'enterprise_id': s.enterprise_id,
                'enterprise_name': s.enterprise.name,
                'created_at': s.created_at,
                'overall_percentage': s.overall_percentage,
                'section_scores': getattr(s, 'section_scores', {}),
            })
        return Response({'results': results})


from django.utils import timezone
from datetime import timedelta
import random
from django.core.mail import send_mail
from django.conf import settings
import requests
import os
from .services import recompute_and_store_summary
from django.shortcuts import redirect
from django.contrib.auth import get_user_model
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
import logging

logger = logging.getLogger(__name__)


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
        # Redirect to login with next=dashboard to complete the flow
        from django.shortcuts import redirect
        return redirect('/login?verified=1')


class VerifyEmailLinkView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        uidb64 = request.GET.get('uid', '')
        code = request.GET.get('code', '')
        
        logger = logging.getLogger(__name__)
        logger.info(f"Email verification attempt - UID: {uidb64}, Code: {code}")
        
        # Get frontend URL for redirects
        frontend_url = os.environ.get('FRONTEND_URL') or os.environ.get('PUBLIC_BASE_URL', 'http://localhost:8085')
        frontend_url = frontend_url.rstrip('/')
        
        if not uidb64 or not code:
            logger.error("Missing UID or code in verification request")
            # Redirect to verification status page with error
            return redirect(f"{frontend_url}/verification-status?verification=error&message=invalid_link")
        
        User = get_user_model()
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
            logger.info(f"Found user: {user.email} (ID: {user.id})")
        except (User.DoesNotExist, ValueError, TypeError, OverflowError) as e:
            logger.error(f"Invalid UID: {uidb64}, Error: {str(e)}")
            # Redirect to verification status page with error
            return redirect(f"{frontend_url}/verification-status?verification=error&message=invalid_link")
            
        now = timezone.now()
        # Try to find unused OTP first, then fall back to any unverified OTP
        otp = (
            EmailOTP.objects
            .filter(user=user, code=code, is_verified=False, is_used=False)
            .order_by('-created_at')
            .first()
        )
        # If no unused OTP found, try any unverified OTP (for backward compatibility)
        if not otp:
            otp = (
                EmailOTP.objects
                .filter(user=user, code=code, is_verified=False)
                .order_by('-created_at')
                .first()
            )
        
        if not otp:
            if EmailOTP.objects.filter(user=user, is_verified=True).exists():
                logger.info(f"User {user.email} already verified")
                # Redirect to verification status page with success message
                return redirect(f"{frontend_url}/verification-status?verification=success&message=already_verified")
            
            logger.error(f"No valid OTP found for user {user.email}")
            # Redirect to verification status page with error
            return redirect(f"{frontend_url}/verification-status?verification=error&message=expired_link")
        
        if otp.expires_at < now:
            logger.error(f"OTP expired for user {user.email}")
            # Redirect to verification status page with error
            return redirect(f"{frontend_url}/verification-status?verification=error&message=expired_link")
        
        # Mark as verified
        otp.is_verified = True
        otp.is_used = True
        otp.save(update_fields=['is_verified', 'is_used', 'updated_at'])
        
        if hasattr(user, 'email_verified') and not user.email_verified:
            user.email_verified = True
            user.save(update_fields=['email_verified', 'updated_at'])
        
        logger.info(f"Successfully verified email for user: {user.email}")
        
        # Redirect to verification status page with success message
        return redirect(f"{frontend_url}/verification-status?verification=success&message=email_verified")
class AuthStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        has_email_verified = EmailOTP.objects.filter(user=request.user, is_verified=True).exists()
        user_phone = ''
        try:
            user_phone = request.user.phone
        except Exception:
            user_phone = ''
        return Response({
            "verified": bool(has_email_verified),
            "has_email_verified": has_email_verified,
            "has_phone_verified": False,
            "phone": user_phone,
        })


class MyEnterprisesSummariesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Return all enterprises owned by current user with their latest summary
        enterprises = Enterprise.objects.filter(owner=request.user).order_by('name')
        data = []
        for e in enterprises:
            # Determine if any responses exist for this enterprise (used by UI)
            has_responses = QuestionResponse.objects.filter(enterprise=e).exists()
            summary = ScoreSummary.objects.filter(enterprise=e).order_by('-updated_at').first()
            
            # Only compute summary if responses exist - don't create 0% assessments for new enterprises
            if not summary and has_responses:
                summary = recompute_and_store_summary(e)
            
            data.append({
                'id': e.id,
                'name': e.name,
                'overall_percentage': summary.overall_percentage if summary else None,  # Use None instead of 0 to indicate no assessment yet
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

# API Views Only - Template views have been removed as they're now handled by the frontend

class ResendVerificationEmail(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        logger = logging.getLogger(__name__)
        email = request.data.get('email')
        if not email:
            logger.warning("Resend verification email request missing email parameter")
            return Response({"detail": "Email is required"}, status=400)
        
        email = email.strip().lower()
        logger.info(f"Resend verification email request for: {email}")
            
        User = get_user_model()
        try:
            user = User.objects.get(email__iexact=email)
            logger.info(f"Found user: {user.id} for email: {email}")
            
            # Check if already verified
            from .models import EmailOTP
            if EmailOTP.objects.filter(user=user, is_verified=True).exists():
                logger.info(f"User {user.id} already verified, skipping resend")
                return Response({"detail": "Email is already verified"}, status=400)
                
            # Resend verification email
            try:
                base = compute_public_base_url(request)
                logger.info(f"Computed base URL for resend: {base}")
                logger.info(f"Request method: {request.method}, Request path: {request.path}")
                
                email_sent = send_verification_email(request, user, base)
                
                if email_sent:
                    logger.info(f"✅ Successfully resent verification email to {email}")
                    return Response({
                        "detail": "Verification email has been resent. Please check your inbox.",
                        "email": email,
                        "sent": True
                    })
                else:
                    logger.error(f"❌ send_verification_email returned False for {email}")
                    return Response({
                        "detail": "Failed to send verification email. Please try again later.",
                        "email": email,
                        "sent": False
                    }, status=500)
            except Exception as e:
                logger.error(f"❌ Exception sending verification email to {email}: {str(e)}", exc_info=True)
                return Response({
                    "detail": f"Error sending email: {str(e)}",
                    "email": email,
                    "error": str(e)
                }, status=500)
                
        except User.DoesNotExist:
            logger.warning(f"Resend verification requested for non-existent email: {email}")
            return Response({"detail": "No account found with this email"}, status=404)
        except Exception as e:
            logger.error(f"Unexpected error in ResendVerificationEmail: {str(e)}", exc_info=True)
            return Response({"detail": "An error occurred. Please try again later."}, status=500)


from django.shortcuts import render


class NotificationPreferenceView(APIView):
    """
    API endpoint for managing user notification preferences.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get the notification preferences for the current user.
        Creates a new preference object if one doesn't exist.
        """
        pref, created = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(pref)
        return Response(serializer.data)

    def put(self, request):
        """
        Update the notification preferences for the current user.
        Creates a new preference object if one doesn't exist.
        """
        pref, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(pref, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TestNotificationView(APIView):
    """
    Test endpoint to send a test notification email.
    This helps verify that notification preferences and email sending are working.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Send a test notification email to the current user.
        Respects the user's email_notifications preference.
        """
        from django.core.mail import send_mail
        from .models import NotificationPreference
        
        user = request.user
        pref, _ = NotificationPreference.objects.get_or_create(user=user)
        
        # Check if user has email notifications enabled
        if not pref.email_notifications:
            return Response({
                'detail': 'Email notifications are disabled. Enable them in Settings → Notifications to receive test emails.',
                'email_notifications_enabled': False
            }, status=400)
        
        # Send test email
        try:
            subject = 'Test Notification from Kigali Business Lab'
            message = f"""
Hello {user.get_full_name() or user.email},

This is a test notification to verify that your email notifications are working correctly.

If you received this email, it means:
✅ Your email notifications are enabled
✅ The email system is configured correctly
✅ You will receive notifications for important updates

You can manage your notification preferences in your account settings.

Best regards,
Kigali Business Lab Team
            """.strip()
            
            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #01497f 0%, #0277bd 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }}
        .header h1 {{ color: white; margin: 0; font-size: 24px; }}
        .content {{ background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }}
        .success {{ background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Notification</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{user.get_full_name() or user.email}</strong>,</p>
            <p>This is a test notification to verify that your email notifications are working correctly.</p>
            <div class="success">
                <strong>✅ Success!</strong> If you received this email, it means:
                <ul>
                    <li>Your email notifications are enabled</li>
                    <li>The email system is configured correctly</li>
                    <li>You will receive notifications for important updates</li>
                </ul>
            </div>
            <p>You can manage your notification preferences in your account settings.</p>
            <div class="footer">
                <p>Kigali Business Lab Team</p>
            </div>
        </div>
    </div>
</body>
</html>
            """.strip()
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            return Response({
                'detail': 'Test notification sent successfully! Check your email inbox.',
                'email': user.email,
                'email_notifications_enabled': True
            })
            
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send test notification: {str(e)}")
            return Response({
                'detail': f'Failed to send test notification: {str(e)}',
                'error': str(e)
            }, status=500)


# Create your views here.
