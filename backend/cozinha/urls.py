from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Crie um DefaultRouter para as rotas principais
router = DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet)
router.register(r'itens', views.ItemCardapioViewSet)
router.register(r'consumacoes', views.ConsumacaoViewSet)

# Importe e adicione as rotas de estoque ao mesmo router
from .views_estoque import FornecedorViewSet, CompraViewSet, EstoqueViewSet, MovimentacaoEstoqueViewSet, ItemCompraViewSet

router.register(r'fornecedores', FornecedorViewSet)
router.register(r'compras', CompraViewSet)
router.register(r'estoque', EstoqueViewSet)
router.register(r'movimentacoes', MovimentacaoEstoqueViewSet)
router.register(r'itens-compra', ItemCompraViewSet)

# API routes
urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/user/', views.user_info, name='user-info'),
    path('', include(router.urls)),
]