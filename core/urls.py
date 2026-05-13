from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("about/", views.about, name="about"),

    path("scan/", views.scan_file, name="scan"),
    path("history/", views.history_page, name="history"),
    path("dashboard/", views.dashboard_page, name="dashboard"),
    path("history/delete/<uuid:pk>/", views.delete_record, name="delete_record"),
    path("history/clear/", views.clear_history, name="clear_history"),
    path("export/", views.export_csv, name="export_csv"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
]
