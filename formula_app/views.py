from django.shortcuts import render,redirect
from django.views.decorators.cache import never_cache
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as django_logout

# Create your views here.
@never_cache
@login_required
def home(request):
    return render(request, 'formula_app/index.html')


# cierre de sesión
def logout_view(request):
    django_logout(request)
    return redirect("/")

