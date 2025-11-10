from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name="index"),
    path('logout/', views.logout_view, name="logout"),
    path('get-components/', views.get_components, name="get_components"),
    path('load-step/<int:step_number>/', views.load_step_content, name="load_step_content"),
]
