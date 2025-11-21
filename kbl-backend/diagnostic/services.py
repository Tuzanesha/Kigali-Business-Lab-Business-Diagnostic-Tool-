from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import os
import logging
from django.core.mail import send_mail, EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils import timezone
from datetime import timedelta
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.conf import settings
from .models import EmailOTP
import logging
import re
import requests

from django.db.models import Prefetch
from django.utils import timezone
from datetime import timedelta
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from .models import Enterprise, QuestionResponse, Question, Category, ScoreSummary, EmailOTP, AssessmentSession


IMMEDIATE_PRIORITY_SET = {1, 2}


@dataclass
class SectionScore:
    weighted_total: int
    max_total: int

    @property
    def percentage(self) -> float:
        if self.max_total == 0:
            return 0.0
        return (self.weighted_total / self.max_total) * 100.0


def _question_ratio(score: int, weight: int) -> Tuple[int, int]:
    if score < 0:
        return 0, 0
    clamped = max(0, min(score, 4))
    weighted = clamped * weight
    max_per_q = weight * 4
    return weighted, max_per_q


def compute_scores_for_enterprise(enterprise: Enterprise) -> Dict:
    responses = (
        QuestionResponse.objects
        .filter(enterprise=enterprise)
        .select_related('question', 'question__category')
    )

    section_accumulator: Dict[int, SectionScore] = {}
    priorities: Dict[str, Dict] = {}

    for response in responses:
        question: Question = response.question
        category: Category = question.category
        weighted, max_per_q = _question_ratio(response.score, question.weight)

        if category.id not in section_accumulator:
            section_accumulator[category.id] = SectionScore(0, 0)
        acc = section_accumulator[category.id]
        acc.weighted_total += weighted
        acc.max_total += max_per_q

        code = f"{question.number}"
        action_required = 'N'
        if response.score >= 0:
            if (question.priority in IMMEDIATE_PRIORITY_SET and response.score <= 2):
                action_required = 'Y'
        else:
            action_required = 'N'

        priorities[code] = {
            'priority': question.priority,
            'raw_score': None if response.score < 0 else response.score,
            'action_required': action_required,
        }

    section_scores_out: Dict[str, Dict] = {}
    total_weighted = 0
    total_max = 0
    for category in Category.objects.all():
        acc = section_accumulator.get(category.id, SectionScore(0, 0))
        section_scores_out[category.name] = {
            'weighted': acc.weighted_total,
            'perfect': acc.max_total,
            'percentage': round(acc.percentage, 2),
        }
        total_weighted += acc.weighted_total
        total_max += acc.max_total

    overall_percentage = round(((total_weighted / total_max) * 100.0) if total_max else 0.0, 2)

    return {
        'overall_percentage': overall_percentage,
        'section_scores': section_scores_out,
        'priorities': priorities,
    }


def recompute_and_store_summary(enterprise: Enterprise) -> ScoreSummary:
    data = compute_scores_for_enterprise(enterprise)
    summary, _ = ScoreSummary.objects.update_or_create(
        enterprise=enterprise,
        defaults={
            'overall_percentage': data['overall_percentage'],
            'section_scores': data['section_scores'],
            'priorities': data['priorities'],
        }
    )
    # Record a historical session as well
    try:
        AssessmentSession.objects.create(
            enterprise=enterprise,
            overall_percentage=data['overall_percentage'],
            section_scores=data['section_scores'],
            priorities=data['priorities'],
        )
    except Exception:
        pass
    return summary


