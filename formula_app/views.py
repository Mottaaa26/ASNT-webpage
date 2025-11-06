from django.shortcuts import render,redirect
from django.views.decorators.cache import never_cache
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as django_logout
#from models import EquipmentType, ComponentType, ComponentGff

# Create your views here.
@never_cache
@login_required
def home(request):

    # Get all the equipments
   # equipments = EquipmentType.objects.all()

    # Filter the components
    #components = equipments.filter(name=equipments.name)


    return render(request, 'formula_app/index.html')


# log_out
def logout_view(request):
    django_logout(request)
    return redirect("/")

