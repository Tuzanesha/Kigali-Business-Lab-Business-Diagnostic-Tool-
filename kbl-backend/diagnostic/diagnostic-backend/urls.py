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
    LoginPageView,
    SignupPageView,
    DashboardPageView,
    EnterpriseCreatePageView,
    AssessmentPageView,
    VerifyPageView,
    AuthStatusView,
    SendPhoneOTPView,
    VerifyPhoneOTPView,
    MyEnterprisesSummariesView,
    RecomputeAllSummariesView,
    EnterpriseReportView,
    AssessmentReportPageView,
    LogoutView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    PasswordResetRequestPageView,
    PasswordResetConfirmPageView,
    ProfileView,
    AvatarUploadView,
    AvatarRemoveView,
    ChangePasswordView,
    DeleteAccountView,
    NotificationPreferenceView,
    EnterpriseProfileView,
    SettingsPageView,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'enterprises', EnterpriseViewSet, basename='enterprise')
router.register(r'responses', QuestionResponseViewSet, basename='response')
router.register(r'summaries', ScoreSummaryViewSet, basename='scoresummary')
router.register(r'attachments', AttachmentViewSet, basename='attachment')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view()),
    path('auth/login/', EmailTokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    # Password reset API
    path('auth/password-reset/request/', PasswordResetRequestView.as_view()),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view()),
    path('dashboard/', DashboardView.as_view()),
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
    path('auth/send-phone-otp/',  __import__('diagnostic.views', fromlist=['SendPhoneOTPView']).SendPhoneOTPView.as_view()),
    path('auth/verify-phone-otp/',  __import__('diagnostic.views', fromlist=['VerifyPhoneOTPView']).VerifyPhoneOTPView.as_view()),
    path('auth/status/', AuthStatusView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    path('my/enterprises-summaries/', MyEnterprisesSummariesView.as_view()),
    path('recompute/all/', RecomputeAllSummariesView.as_view()),
    path('enterprise/<int:pk>/report/', EnterpriseReportView.as_view()),
    # Minimal web pages
    path('web/login/', LoginPageView.as_view()),
    path('web/signup/', SignupPageView.as_view()),
    path('web/dashboard/', DashboardPageView.as_view()),
    path('web/verify/', VerifyPageView.as_view()),
    path('web/password-reset/', PasswordResetRequestPageView.as_view()),
    path('web/password-reset/confirm/', PasswordResetConfirmPageView.as_view()),
    path('web/settings/', SettingsPageView.as_view()),
    path('web/enterprise/new/', EnterpriseCreatePageView.as_view()),
    path('web/assessment/', AssessmentPageView.as_view()),
    path('web/assessment-report/', AssessmentReportPageView.as_view()),
]


