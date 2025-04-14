from django.urls import path, include, re_path
from rest_framework.routers import SimpleRouter
from . import views
from django.conf import settings
from django.conf.urls.static import static

# Importe as rotas de estoque
from .urls_estoque import urlpatterns as estoque_urlpatterns

router = SimpleRouter()
router.register(r'categorias', views.CategoriaViewSet)
router.register(r'itens', views.ItemCardapioViewSet)
router.register(r'consumacoes', views.ConsumacaoViewSet)

# Rotas principais
urlpatterns = [
    path('api/auth/login/', views.login_view, name='login'),
    path('api/auth/logout/', views.logout_view, name='logout'),
    path('api/auth/user/', views.user_info, name='user-info'),
    path('api/', include(router.urls)),
    
    # Incluir as rotas de estoque
    path('api/', include(estoque_urlpatterns)),
    
    # Outras rotas...
    path('', views.index, name='index'),
    path('<path:path>', views.index, name='index-paths'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)