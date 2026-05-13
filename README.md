# Secure Scanner (Django + Bootstrap + SQLite)

This project is now a complete Python Django web app with:
- Backend: Django
- Database: SQLite
- Frontend: HTML, CSS, JavaScript, Bootstrap

## Features
- File upload and scan
- SHA-256 hashing
- File risk status (`SAFE`, `WARNING`, `BLOCKED`)
- Admin login/logout
- Dashboard stats
- History page (delete one or clear all)
- CSV export

## Run locally (Windows)

1. Install Python dependencies:
   `python -m pip install -r requirements.txt`
2. Run migrations:
   `python manage.py makemigrations`
   `python manage.py migrate`
3. Create admin user:
   `python manage.py createsuperuser`
4. Start server:
   `python manage.py runserver`
5. Open:
   `http://127.0.0.1:8000/`

## Project structure
- `security_project/` Django project config
- `core/` scanner app (models, views, URLs)
- `templates/` HTML templates
- `static/css/` custom CSS
- `static/js/` custom JavaScript
- `media/` uploaded files
