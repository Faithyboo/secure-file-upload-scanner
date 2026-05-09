# Secure File Upload Scanner

Flask-based secure file upload scanner for a software engineering internship project.

## Features

- File upload with validation rules
- Classification: Safe / Warning / Blocked
- SHA-256 file hashing
- Admin authentication with hashed password
- SQLite scan history
- Dashboard statistics
- CSV export
- Record deletion
- Dark mode toggle

## Quick Start

1. Create and activate virtual environment
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Run:
   - `python app.py`
4. Open:
   - `http://127.0.0.1:5000`

## Admin Credentials

- Username: `admin`
- Password: `admin123`

Change these immediately in production.

## Deployment (Render)

- Set start command to: `gunicorn app:app`
