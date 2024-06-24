from django import template

register = template.Library()

"""
Template tags and filters in Django extend the functionality of templates by providing custom tools that you can use
directly in your template files. They are particularly useful for encapsulating complex logic that you don't want to
include directly in templates.
"""


@register.filter
def is_sensor_manual_path(request):
    """
    :return: True if path is manual, else False
    """
    return '/sensors/' in request.path and '/manual/' in request.path and request.path.count('/') == 4


@register.filter
def is_sensor_deploy_path(request):
    """
    :return: True if path is deploy, else False
    """
    return '/sensors/' in request.path and '/deploy/' in request.path and request.path.count('/') == 4


@register.filter
def is_sensor_data_path(request):
    """
    :return: True if path is data, else False
    """
    return '/sensors/' in request.path and '/data/' in request.path and request.path.count('/') == 4


@register.filter
def is_sensor_settings_path(request):
    """
    :return: True if path is settings, else False
    """
    return '/sensors/' in request.path and '/settings/' in request.path and request.path.count('/') == 4


@register.filter
def is_sensor_reagents_path(request):
    """
    :return: True if path is reagents, else False
    """
    return '/sensors/' in request.path and '/reagents/' in request.path and request.path.count('/') == 4