def send_verification_email(request, user, base_url: str) -> bool:
    """
    Create/refresh an EmailOTP and send an HTML email with a verification button.
    Returns True if email was sent successfully, False otherwise.
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Attempting to send verification email to {user.email}")
    
    try:
        # Create a fresh OTP valid for 24 hours
        code = f"{os.urandom(16).hex()}"
        expires = timezone.now() + timedelta(hours=24)
        
        logger.debug(f"Generated OTP code: {code}")
        
        # Invalidate any existing OTPs for this user
        EmailOTP.objects.filter(user=user).update(is_used=True)
        
        # Create new OTP
        otp = EmailOTP.objects.create(
            user=user, 
            code=code, 
            expires_at=expires,
            is_used=False,
            is_verified=False
        )

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        
        # **CRITICAL FIX**: Use FRONTEND URL (proxy URL) for verification links
        # This ensures users can access the link through the frontend on port 8085
        # The proxy will forward /api/* requests to the backend
        frontend_url = compute_public_base_url(request)
        verification_url = f"{frontend_url}/api/auth/verify-email/?uid={uidb64}&code={code}"
        
        # Log the generated URL for debugging
        logger.debug(f"Frontend Base URL: {frontend_url}")
        logger.debug(f"Verification URL: {verification_url}")

        # For the email template, we still want to show the frontend domain for display
        if base_url.startswith('https://'):
            protocol = 'https'
            domain = base_url[8:]  # Remove 'https://'
        elif base_url.startswith('http://'):
            protocol = 'http' 
            domain = base_url[7:]  # Remove 'http://'
        else:
            protocol = 'https'
            domain = base_url
        
        # Remove any path from domain for display purposes
        domain = domain.split('/')[0]
        
        context = {
            'user': user,
            'protocol': protocol,
            'domain': domain,
            'uid': uidb64,
            'code': code,
            'verification_url': verification_url,  # This is the actual working link
        }

        subject = 'Verify your email address for Kigali Business Lab'
        template_path = 'emails/verify_email.html'
        
        # Render HTML email
        html_body = render_to_string(template_path, context)
        text_body = (
            f"Hello {user.first_name},\n\n"
            "Thank you for registering with Kigali Business Lab. "
            "Please verify your email address by clicking the link below:\n\n"
            f"{verification_url}\n\n"
            "If you did not create an account, please ignore this email.\n\n"
            "Best regards,\n"
            "Kigali Business Lab Team"
        )

        # Send email
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kigalibusinesslab.rw')
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_email,
            to=[user.email],
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)
        
        logger.info(f"✅ Successfully sent verification email to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send verification email: {str(e)}", exc_info=True)
        return False


def get_backend_base_url(request) -> str:
    """Get the backend server base URL for API endpoints."""
    # 1. Check BACKEND_BASE_URL environment variable
    backend_url = os.environ.get('BACKEND_BASE_URL')
    if backend_url:
        return backend_url.rstrip('/')
    
    # 2. In production, you might have a specific backend domain
    if hasattr(settings, 'BACKEND_BASE_URL'):
        return settings.BACKEND_BASE_URL.rstrip('/')
    
    # 3. Try to get from headers (when behind proxy)
    proto = request.META.get('HTTP_X_FORWARDED_PROTO') or ('https' if request.is_secure() else 'http')
    host = request.META.get('HTTP_X_FORWARDED_HOST') or request.get_host()
    
    # 4. For development, default to localhost:8000 (Django default)
    if settings.DEBUG and (host.startswith('localhost:') or host.startswith('127.0.0.1:')):
        # If frontend is on 8085, backend is likely on 8000
        return 'http://localhost:8000'
    
    # 5. Fallback to the computed proto+host
    base_url = f"{proto}://{host}".rstrip('/')
    
    # If the URL ends with /api, remove it since we'll be adding it back
    if base_url.endswith('/api'):
        base_url = base_url[:-4]
        
    return base_url


def compute_public_base_url(request) -> str:
    """Compute a public-facing base URL for the frontend using headers or env."""
    # 1. Check PUBLIC_BASE_URL first (proxy URL - port 8085)
    public_url = os.environ.get('PUBLIC_BASE_URL')
    if public_url:
        return public_url.rstrip('/')
    
    # 2. Check FRONTEND_URL environment variable (direct frontend - port 3000)
    frontend_url = os.environ.get('FRONTEND_URL')
    if frontend_url:
        return frontend_url.rstrip('/')
    
    # 3. Try to get from headers
    proto = request.META.get('HTTP_X_FORWARDED_PROTO') or ('https' if request.is_secure() else 'http')
    host = request.META.get('HTTP_X_FORWARDED_HOST') or request.get_host()
    
    # 4. If we're running in development mode, default to localhost:8085 (frontend port in docker-compose)
    if settings.DEBUG and (host.startswith('localhost:') or host.startswith('127.0.0.1:')):
        return 'http://localhost:8085'  # Frontend runs on port 8085 in docker
    
    # 5. Fallback to the computed proto+host
    base_url = f"{proto}://{host}".rstrip('/')
    
    # If the URL ends with /api, remove it since we'll be adding it back
    if base_url.endswith('/api'):
        base_url = base_url[:-4]
        
    return base_url