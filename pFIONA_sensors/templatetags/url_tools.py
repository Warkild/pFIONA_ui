from django import template

register = template.Library()


@register.filter
def is_sensor_manual_path(request):
    return '/sensors/' in request.path and '/manual/' in request.path and request.path.count('/') == 4


@register.filter
def is_sensor_deploy_path(request):
    return '/sensors/' in request.path and '/deploy/' in request.path and request.path.count('/') == 4


@register.filter
def is_sensor_data_path(request):
    return '/sensors/' in request.path and '/data/' in request.path and request.path.count('/') == 4


@register.filter
def is_sensor_settings_path(request):
    return '/sensors/' in request.path and '/settings/' in request.path and request.path.count('/') == 4
