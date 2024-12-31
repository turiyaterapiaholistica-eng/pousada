from django.urls import path, include, re_path
from rest_framework.routers import SimpleRouter
from rest_framework_nested import routers
from . import views

from django.conf import settings
from django.conf.urls.static import static

# urlpatterns = [
#     path('', views.index),
# ]


router = routers.DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet)
router.register(r'itens', views.ItemCardapioViewSet)
router.register(r'consumacoes', views.ConsumacaoViewSet)
# router.register(r'/', views.index)

consumacoes_router = routers.NestedSimpleRouter(
    router, 
    r'consumacoes', 
    lookup='consumacao'
)
consumacoes_router.register(
    r'pagamentos',
    views.PagamentoViewSet,
    basename='consumacao-pagamentos'
)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/', include(consumacoes_router.urls)),
    re_path(r'^.*$', views.index),

    path('api/auth/login/', views.login_view, name='login'),
    path('api/auth/logout/', views.logout_view, name='logout'),
    path('api/auth/user/', views.user_info, name='user-info'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)