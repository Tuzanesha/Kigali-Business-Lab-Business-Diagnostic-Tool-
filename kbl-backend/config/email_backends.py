"""
Custom email backends for Django
"""
import logging
import os
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage, EmailMultiAlternatives
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, Content, HtmlContent, PlainTextContent

logger = logging.getLogger(__name__)


class SendGridEmailBackend(BaseEmailBackend):
    """
    SendGrid email backend using the SendGrid Python SDK
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = os.getenv('SENDGRID_API_KEY', '')
        self.from_email = os.getenv('DEFAULT_FROM_EMAIL', '')
        self.from_name = os.getenv('DEFAULT_FROM_NAME', 'Kigali Business Lab')
        
        if not self.api_key:
            logger.warning("SENDGRID_API_KEY not set. SendGrid backend will fail.")
        
        if not self.from_email:
            logger.warning("DEFAULT_FROM_EMAIL not set. Using default.")
            self.from_email = 'noreply@kigalibusinesslab.rw'
    
    def send_messages(self, email_messages):
        """
        Send one or more EmailMessage objects and return the number of emails sent.
        """
        if not self.api_key:
            if not self.fail_silently:
                raise ValueError("SENDGRID_API_KEY is required for SendGrid backend")
            return 0
        
        if not email_messages:
            return 0
        
        num_sent = 0
        sg = SendGridAPIClient(api_key=self.api_key)
        
        for message in email_messages:
            try:
                # Extract email details
                to_emails = message.to
                if not to_emails:
                    logger.warning("No recipients in email message")
                    continue
                
                # Use message.from_email if set, otherwise use default
                from_email = message.from_email or self.from_email
                
                # Create SendGrid Mail object
                mail = Mail(
                    from_email=Email(from_email, self.from_name),
                    to_emails=to_emails,
                    subject=message.subject
                )
                
                # Handle email content
                # Check if message has HTML content
                html_content = None
                text_content = None
                
                if isinstance(message, EmailMultiAlternatives):
                    for content, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            html_content = content
                        elif mimetype == 'text/plain':
                            text_content = content
                
                # Use body as text content if no alternatives
                if not text_content and message.body:
                    text_content = message.body
                
                # Set content
                if html_content:
                    mail.content = HtmlContent(html_content)
                    if text_content:
                        # SendGrid will automatically create plain text from HTML if only HTML is provided
                        # But we can add both
                        pass
                elif text_content:
                    mail.content = PlainTextContent(text_content)
                else:
                    logger.warning(f"No content found in email message to {to_emails}")
                    continue
                
                # Add text content as alternative if HTML is present
                if html_content and text_content:
                    # SendGrid prefers HTML, but we'll set both
                    mail.content = HtmlContent(html_content)
                    # Note: SendGrid will use HTML as primary, text as fallback
                
                # Handle CC and BCC
                if hasattr(message, 'cc') and message.cc:
                    mail.cc = message.cc
                
                if hasattr(message, 'bcc') and message.bcc:
                    mail.bcc = message.bcc
                
                # Handle reply-to
                if hasattr(message, 'reply_to') and message.reply_to:
                    mail.reply_to = Email(message.reply_to[0] if isinstance(message.reply_to, list) else message.reply_to)
                
                # Send email
                response = sg.send(mail)
                
                # Check response status
                if response.status_code >= 200 and response.status_code < 300:
                    num_sent += 1
                    logger.info(f"✅ Successfully sent email via SendGrid to {to_emails}")
                else:
                    logger.error(f"❌ SendGrid returned status {response.status_code}: {response.body}")
                    if not self.fail_silently:
                        raise Exception(f"SendGrid API error: {response.status_code} - {response.body}")
            
            except Exception as e:
                logger.error(f"❌ Failed to send email via SendGrid to {to_emails if 'to_emails' in locals() else 'unknown'}: {str(e)}", exc_info=True)
                if not self.fail_silently:
                    raise
        
        return num_sent

