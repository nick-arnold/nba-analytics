from django.db import models
from django.utils.text import slugify
from games.models import Team


class Player(models.Model):
    POSITIONS = [
        ('G', 'Guard'),
        ('F', 'Forward'),
        ('C', 'Center'),
        ('G-F', 'Guard-Forward'),
        ('F-C', 'Forward-Center'),
    ]

    bdl_player_id = models.IntegerField(null=True, blank=True, unique=True)
    nba_player_id = models.CharField(max_length=50, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    position = models.CharField(max_length=5, choices=POSITIONS, blank=True)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='players')
    is_active = models.BooleanField(default=True)
    slug = models.SlugField(max_length=200, unique=True, null=True, blank=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f"{self.first_name} {self.last_name}")
            slug = base_slug
            n = 1
            while Player.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)