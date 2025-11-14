from django.contrib import admin
from .models import Category, Question, Enterprise, QuestionResponse, ScoreSummary, Attachment


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "weight", "created_at", "updated_at")
    search_fields = ("name",)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "category", "number", "priority", "weight", "created_at")
    list_filter = ("category", "priority")
    search_fields = ("number", "text")


@admin.register(Enterprise)
class EnterpriseAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "status", "created_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("name", "email")


@admin.register(QuestionResponse)
class QuestionResponseAdmin(admin.ModelAdmin):
    list_display = ("id", "enterprise", "question", "score", "created_at")
    list_filter = ("enterprise", "question__category")
    search_fields = ("enterprise__name", "question__number")


@admin.register(ScoreSummary)
class ScoreSummaryAdmin(admin.ModelAdmin):
    list_display = ("id", "enterprise", "overall_percentage", "calculated_at")
    readonly_fields = ("calculated_at",)


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("id", "response", "file", "uploaded_at")
    list_filter = ("uploaded_at",)

# Register your models here.
