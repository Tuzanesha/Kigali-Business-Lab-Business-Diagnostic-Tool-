from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import os
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

from .models import Enterprise, QuestionResponse, Question, Category, ScoreSummary, EmailOTP


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
    return summary


def send_sms_vonage(phone: str, text: str):
    api_key = os.environ.get('VONAGE_API_KEY')
    api_secret = os.environ.get('VONAGE_API_SECRET')
    sender = os.environ.get('VONAGE_FROM')  # must be your Vonage number

    if not (api_key and api_secret and sender):
        return False, 'Vonage not configured', {}

    try:
        resp = requests.post(
            'https://rest.nexmo.com/sms/json',
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            data={
                'api_key': api_key,
                'api_secret': api_secret,
                'to': phone,
                'from': sender,
                'text': text,
            },
            timeout=15
        )
        body = resp.json()
        logging.info("Vonage response: %s", body)

        msgs = body.get('messages', []) if isinstance(body, dict) else []
        if msgs and msgs[0].get('status') == '0':
            return True, '', {'provider': 'vonage', 'response': body}
        return False, msgs[0].get('error-text', 'Unknown error'), {'provider': 'vonage', 'response': body}

    except Exception as e:
        logging.exception("Vonage request failed")
        return False, str(e), {}



def send_verification_email(request, user, base_url: str) -> None:
    """
    Create/refresh an EmailOTP and send an HTML email with a verification button.
    """
    # Create a fresh OTP valid for 24 hours
    code = f"{os.urandom(16).hex()}"
    expires = timezone.now() + timedelta(hours=24)
    EmailOTP.objects.create(user=user, code=code, expires_at=expires)

    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    verify_url = f"{base_url.rstrip('/')}/api/auth/verify-email/?uid={uidb64}&code={code}"

    context = {
        'user': user,
        'brand': 'Kigali Business Lab',
        'verify_url': verify_url,
    }

    subject = 'Verify your email'
    html_body = render_to_string('email/verify_email.html', context)
    text_body = (
        f"Welcome to {context['brand']}!\n\n"
        "Please verify your email by opening the following link:\n"
        f"{verify_url}\n\n"
        "This link will be valid for a limited time."
    )

    msg = EmailMultiAlternatives(subject, text_body, to=[user.email])
    msg.attach_alternative(html_body, 'text/html')
    msg.send(fail_silently=False)


def compute_public_base_url(request) -> str:
    """Compute a public-facing base URL using headers or env.
    Precedence:
    1) PUBLIC_BASE_URL env var
    2) X-Forwarded-Proto + X-Forwarded-Host
    3) request.scheme + request.get_host()
    """
    env = os.environ.get('PUBLIC_BASE_URL')
    if env:
        return env.rstrip('/')
    proto = request.META.get('HTTP_X_FORWARDED_PROTO') or ('https' if request.is_secure() else 'http')
    host = request.META.get('HTTP_X_FORWARDED_HOST') or request.get_host()
    return f"{proto}://{host}".rstrip('/')

