from django.shortcuts import redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from functools import wraps


def admin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.groups.filter(name='ADMIN').exists():
            messages.error(request,
                           "You are not authorized to access this pages. Please log in with an administrator account.")
            return redirect('login')
        return view_func(request, *args, **kwargs)

    return _wrapped_view
