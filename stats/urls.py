from rest_framework.routers import DefaultRouter
from .views import PlayByPlayViewSet

router = DefaultRouter()
router.register(r'playbyplay', PlayByPlayViewSet)

urlpatterns = router.urls