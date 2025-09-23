from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
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
    path('auth/login/', TokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('dashboard/', DashboardView.as_view()),
    path('auth/send-otp/',  __import__('diagnostic.views', fromlist=['SendEmailOTPView']).SendEmailOTPView.as_view()),
    path('auth/verify-otp/',  __import__('diagnostic.views', fromlist=['VerifyEmailOTPView']).VerifyEmailOTPView.as_view()),
    path('auth/send-phone-otp/',  __import__('diagnostic.views', fromlist=['SendPhoneOTPView']).SendPhoneOTPView.as_view()),
    path('auth/verify-phone-otp/',  __import__('diagnostic.views', fromlist=['VerifyPhoneOTPView']).VerifyPhoneOTPView.as_view()),
    path('auth/status/', AuthStatusView.as_view()),
    # Minimal web pages
    path('web/login/', LoginPageView.as_view()),
    path('web/signup/', SignupPageView.as_view()),
    path('web/dashboard/', DashboardPageView.as_view()),
    path('web/verify/', VerifyPageView.as_view()),
    path('web/enterprise/new/', EnterpriseCreatePageView.as_view()),
    path('web/assessment/', AssessmentPageView.as_view()),
]


