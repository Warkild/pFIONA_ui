from django.shortcuts import render

# Create your views here.

def login(request):
    return render(request, 'pFIONA_auth/login.html')