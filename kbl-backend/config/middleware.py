"""
Custom middleware to ensure CORS headers are always sent, even on errors
"""
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from corsheaders.middleware import CorsMiddleware


class CorsErrorHandlingMiddleware(MiddlewareMixin):
    """
    Ensures CORS headers are added to error responses
    """
    def process_response(self, request, response):
        # Let CORS middleware handle it first
        cors_middleware = CorsMiddleware(get_response=None)
        response = cors_middleware.process_response(request, response)
        return response

