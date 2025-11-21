from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import os
import logging
from django.core.mail import send_mail, EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags
from datetime import timedelta
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.conf import settings

# FIX: Import from the main models module, not utils.models
from ..models import EmailOTP

logger = logging.getLogger(__name__)

def send_verification_email(request, user, base_url: str) -> bool:
    """
    Create/refresh an EmailOTP and send an HTML email with a verification button.
    Returns True if email was sent successfully, False otherwise.
    """
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
        
        # In production, verification link should point to backend API directly
        # In development, it can go through proxy
        backend_url = os.environ.get('BACKEND_BASE_URL') or os.environ.get('PUBLIC_BASE_URL') or base_url
        if not backend_url.endswith('/api'):
            backend_url = backend_url.rstrip('/')
            # If it's a frontend URL, we need to use backend URL instead
            if 'vercel.app' in backend_url or 'localhost:3000' in backend_url or 'localhost:8085' in backend_url:
                # Use BACKEND_BASE_URL if available, otherwise construct from PUBLIC_BASE_URL
                backend_url = os.environ.get('BACKEND_BASE_URL', backend_url)
        verification_url = f"{backend_url.rstrip('/')}/api/auth/verify-email/?uid={uidb64}&code={code}"
        
        logger.debug(f"Base URL: {base_url}")
        logger.debug(f"Verification URL: {verification_url}")

        # For email display context
        if base_url.startswith('https://'):
            protocol = 'https'
            domain = base_url[8:]  # Remove 'https://'
        elif base_url.startswith('http://'):
            protocol = 'http' 
            domain = base_url[7:]  # Remove 'http://'
        else:
            protocol = 'https'
            domain = base_url
        
        # Remove any path from domain
        domain = domain.split('/')[0]
        
        context = {
            'user': user,
            'protocol': protocol,
            'domain': domain,
            'uid': uidb64,
            'code': code,
            'verification_url': verification_url,
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


def compute_public_base_url(request) -> str:
    """Compute a public-facing base URL for the frontend using headers or env."""
    # 1. Check PUBLIC_BASE_URL environment variable (set in docker-compose)
    public_url = os.environ.get('PUBLIC_BASE_URL')
    if public_url:
        return public_url.rstrip('/')
        
    # 2. Check FRONTEND_URL environment variable
    frontend_url = os.environ.get('FRONTEND_URL')
    if frontend_url:
        return frontend_url.rstrip('/')
    
    # 3. Try to get from headers (when behind proxy)
    proto = request.META.get('HTTP_X_FORWARDED_PROTO') or ('https' if request.is_secure() else 'http')
    host = request.META.get('HTTP_X_FORWARDED_HOST') or request.get_host()
    
    # 4. If we're running in development mode, default to localhost:8085 (proxy port)
    if settings.DEBUG and (host.startswith('localhost:') or host.startswith('127.0.0.1:')):
        return 'http://localhost:8085'  # Nginx proxy runs on port 8085
    
    # 5. Fallback to the computed proto+host
    base_url = f"{proto}://{host}".rstrip('/')
    
    return base_url


def get_backend_base_url() -> str:
    """Get the backend server base URL for internal use."""
    # Use BACKEND_BASE_URL for direct backend access
    backend_url = os.environ.get('BACKEND_BASE_URL')
    if backend_url:
        return backend_url.rstrip('/')
    
    # Default to direct backend in development
    if settings.DEBUG:
        return 'http://localhost:8000'
    
    # In production, this might be different
    return 'http://localhost:8000'


def send_team_invitation_email(inviter_name, invitee_email, enterprise_name, invite_url):
    """
    Send an email to invite a team member to join an enterprise
    """
    subject = f"You've been invited to join {enterprise_name} on Kigali Business Lab"
    
    # Create the email context
    context = {
        'inviter_name': inviter_name,
        'enterprise_name': enterprise_name,
        'accept_url': invite_url,
    }
    
    # Render the HTML email template
    html_message = render_to_string('emails/team_invitation.html', context)
    plain_message = strip_tags(html_message)
    
    # Send the email
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invitee_email],
        html_message=html_message,
        fail_silently=False,
    )