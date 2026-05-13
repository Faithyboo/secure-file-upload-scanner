import csv
import hashlib
import os
import uuid
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render

from .models import ScanRecord

ALLOWED_EXTENSIONS = ["pdf", "docx", "txt", "jpg", "jpeg", "png"]
BLOCKED_EXTENSIONS = ["exe", "bat", "cmd", "js", "vbs", "msi", "sh", "ps1"]
SUSPICIOUS_KEYWORDS = ["virus", "hack", "crack", "malware", "exploit"]
MAX_FILE_SIZE = 10 * 1024 * 1024


def _analyze_file(filename: str, file_size: int) -> tuple[str, str]:
    ext = os.path.splitext(filename)[1].lower().replace(".", "")
    if ext in BLOCKED_EXTENSIONS:
        return "BLOCKED", f"Restricted extension detected: .{ext}"
    if ext and ext not in ALLOWED_EXTENSIONS:
        return "WARNING", f"Unrecognized extension: .{ext}"
    if filename.count(".") > 1:
        return "BLOCKED", "Possible double extension detected"
    if any(keyword in filename.lower() for keyword in SUSPICIOUS_KEYWORDS):
        return "WARNING", "Suspicious keyword detected in filename"
    if file_size > MAX_FILE_SIZE:
        return "WARNING", "File size exceeds 10MB security threshold"
    return "SAFE", "No immediate threats detected by static analysis"


def home(request):
    return render(request, "home.html")


def about(request):
    return render(request, "about.html")



def scan_file(request):
    if request.method != "POST" or "file" not in request.FILES:
        messages.error(request, "Choose a file to scan.")
        return redirect("home")

    uploaded = request.FILES["file"]
    if uploaded.size > MAX_FILE_SIZE:
        messages.error(request, "File too large. Max size is 10MB.")
        return redirect("home")

    ext = os.path.splitext(uploaded.name)[1].lower()
    saved_filename = f"upload-{uuid.uuid4().hex[:8]}{ext}"
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    filepath = settings.MEDIA_ROOT / saved_filename

    with open(filepath, "wb+") as destination:
        for chunk in uploaded.chunks():
            destination.write(chunk)

    digest = hashlib.sha256()
    with open(filepath, "rb") as file_handle:
        for chunk in iter(lambda: file_handle.read(4096), b""):
            digest.update(chunk)
    file_hash = digest.hexdigest()

    status, reason = _analyze_file(uploaded.name, uploaded.size)
    record = ScanRecord.objects.create(
        original_filename=uploaded.name,
        saved_filename=saved_filename,
        extension=ext.replace(".", ""),
        file_size=uploaded.size,
        file_hash=file_hash,
        status=status,
        reason=reason,
    )
    return render(request, "result.html", {"record": record})


@login_required
def history_page(request):
    records = ScanRecord.objects.all()
    return render(request, "history.html", {"records": records})


@login_required
def dashboard_page(request):
    total = ScanRecord.objects.count()
    safe = ScanRecord.objects.filter(status="SAFE").count()
    warning = ScanRecord.objects.filter(status="WARNING").count()
    blocked = ScanRecord.objects.filter(status="BLOCKED").count()
    common = (
        ScanRecord.objects.values("extension")
        .annotate(count=Count("id"))
        .order_by("-count")
        .first()
    )
    context = {
        "total": total,
        "safe": safe,
        "warning": warning,
        "blocked": blocked,
        "most_common": common["extension"] if common else "N/A",
    }
    return render(request, "dashboard.html", context)


@login_required
def delete_record(request, pk):
    if request.method == "POST":
        record = get_object_or_404(ScanRecord, pk=pk)
        record.delete()
    return redirect("history")


@login_required
def clear_history(request):
    if request.method == "POST":
        ScanRecord.objects.all().delete()
    return redirect("history")


@login_required
def export_csv(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="scan_history.csv"'
    writer = csv.writer(response)
    writer.writerow(["ID", "Original Name", "Status", "Hash", "Size", "Date"])
    for record in ScanRecord.objects.all():
        writer.writerow(
            [
                record.id,
                record.original_filename,
                record.status,
                record.file_hash,
                record.file_size,
                record.scan_date.isoformat(),
            ]
        )
    return response


def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username", "")
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is None:
            messages.error(request, "Invalid username or password.")
            return render(request, "login.html")
        login(request, user)
        return redirect("dashboard")
    return render(request, "login.html")


def logout_view(request):
    logout(request)
    return redirect("home")
