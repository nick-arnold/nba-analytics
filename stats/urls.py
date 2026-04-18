from rest_framework.routers import DefaultRouter
from .views import PlayByPlayViewSet
from .views import PlayerStatViewSet


router = DefaultRouter()
router.register(r'playbyplay', PlayByPlayViewSet)
router.register(r'playerstats', PlayerStatViewSet)

urlpatterns = router.urls