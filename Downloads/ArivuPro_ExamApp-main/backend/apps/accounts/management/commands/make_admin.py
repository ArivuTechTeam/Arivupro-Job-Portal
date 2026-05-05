"""Management command: promote a user to admin role."""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Promote a user to admin role (sets role=admin, is_staff=True)'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to promote')

    def handle(self, *args, **options):
        username = options['username']
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" does not exist.')

        user.role = 'admin'
        user.is_staff = True
        user.save(update_fields=['role', 'is_staff'])

        self.stdout.write(self.style.SUCCESS(
            f'✓ User "{username}" is now an admin (role=admin, is_staff=True).'
        ))
