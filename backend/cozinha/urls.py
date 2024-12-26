from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from . import views

from django.conf import settings
from django.conf.urls.static import static

# urlpatterns = [
#     path('', views.index),
# ]


router = DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet)
router.register(r'itens', views.ItemCardapioViewSet)
router.register(r'consumacoes', views.ConsumacaoViewSet)
# router.register(r'/', views.index)

urlpatterns = [
    path('api/', include(router.urls)),
    re_path(r'^.*$', views.index)
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)