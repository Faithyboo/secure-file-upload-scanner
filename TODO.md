# TODO - Secure File Upload Scanner (Django)

## Step 1: Django project setup & configuration (approved)
- [x] Harden `security_project/settings.py` for production (security headers, cookie flags, DEBUG/ALLOWED_HOSTS via env).

- [x] Ensure static/media config is Render-friendly (`STATIC_ROOT`, `MEDIA_ROOT`, keep debug-only serving).

- [x] Add missing required route/pages wiring (e.g., About page) in `core/views.py` and `core/urls.py`, add `templates/about.html`.

- [x] Implement dark mode toggle: update `templates/base.html`, `static/css/styles.css`, and `static/js/app.js`.

- [x] Update any small template nav/auth link issues if found.

- [x] Run basic checks: `python manage.py check`, `python manage.py collectstatic`.


