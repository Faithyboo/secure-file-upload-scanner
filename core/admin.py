from django.contrib import admin
from .models import ScanRecord


@admin.register(ScanRecord)
class ScanRecordAdmin(admin.ModelAdmin):
    list_display = ("original_filename", "status", "extension", "file_size", "scan_date")
    search_fields = ("original_filename", "file_hash")
    list_filter = ("status", "extension", "scan_date")
