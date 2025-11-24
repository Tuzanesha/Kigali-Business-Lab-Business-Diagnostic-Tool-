from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings


User = get_user_model()


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.name


class Question(TimeStampedModel):
    category = models.ForeignKey(Category, related_name='questions', on_delete=models.CASCADE)
    number = models.CharField(max_length=10)
    priority = models.PositiveSmallIntegerField()
    text = models.TextField()
    descriptors = models.JSONField(help_text='Rubric for scores 0..4')
    evidence_prompt = models.TextField(blank=True)
    weight = models.IntegerField(default=4)

    class Meta:
        unique_together = ('category', 'number')
        indexes = [
            models.Index(fields=['category', 'number']),
            models.Index(fields=['category']),
        ]

    def __str__(self) -> str:
        return f"{self.category.name} {self.number}"


class Enterprise(TimeStampedModel):
    owner = models.OneToOneField(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='enterprise')
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    year_founded = models.IntegerField(null=True, blank=True)
    legal_structure = models.CharField(max_length=100, blank=True)
    owner_background = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    key_partners = models.TextField(blank=True)
    full_time_employees_total = models.IntegerField(default=0)
    full_time_employees_female = models.IntegerField(default=0)
    part_time_employees_total = models.IntegerField(default=0)
    part_time_employees_female = models.IntegerField(default=0)
    revenue_this_year = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    revenue_last_year = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    units_sold_this_year = models.CharField(max_length=100, blank=True)
    units_sold_last_year = models.CharField(max_length=100, blank=True)
    num_suppliers = models.IntegerField(null=True, blank=True)
    num_customers = models.IntegerField(null=True, blank=True)
    total_funding = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    short_term_plans = models.TextField(blank=True)
    medium_term_plans = models.TextField(blank=True)
    long_term_plans = models.TextField(blank=True)
    market_linkage_needs = models.TextField(blank=True)
    finance_needs_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    key_assistance_areas = models.TextField(blank=True)
    status = models.CharField(max_length=50, default='draft')

    def __str__(self) -> str:
        return self.name


class QuestionResponse(TimeStampedModel):
    enterprise = models.ForeignKey(Enterprise, related_name='responses', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, related_name='responses', on_delete=models.CASCADE)
    score = models.IntegerField(help_text='0..4, or -1 for NA')
    evidence = models.TextField(blank=True)
    comments = models.TextField(blank=True)

    class Meta:
        unique_together = ('enterprise', 'question')

    def __str__(self) -> str:
        return f"{self.enterprise.name} - {self.question.number}"


class ScoreSummary(TimeStampedModel):
    enterprise = models.OneToOneField(Enterprise, related_name='score_summary', on_delete=models.CASCADE)
    overall_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    section_scores = models.JSONField(default=dict)
    priorities = models.JSONField(default=dict)
    calculated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Summary for {self.enterprise.name}"


class AssessmentSession(TimeStampedModel):
    enterprise = models.ForeignKey(Enterprise, related_name='assessment_sessions', on_delete=models.CASCADE)
    overall_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    section_scores = models.JSONField(default=dict)
    priorities = models.JSONField(default=dict)

    def __str__(self) -> str:
        return f"Session {self.id} for {self.enterprise.name} at {self.created_at}"


def evidence_attachment_upload_path(instance: 'Attachment', filename: str) -> str:
    return f"evidence/{instance.response_id}/{filename}"


class Attachment(TimeStampedModel):
    response = models.ForeignKey(QuestionResponse, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to=evidence_attachment_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Attachment {self.id} for response {self.response_id}"


class EmailOTP(TimeStampedModel):
    user = models.ForeignKey(User, related_name='email_otps', on_delete=models.CASCADE)
    code = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self) -> str:
        return f"OTP for {self.user.email} (used={self.is_used}, verified={self.is_verified})"


class PhoneOTP(TimeStampedModel):
    user = models.ForeignKey(User, related_name='phone_otps', on_delete=models.CASCADE)
    phone = models.CharField(max_length=32)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"Phone OTP for {self.user_id}:{self.phone} (verified={self.is_verified})"





class ActionItem(TimeStampedModel):
    PRIORITY_HIGH = 'HIGH'
    PRIORITY_MEDIUM = 'MEDIUM'
    PRIORITY_LOW = 'LOW'
    PRIORITY_CHOICES = (
        (PRIORITY_HIGH, 'High'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_LOW, 'Low'),
    )

    STATUS_TODO = 'todo'
    STATUS_INPROGRESS = 'inprogress'
    STATUS_COMPLETED = 'completed'
    STATUS_CHOICES = (
        (STATUS_TODO, 'To Do'),
        (STATUS_INPROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
    )

    owner = models.ForeignKey(User, related_name='action_items', on_delete=models.CASCADE)
    enterprise = models.ForeignKey(Enterprise, related_name='action_items', on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    source = models.CharField(max_length=255, blank=True)
    priority = models.CharField(max_length=6, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    due_date = models.DateField(null=True, blank=True)
    assigned_to = models.CharField(max_length=128, blank=True, help_text='Assignee initials or identifier')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_TODO)
    order = models.IntegerField(default=0, help_text='Position within the status column')

    class Meta:
        ordering = ['status', 'order', 'id']

    def __str__(self) -> str:
        return f"{self.title} ({self.status})"


class TeamMember(TimeStampedModel):
    ROLE_ADMIN = 'ADMIN'
    ROLE_MANAGER = 'MANAGER'
    ROLE_MEMBER = 'MEMBER'
    ROLE_CHOICES = (
        (ROLE_ADMIN, 'Admin'),
        (ROLE_MANAGER, 'Manager'),
        (ROLE_MEMBER, 'Member'),
    )

    STATUS_INVITED = 'INVITED'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_REMOVED = 'REMOVED'
    STATUS_CHOICES = (
        (STATUS_INVITED, 'Invited'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_REMOVED, 'Removed'),
    )

    enterprise = models.ForeignKey(Enterprise, related_name='team_members', on_delete=models.CASCADE)
    email = models.EmailField()
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_INVITED)
    user = models.ForeignKey(User, null=True, blank=True, related_name='team_memberships', on_delete=models.SET_NULL)
    invitation_token = models.CharField(max_length=64, unique=True, null=True, blank=True)
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='invited_team_members')
    invitation_expires_at = models.DateTimeField(null=True, blank=True, help_text='When this invitation expires')
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'team_members'
        unique_together = [['enterprise', 'email']]

    def __str__(self) -> str:
        return f"{self.email} - {self.enterprise_id} ({self.role})"


class NotificationPreference(TimeStampedModel):
    """
    Model to store user notification preferences.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    email_notifications = models.BooleanField(
        default=True,
        help_text='Enable email notifications for important updates'
    )
    push_notifications = models.BooleanField(
        default=False,
        help_text='Enable push notifications on your device'
    )
    weekly_reports = models.BooleanField(
        default=True,
        help_text='Receive weekly summary reports'
    )
    marketing_communications = models.BooleanField(
        default=False,
        help_text='Receive marketing and promotional emails'
    )

    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'

    def __str__(self):
        return f"{self.user.email}'s notification preferences"
