import csv
import hashlib
import io
import os
import re
import sqlite3
from datetime import datetime
from functools import wraps
from uuid import uuid4

from flask import (
    Flask,
    Response,
    flash,
    g,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
UPLOAD_DIR = os.path.join(INSTANCE_DIR, "uploads")
DB_PATH = os.path.join(INSTANCE_DIR, "scanner.db")

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "jpg", "jpeg", "png"}
BLOCKED_EXTENSIONS = {"exe", "bat", "cmd", "js", "vbs", "msi", "sh", "ps1"}
SUSPICIOUS_PATTERNS = ["virus", "malware", "shell", "payload", "exploit", "hack", "trojan"]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

app = Flask(__name__)
app.config["SECRET_KEY"] = "replace-this-secret-in-production"
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE


def ensure_folders():
    os.makedirs(INSTANCE_DIR, exist_ok=True)
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_filename TEXT NOT NULL,
            saved_filename TEXT NOT NULL,
            extension TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_hash TEXT NOT NULL,
            status TEXT NOT NULL,
            reason TEXT NOT NULL,
            scan_date TEXT NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
        """
    )
    db.commit()
    seed_admin(db)


def seed_admin(db):
    existing_admin = db.execute("SELECT id FROM admin WHERE username = ?", ("admin",)).fetchone()
    if existing_admin:
        return
    db.execute(
        "INSERT INTO admin (username, password_hash) VALUES (?, ?)",
        ("admin", generate_password_hash("admin123")),
    )
    db.commit()


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("admin_logged_in"):
            flash("Please login as admin first.", "warning")
            return redirect(url_for("admin_login"))
        return fn(*args, **kwargs)

    return wrapper


def extension_from_filename(filename):
    parts = filename.rsplit(".", 1)
    if len(parts) != 2:
        return ""
    return parts[1].lower()


def has_double_extension(filename):
    parts = filename.lower().split(".")
    if len(parts) < 3:
        return False
    second_last = parts[-2]
    last = parts[-1]
    return second_last in ALLOWED_EXTENSIONS and last in BLOCKED_EXTENSIONS


def is_suspicious_filename(filename):
    lowered = filename.lower()
    if re.search(r"[^a-zA-Z0-9._-]", filename):
        return True
    return any(pattern in lowered for pattern in SUSPICIOUS_PATTERNS)


def classify_file(filename, file_size):
    extension = extension_from_filename(filename)
    reasons = []
    status = "Safe"

    if file_size <= 0:
        reasons.append("Empty file is not allowed.")
        return "Blocked", reasons, extension

    if file_size > MAX_FILE_SIZE:
        reasons.append("File exceeds maximum size of 5 MB.")
        return "Blocked", reasons, extension

    if has_double_extension(filename):
        reasons.append("Double extension detected.")
        status = "Warning"

    if extension in BLOCKED_EXTENSIONS:
        reasons.append("Blocked extension detected.")
        return "Blocked", reasons, extension

    if extension not in ALLOWED_EXTENSIONS:
        reasons.append("Extension is not in approved list.")
        return "Blocked", reasons, extension

    if is_suspicious_filename(filename):
        reasons.append("Suspicious filename pattern detected.")
        status = "Warning" if status != "Blocked" else "Blocked"

    if not reasons:
        reasons.append("File passed all validation checks.")

    return status, reasons, extension


def file_sha256(file_bytes):
    digest = hashlib.sha256()
    digest.update(file_bytes)
    return digest.hexdigest()


@app.route("/")
def home():
    theme = request.cookies.get("theme", "dark")
    return render_template("home.html", theme=theme)


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/upload", methods=["GET", "POST"])
def upload():
    if request.method == "GET":
        return render_template("upload.html")

    uploaded = request.files.get("file")
    if not uploaded or uploaded.filename == "":
        flash("Please select a file to upload.", "danger")
        return redirect(url_for("upload"))

    original_filename = uploaded.filename
    safe_input_name = secure_filename(original_filename)

    file_bytes = uploaded.read()
    file_size = len(file_bytes)

    status, reasons, extension = classify_file(safe_input_name, file_size)
    hash_value = file_sha256(file_bytes)
    saved_filename = f"{uuid4().hex}_{safe_input_name}"

    if status != "Blocked":
        target_path = os.path.join(UPLOAD_DIR, saved_filename)
        with open(target_path, "wb") as f:
            f.write(file_bytes)
    else:
        saved_filename = "not_saved_blocked"

    scan_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    reason_text = " ".join(reasons)

    db = get_db()
    db.execute(
        """
        INSERT INTO scan_history (
            original_filename, saved_filename, extension, file_size,
            file_hash, status, reason, scan_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            original_filename,
            saved_filename,
            extension or "none",
            file_size,
            hash_value,
            status,
            reason_text,
            scan_date,
        ),
    )
    db.commit()

    result = {
        "original_filename": original_filename,
        "saved_filename": saved_filename,
        "extension": extension or "none",
        "file_size": file_size,
        "file_hash": hash_value,
        "status": status,
        "reason": reason_text,
        "scan_date": scan_date,
    }
    return render_template("result.html", result=result)


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "GET":
        return render_template("admin_login.html")

    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    db = get_db()
    admin = db.execute("SELECT * FROM admin WHERE username = ?", (username,)).fetchone()

    if not admin or not check_password_hash(admin["password_hash"], password):
        flash("Invalid username or password.", "danger")
        return redirect(url_for("admin_login"))

    session["admin_logged_in"] = True
    session["admin_username"] = username
    flash("Login successful.", "success")
    return redirect(url_for("dashboard"))


