from django.shortcuts import render,redirect
from django.views.decorators.cache import never_cache
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as django_logout
from django.http import JsonResponse
from .models import EquipmentType, ComponentType

# Create your views here.
@never_cache
@login_required
def home(request):

    # get all equipments
    equipments = EquipmentType.objects.all();

    context = {
        'equipments': equipments,
    }

    return render(request, 'formula_app/index.html', context=context)


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

def load_step_content(request, step_number):
    template_name = f'formula_app/includes/thinningDF/steps_includes/step{step_number}.html'
    return render(request, template_name, {})

