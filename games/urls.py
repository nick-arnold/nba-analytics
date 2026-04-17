from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, GameViewSet

router = DefaultRouter()
router.register(r'teams', TeamViewSet)
router.register(r'games', GameViewSet)

urlpatterns = router.urls