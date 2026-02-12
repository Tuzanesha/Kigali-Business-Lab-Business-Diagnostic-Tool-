"""
Custom email backends for Django.

This module currently provides a Resend-based email backend that plugs into
Django's standard `send_mail` / `EmailMessage` / `EmailMultiAlternatives`
APIs, so the rest of the application does not need to change.
"""

import logging
import os
from typing import Iterable

from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage, EmailMultiAlternatives

import resend

logger = logging.getLogger(__name__)


class ResendEmailBackend(BaseEmailBackend):
    """
    Email backend that sends mail using the Resend API.
    """

    def __init__(self, fail_silently: bool = False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = os.getenv("RESEND_API_KEY", "")
        self.from_email_default = os.getenv(
            "DEFAULT_FROM_EMAIL", "noreply@kigalibusinesslab.rw"
        )
        self.from_name = os.getenv("DEFAULT_FROM_NAME", "Kigali Business Lab")

        if not self.api_key:
            logger.warning(
                "RESEND_API_KEY not set. Resend backend will fail for outbound email."
            )

    def _get_from_address(self, message: EmailMessage) -> str:
        """
        Build the 'from' address in the format Resend expects.
        """
        raw_from = getattr(message, "from_email", None) or self.from_email_default
        # Format: "Name <email@example.com>" if a name is provided
        if self.from_name:
            return f"{self.from_name} <{raw_from}>"
        return raw_from

    def _extract_content(self, message: EmailMessage) -> tuple[str | None, str | None]:
        """
        Extract text and HTML bodies from a Django EmailMessage/EmailMultiAlternatives.
        Returns (text, html).
        """
        text_content: str | None = None
        html_content: str | None = None

        if isinstance(message, EmailMultiAlternatives):
            # Alternatives can contain HTML or other mime types
            for content, mimetype in getattr(message, "alternatives", []) or []:
                if mimetype == "text/html":
                    html_content = content
                elif mimetype == "text/plain":
                    text_content = content

        # If no explicit text content from alternatives, fall back to body
        if not text_content and getattr(message, "body", ""):
            text_content = message.body

        return text_content, html_content

    def send_messages(self, email_messages: Iterable[EmailMessage]) -> int:
        """
        Send one or more EmailMessage objects and return the number of emails sent.
        """
        if not self.api_key:
            if not self.fail_silently:
                raise ValueError("RESEND_API_KEY is required for Resend backend")
            return 0

        # Configure the global API key for the Resend SDK
        resend.api_key = self.api_key

        if not email_messages:
            return 0

        num_sent = 0

        for message in email_messages:
            try:
                to_emails = getattr(message, "to", None)
                if not to_emails:
                    logger.warning("No recipients in email message; skipping send.")
                    continue

                from_address = self._get_from_address(message)
                text_content, html_content = self._extract_content(message)

                if not text_content and not html_content:
                    logger.warning(
                        "No content found in email message to %s; skipping send.",
                        to_emails,
                    )
                    continue

                payload: dict = {
                    "from": from_address,
                    "to": list(to_emails),
                    "subject": getattr(message, "subject", "") or "",
                }

                if html_content:
                    payload["html"] = html_content
                if text_content:
                    payload["text"] = text_content

                # Optional fields: cc, bcc, reply_to
                if getattr(message, "cc", None):
                    payload["cc"] = list(message.cc)
                if getattr(message, "bcc", None):
                    payload["bcc"] = list(message.bcc)
                if getattr(message, "reply_to", None):
                    # Django's reply_to is a list; Resend accepts a string or list
                    payload["reply_to"] = (
                        message.reply_to
                        if isinstance(message.reply_to, (list, tuple))
                        else [message.reply_to]
                    )

                # NOTE: Attachments are not currently mapped. If needed in future,
                # they can be added here using Resend's attachments API.

                logger.debug("Sending email via Resend: %s", payload)
                resend.Emails.send(payload)
                num_sent += 1
                logger.info("✅ Successfully sent email via Resend to %s", to_emails)

            except Exception as e:
                logger.error(
                    "❌ Failed to send email via Resend to %s: %s",
                    to_emails if "to_emails" in locals() else "unknown",
                    str(e),
                    exc_info=True,
                )
                if not self.fail_silently:
                    raise

        return num_sent
