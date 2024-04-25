from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required()
def sensors_list(request):
    return render(request, 'pFIONA_sensors/list.html')
