# Atualização para urls.py
# Adicione estas linhas ao seu arquivo urls.py existente

from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views_estoque import FornecedorViewSet, CompraViewSet, EstoqueViewSet, MovimentacaoEstoqueViewSet, ItemCompraViewSet  


router = routers.DefaultRouter()

# Adicionar novas rotas ao router existente
router.register(r'fornecedores', FornecedorViewSet)
router.register(r'compras', CompraViewSet)
router.register(r'estoque', EstoqueViewSet)
router.register(r'movimentacoes', MovimentacaoEstoqueViewSet)
router.register(r'itens-compra', ItemCompraViewSet)

urlpatterns = router.urls