@app.route("/admin/logout")
@login_required
def admin_logout():
    session.clear()
    flash("Logged out successfully.", "info")
    return redirect(url_for("home"))


def history_rows():
    db = get_db()
    return db.execute("SELECT * FROM scan_history ORDER BY id DESC").fetchall()


def dashboard_data():
    rows = history_rows()
    total = len(rows)
    safe_count = sum(1 for row in rows if row["status"] == "Safe")
    warning_count = sum(1 for row in rows if row["status"] == "Warning")
    blocked_count = sum(1 for row in rows if row["status"] == "Blocked")

    ext_counter = {}
    for row in rows:
        ext = row["extension"]
        ext_counter[ext] = ext_counter.get(ext, 0) + 1

    most_common_type = "N/A"
    if ext_counter:
        most_common_type = max(ext_counter, key=ext_counter.get)

    return {
        "total": total,
        "safe": safe_count,
        "warning": warning_count,
        "blocked": blocked_count,
        "most_common_type": most_common_type,
    }


@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", stats=dashboard_data())


@app.route("/history")
@login_required
def history():
    return render_template("history.html", rows=history_rows())


@app.route("/history/export")
@login_required
def export_csv():
    rows = history_rows()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "Original Filename",
            "Saved Filename",
            "Extension",
            "File Size",
            "Hash",
            "Status",
            "Reason",
            "Scan Date",
        ]
    )
    for row in rows:
        writer.writerow(
            [
                row["id"],
                row["original_filename"],
                row["saved_filename"],
                row["extension"],
                row["file_size"],
                row["file_hash"],
                row["status"],
                row["reason"],
                row["scan_date"],
            ]
        )

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=scan_history.csv"},
    )


@app.route("/history/delete/<int:scan_id>", methods=["POST"])
@login_required
def delete_record(scan_id):
    db = get_db()
    db.execute("DELETE FROM scan_history WHERE id = ?", (scan_id,))
    db.commit()
    flash("Record deleted.", "success")
    return redirect(url_for("history"))


@app.route("/history/delete-all", methods=["POST"])
@login_required
def delete_all_records():
    db = get_db()
    db.execute("DELETE FROM scan_history")
    db.commit()
    flash("All records deleted.", "warning")
    return redirect(url_for("history"))


with app.app_context():
    ensure_folders()
    init_db()


if __name__ == "__main__":
    app.run(debug=True)
