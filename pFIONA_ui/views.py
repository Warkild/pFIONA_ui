from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required


def home_redirect(request):
    if request.user.is_authenticated:
        return redirect('/sensors/list')
    else:
        return redirect('/login')
