from django.db import models
from django.contrib.auth import get_user_model


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

    def __str__(self) -> str:
        return f"{self.category.name} {self.number}"


class Enterprise(TimeStampedModel):
    owner = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='enterprises')
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
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"OTP for {self.user.email} (verified={self.is_verified})"


class PhoneOTP(TimeStampedModel):
    user = models.ForeignKey(User, related_name='phone_otps', on_delete=models.CASCADE)
    phone = models.CharField(max_length=32)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"Phone OTP for {self.user_id}:{self.phone} (verified={self.is_verified})"


class NotificationPreference(TimeStampedModel):
    user = models.OneToOneField(User, related_name='notification_prefs', on_delete=models.CASCADE)
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=False)
    weekly_reports = models.BooleanField(default=True)
    marketing_communications = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"Notification prefs for {self.user_id}"

