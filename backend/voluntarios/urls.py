from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AtividadeViewSet, BadgeViewSet, VolunteerViewSet, VolunteerBadgeViewSet,
    ScheduleViewSet, TaskViewSet, OccurrenceViewSet,
)

router = DefaultRouter()
router.register(r'activities', AtividadeViewSet, basename='activity')
router.register(r'badges', BadgeViewSet, basename='badge')
router.register(r'volunteers', VolunteerViewSet, basename='volunteer')
router.register(r'volunteer-badges', VolunteerBadgeViewSet, basename='volunteer-badge')
router.register(r'schedule', ScheduleViewSet, basename='schedule')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'occurrences', OccurrenceViewSet, basename='occurrence')

urlpatterns = [
    path('', include(router.urls)),
]
