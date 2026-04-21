from django.core.management.base import BaseCommand
from django.utils.text import slugify
from players.models import Player


class Command(BaseCommand):
    help = 'Generate slugs for all players'

    def handle(self, *args, **kwargs):
        players = Player.objects.filter(slug__isnull=True)
        self.stdout.write(f'Generating slugs for {players.count()} players...')
        updated = 0
        for player in players:
            base_slug = slugify(f"{player.first_name} {player.last_name}")
            slug = base_slug
            n = 1
            while Player.objects.filter(slug=slug).exclude(pk=player.pk).exists():
                slug = f"{base_slug}-{n}"
                n += 1
            player.slug = slug
            player.save(update_fields=['slug'])
            updated += 1
        self.stdout.write(self.style.SUCCESS(f'Done — {updated} slugs generated.'))