from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import EmailTokenObtainPairView
from .views import (
    CategoryViewSet,
    QuestionViewSet,
    EnterpriseViewSet,
    QuestionResponseViewSet,
    ScoreSummaryViewSet,
    AttachmentViewSet,
    RegisterView,
    DashboardView,
    AuthStatusView,
    MyEnterprisesSummariesView,
    RecomputeAllSummariesView,
    EnterpriseReportView,
    LogoutView,
    MyAssessmentStatsView,
    MyAssessmentSessionsView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ProfileView,
    AvatarUploadView,
    AvatarRemoveView,
    ChangePasswordView,
    DeleteAccountView,
    NotificationPreferenceView,
    EnterpriseProfileView,
    ActionItemViewSet,
    TeamMemberViewSet,
    AssessmentSessionDeleteView,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'enterprises', EnterpriseViewSet, basename='enterprise')
router.register(r'responses', QuestionResponseViewSet, basename='response')
router.register(r'summaries', ScoreSummaryViewSet, basename='scoresummary')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'action-items', ActionItemViewSet, basename='actionitem')
router.register(r'team', TeamMemberViewSet, basename='teammember')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view()),
    path('auth/login/', EmailTokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    # Password reset API
    path('auth/password-reset/request/', PasswordResetRequestView.as_view()),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view()),
    path('dashboard/', DashboardView.as_view()),
    path('my/assessment-stats/', MyAssessmentStatsView.as_view()),
    path('my/assessment-sessions/', MyAssessmentSessionsView.as_view()),
    # Profile & account
    path('account/profile/', ProfileView.as_view()),
    path('account/avatar/upload/', AvatarUploadView.as_view()),
    path('account/avatar/remove/', AvatarRemoveView.as_view()),
    path('account/password/change/', ChangePasswordView.as_view()),
    path('account/delete/', DeleteAccountView.as_view()),
    # Notifications
    path('account/notifications/', NotificationPreferenceView.as_view()),
    # Enterprise profile (optional pk)
    path('enterprise/profile/', EnterpriseProfileView.as_view()),
    path('enterprise/<int:pk>/profile/', EnterpriseProfileView.as_view()),
    path('auth/send-otp/',  __import__('diagnostic.views', fromlist=['SendEmailOTPView']).SendEmailOTPView.as_view()),
    path('auth/verify-otp/',  __import__('diagnostic.views', fromlist=['VerifyEmailOTPView']).VerifyEmailOTPView.as_view()),
    # Public email verification via link (no auth required)
    path('auth/verify-email/', __import__('diagnostic.views', fromlist=['VerifyEmailLinkView']).VerifyEmailLinkView.as_view(), name='verify-email-link'),
    path('auth/status/', AuthStatusView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    path('my/enterprises-summaries/', MyEnterprisesSummariesView.as_view()),
    path('recompute/all/', RecomputeAllSummariesView.as_view()),
    path('enterprise/<int:pk>/report/', EnterpriseReportView.as_view()),
    
    # Assessment sessions endpoints
    path('assessment-sessions/<int:pk>/', AssessmentSessionDeleteView.as_view(), name='api-assessment-session-delete'),
    
    # Web routes have been removed as they're now handled by the frontend
]


