from django.shortcuts import render,redirect
from django.views.decorators.cache import never_cache
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as django_logout
<<<<<<< HEAD
from django.http import JsonResponse
from .models import EquipmentType, ComponentType
=======
#from models import EquipmentType, ComponentType, ComponentGff
>>>>>>> 795ed6e495a18260bf71068181a5c3450971e5c1

# Create your views here.
@never_cache
@login_required
def home(request):

<<<<<<< HEAD
    # get all equipments
    equipments = EquipmentType.objects.all();

    # get all components filtered by equipment
    

    context = {
        'equipments': equipments,
    }

    return render(request, 'formula_app/index.html', context=context)
=======
    # Get all the equipments
   # equipments = EquipmentType.objects.all()

    # Filter the components
    #components = equipments.filter(name=equipments.name)


    return render(request, 'formula_app/index.html')
>>>>>>> 795ed6e495a18260bf71068181a5c3450971e5c1


# log_out
def logout_view(request):
    django_logout(request)
    return redirect("/")

# get components and gff based on equipment
@login_required
def get_components(request):
    equipment_id = request.GET.get("equipment_id")
    components = ComponentType.objects.filter(equipment_id=equipment_id).values('id', 'name')
    return JsonResponse(list(components), safe=False)
