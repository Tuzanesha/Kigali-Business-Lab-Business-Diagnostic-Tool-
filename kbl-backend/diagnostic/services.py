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
        updated = EmailOTP.objects.filter(user=user).update(is_used=True)
        logger.debug(f"Invalidated {updated} existing OTPs for user {user.email}")
        
        # Create new OTP
        otp = EmailOTP.objects.create(
            user=user, 
            code=code, 
            expires_at=expires,
            is_used=False,
            is_verified=False
        )
        logger.debug(f"Created new OTP with ID: {otp.id}, expires at: {expires}")

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        verify_url = f"{base_url.rstrip('/')}/api/auth/verify-email/?uid={uidb64}&code={code}"
        logger.debug(f"Generated verification URL: {verify_url}")

        context = {
            'user': user,
            'brand': 'Kigali Business Lab',
            'verify_url': verify_url,
        }

        subject = 'Verify your email address for Kigali Business Lab'
        
        # Ensure the email template exists
        template_path = 'emails/verify_email.html'
        logger.debug(f"Using email template: {template_path}")
        
        # Render HTML and plain text versions
        try:
            html_body = render_to_string(template_path, context)
            logger.debug("Successfully rendered HTML email template")
        except Exception as e:
            logger.error(f"Failed to render email template: {str(e)}", exc_info=True)
            return False
            
        text_body = (
            f"Welcome to {context['brand']}!\n\n"
            "Please verify your email by opening the following link:\n"
            f"{verify_url}\n\n"
            "This link will be valid for 24 hours.\n\n"
            "If you didn't create an account, you can safely ignore this email."
        )

        # Get email settings
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kigalibusinesslab.rw')
        logger.debug(f"Email settings - From: {from_email}, To: {user.email}")
        logger.debug(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Not set')}")
        logger.debug(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Not set')}")
        logger.debug(f"EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Not set')}")
        
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=from_email,
                to=[user.email],
                reply_to=[getattr(settings, 'DEFAULT_REPLY_TO', from_email)]
            )
            msg.attach_alternative(html_body, 'text/html')
            
            # Log the email details regardless of DEBUG mode
            logger.info("\n" + "="*80)
            logger.info(f"Sending email to {user.email}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Verification URL: {verify_url}")
            logger.info("="*80 + "\n")
            
            # In development, still try to send the email but log it
            if settings.DEBUG:
                logger.info("DEBUG MODE: Attempting to send real email...")
                
            # Send the email regardless of DEBUG mode
            logger.debug("Attempting to connect to SMTP server...")
            try:
                connection = get_connection()
                connection.open()
                logger.debug("Successfully connected to SMTP server")
                
                # Send the email
                logger.debug("Sending email...")
                msg.send(fail_silently=False)
                connection.close()
                
                logger.info(f"Successfully sent verification email to {user.email}")
                return True
            except Exception as e:
                logger.error(f"Failed to send email: {str(e)}", exc_info=True)
                return False
            
        except Exception as e:
            logger.error(f"Failed to send email to {user.email}", exc_info=True)
            return False
        
    except Exception as e:
        logger.error(f"Unexpected error in send_verification_email: {str(e)}", exc_info=True)
        return False


def compute_public_base_url(request) -> str:
    """Compute a public-facing base URL using headers or env.
    Precedence:
    1) PUBLIC_BASE_URL env var
    2) FRONTEND_URL env var (for local development)
    3) X-Forwarded-Proto + X-Forwarded-Host
    4) request.scheme + request.get_host()
    5) Default to http://localhost:3000 for development
    """
    # 1. Check PUBLIC_BASE_URL environment variable
    public_url = os.environ.get('PUBLIC_BASE_URL')
    if public_url:
        return public_url.rstrip('/')
        
    # 2. Check FRONTEND_URL environment variable (for local development)
    frontend_url = os.environ.get('FRONTEND_URL')
    if frontend_url:
        return frontend_url.rstrip('/')
    
    # 3. Try to get from headers
    proto = request.META.get('HTTP_X_FORWARDED_PROTO') or ('https' if request.is_secure() else 'http')
    host = request.META.get('HTTP_X_FORWARDED_HOST') or request.get_host()
    
    # 4. If we're running in development mode, default to localhost:3000 (frontend)
    if settings.DEBUG and (host.startswith('localhost:') or host.startswith('127.0.0.1:')):
        return 'http://localhost:3000'
    
    # 5. Fallback to the computed proto+host
    return f"{proto}://{host}".rstrip('/')

