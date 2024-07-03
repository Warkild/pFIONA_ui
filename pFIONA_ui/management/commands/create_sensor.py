from django.core.management.base import BaseCommand, CommandError
from pFIONA_sensors.models import Sensor
from django.db.models import Max

class Command(BaseCommand):
    help = 'Creates a sensor with the IP address 192.168.0.1'

    def handle(self, *args, **kwargs):
        ip = '192.168.0.1'

        # Check if a sensor with the same IP already exists
        if Sensor.objects.filter(ip_address=ip).exists():
            self.stdout.write(self.style.ERROR(f'Sensor with IP {ip} already exists.'))
            return

        # Find the next available unique id
        max_id = Sensor.objects.aggregate(Max('id'))['id__max']
        new_id = (max_id or 0) + 1

        # Create the sensor with the unique id and the specified IP
        sensor = Sensor(id=new_id, ip_address=ip)
        sensor.save()

        self.stdout.write(self.style.SUCCESS(f'Successfully created sensor with IP {ip} and ID {new_id}'))
