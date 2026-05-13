import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY: Use DJANGO_SECRET_KEY on Render. Locally we fall back to a dummy value.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "insecure-local-secret-key")

# Production safety: use environment variables in deployment.
DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() in {"1", "true", "yes", "on"}

# If you want strict production behavior, set RENDER=true in Render and keep a real DJANGO_SECRET_KEY.
_RENDER = os.environ.get("RENDER", "").lower() in {"1", "true", "yes", "on"}
if _RENDER and not os.environ.get("DJANGO_SECRET_KEY"):
    raise RuntimeError("DJANGO_SECRET_KEY must be set in Render environment.")


ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",") if h.strip()
]


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "core.apps.CoreConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# WhiteNoise (Render-compatible static serving)
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = False
WHITENOISE_MANIFEST_STRICT = False

# Render uses HTTPS; set in Render environment if you want stricter behavior
# (Render already terminates TLS).


ROOT_URLCONF = "security_project.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "security_project.wsgi.application"
ASGI_APPLICATION = "security_project.asgi.application"

# Database configuration
# Locally defaults to SQLite, but on Render we use DATABASE_URL (PostgreSQL).
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# If Render provides DATABASE_URL, switch to Postgres.
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    import dj_database_url

    DATABASES["default"] = dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=True)


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# CSRF trusted origins for production domains (optional)
# Example: DJANGO_CSRF_TRUSTED_ORIGINS="https://yourapp.onrender.com"
CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()
]

STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LOGIN_REDIRECT_URL = "/dashboard/"
LOGOUT_REDIRECT_URL = "/"
LOGIN_URL = "/login/"

# Security headers / cookie hardening (recommended for production)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# When behind HTTPS (e.g., Render), enable these in production.
# You can force via env var DJANGO_FORCE_HTTPS=true.
_FORCE_HTTPS = os.environ.get("DJANGO_FORCE_HTTPS", "false").lower() in {"1", "true", "yes", "on"}

SECURE_SSL_REDIRECT = _FORCE_HTTPS
SESSION_COOKIE_SECURE = _FORCE_HTTPS
CSRF_COOKIE_SECURE = _FORCE_HTTPS

# HSTS only makes sense over HTTPS.
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_HSTS_SECONDS", "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = os.environ.get("DJANGO_HSTS_PRELOAD", "false").lower() in {"1", "true", "yes", "on"}

# Safer cookie defaults
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False

