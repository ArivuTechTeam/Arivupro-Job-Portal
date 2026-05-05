"""
Django settings for ExamReview - CA/CS/CMA Exam Preparation Platform
"""

import os
import sys
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent
# Add backend directory to Python path so Django apps can be imported
sys.path.insert(0, str(BASE_DIR))

# Load .env file — pure Python, no third-party dependency needed
_env_file = BASE_DIR / '.env'
if _env_file.exists():
    with open(_env_file, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith('#') and '=' in _line:
                _k, _, _v = _line.partition('=')
                os.environ.setdefault(_k.strip(), _v.strip())

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-change-this-in-production-immediately')

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'corsheaders',
    'django_filters',
    # Local apps
    'apps.accounts',
    'apps.exams',
    'apps.evaluator',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.exam_review.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.exam_review.wsgi.application'

# ─── Database ─────────────────────────────────────────────────────────────────
# Supports three modes (in priority order):
#   1. DATABASE_URL env var (single Supabase/PostgreSQL connection string)
#   2. Individual DB_* env vars (Supabase or any PostgreSQL host)
#   3. SQLite fallback for local development without a DB
DATABASE_URL = os.environ.get('DATABASE_URL', '')

if DATABASE_URL:
    import dj_database_url
    DATABASES = {'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=600, ssl_require=True)}
elif os.environ.get('DB_HOST', ''):
    DATABASES = {
        'default': {
            'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.postgresql'),
            'NAME': os.environ.get('DB_NAME', 'postgres'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', ''),
            'PORT': os.environ.get('DB_PORT', '5432'),
            'OPTIONS': {
                'sslmode': 'require',  # Supabase requires SSL
            },
        }
    }
else:
    # Local SQLite fallback
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ─── Supabase Configuration ───────────────────────────────────────────────────
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
USE_SUPABASE_STORAGE = os.environ.get('USE_SUPABASE_STORAGE', 'False').lower() == 'true'
SUPABASE_STORAGE_BUCKET = os.environ.get('SUPABASE_STORAGE_BUCKET', 'answer-scripts')

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=6),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',')

# ─── File Storage ─────────────────────────────────────────────────────────────
# Development: files saved to local media/ folder.
# Production:  set USE_SUPABASE_STORAGE=True and supply Supabase S3 credentials
#              to store all uploaded PDFs in Supabase Storage (persistent).
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024

if USE_SUPABASE_STORAGE and SUPABASE_URL:
    # Derive project ref from URL: https://xxxx.supabase.co → xxxx
    _supabase_project_ref = SUPABASE_URL.replace('https://', '').split('.')[0]

    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_S3_ENDPOINT_URL  = f'https://{_supabase_project_ref}.supabase.co/storage/v1/s3'
    AWS_ACCESS_KEY_ID    = os.environ.get('SUPABASE_S3_ACCESS_KEY', '')
    AWS_SECRET_ACCESS_KEY = os.environ.get('SUPABASE_S3_SECRET_KEY', '')
    AWS_STORAGE_BUCKET_NAME = SUPABASE_STORAGE_BUCKET
    AWS_S3_REGION_NAME   = 'us-east-1'
    AWS_DEFAULT_ACL      = 'public-read'
    AWS_QUERYSTRING_AUTH = False
    # Public URL prefix so Django can build absolute file URLs
    MEDIA_URL = f'{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/'
    MEDIA_ROOT = BASE_DIR / 'media'  # unused in prod, kept for collectstatic safety
else:
    MEDIA_URL  = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# AI Configuration
# Primary: OpenRouter (routes to Claude claude-sonnet-4.5)
# Fallback: OpenAI direct
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')
# OPENROUTER_MODEL: explicit env var wins; else fall back to AI_MODEL; else use default
OPENROUTER_MODEL   = (
    os.environ.get('OPENROUTER_MODEL', '')
    or os.environ.get('AI_MODEL', 'anthropic/claude-sonnet-4-5')
)
OPENAI_API_KEY     = os.environ.get('OPENAI_API_KEY', '')
ANTHROPIC_API_KEY  = os.environ.get('ANTHROPIC_API_KEY', '')
AI_MODEL           = os.environ.get('AI_MODEL', 'anthropic/claude-sonnet-4-5')
CLAUDE_MODEL       = os.environ.get('CLAUDE_MODEL', 'claude-haiku-4-5-20251001')

# Email (Gmail SMTP or any SMTP provider)
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', f'ArivuPro <noreply@arivupro.com>')
OTP_EXPIRY_SECONDS = 600  # 10 minutes

# Admin self-registration secret code
# Change this to a strong secret before going to production
ADMIN_REGISTRATION_CODE = os.environ.get('ADMIN_REGISTRATION_CODE', 'ARIVUPRO-ADMIN-2024')

# Cache (for OTP storage)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'arivupro-otp-cache',
    }
}

# Firebase removed — notifications handled via Django Notification model + REST API

# Exam types supported
EXAM_TYPES = [
    ('CA', 'Chartered Accountant'),
    ('CS', 'Company Secretary'),
    ('CMA', 'Cost & Management Accountant'),
]

EXAM_LEVELS = {
    'CA': ['Foundation', 'Intermediate', 'Final'],
    'CS': ['Foundation', 'Executive', 'Professional'],
    'CMA': ['Foundation', 'Intermediate', 'Final'],
}
