# reservas/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import QuartoViewSet, HospedeViewSet, ReservaViewSet, CheckInViewSet, CheckOutViewSet

router = DefaultRouter()
router.register(r'quartos', QuartoViewSet)
router.register(r'hospedes', HospedeViewSet)
router.register(r'reservas', ReservaViewSet)
router.register(r'checkins', CheckInViewSet)
router.register(r'checkouts', CheckOutViewSet)

urlpatterns = [
    path('', include(router.urls)),
]