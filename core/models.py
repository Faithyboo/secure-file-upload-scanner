import uuid
from django.db import models


class ScanRecord(models.Model):
    STATUS_SAFE = "SAFE"
    STATUS_WARNING = "WARNING"
    STATUS_BLOCKED = "BLOCKED"
    STATUS_CHOICES = [
        (STATUS_SAFE, "Safe"),
        (STATUS_WARNING, "Warning"),
        (STATUS_BLOCKED, "Blocked"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_filename = models.CharField(max_length=255)
    saved_filename = models.CharField(max_length=255)
    extension = models.CharField(max_length=20, blank=True)
    file_size = models.PositiveBigIntegerField()
    file_hash = models.CharField(max_length=64)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    reason = models.CharField(max_length=255)
    scan_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-scan_date"]

    def __str__(self) -> str:
        return f"{self.original_filename} ({self.status})"
