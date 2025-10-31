from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

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
