from django.contrib import admin

from .models import Categoria, Consumacao, Image, ItemCardapio, ItemConsumacao, Pagamento
from .models_estoque import Compra, Estoque, Fornecedor, ItemCompra, MovimentacaoEstoque


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ['name', 'format', 'width', 'height', 'created_at']
    search_fields = ['name', 'key', 'url']
    readonly_fields = ['created_at']


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'categoria_pai', 'descricao_curta']
    list_filter = ['categoria_pai']
    search_fields = ['nome', 'descricao']

    @admin.display(description='Descrição')
    def descricao_curta(self, obj):
        return (obj.descricao or '')[:60]


@admin.register(ItemCardapio)
class ItemCardapioAdmin(admin.ModelAdmin):
    list_display = ['nome', 'categoria', 'preco', 'preco_custo', 'disponivel', 'ativo', 'venda']
    list_filter = ['categoria', 'disponivel', 'ativo', 'venda']
    search_fields = ['nome', 'descricao', 'categoria__nome']
    list_editable = ['disponivel', 'ativo', 'venda']


class ItemConsumacaoInline(admin.TabularInline):
    model = ItemConsumacao
    extra = 0
    autocomplete_fields = ['item']


class PagamentoInline(admin.TabularInline):
    model = Pagamento
    extra = 0


@admin.register(Consumacao)
class ConsumacaoAdmin(admin.ModelAdmin):
    list_display = ['id', 'quarto', 'nome_cliente', 'tipo_cliente', 'status', 'data_hora', 'valor_total', 'valor_pago', 'saldo_pendente']
    list_filter = ['status', 'tipo_cliente', 'forma_pagamento', 'data_hora']
    search_fields = ['quarto', 'nome_cliente', 'codigo']
    readonly_fields = ['data_hora', 'valor_total', 'valor_pago', 'saldo_pendente', 'codigo_valido_status']
    inlines = [ItemConsumacaoInline, PagamentoInline]
    date_hierarchy = 'data_hora'

    @admin.display(description='Total')
    def valor_total(self, obj):
        return obj.total()

    @admin.display(description='Pago')
    def valor_pago(self, obj):
        return obj.total_pago()

    @admin.display(description='Saldo')
    def saldo_pendente(self, obj):
        return obj.saldo()

    @admin.display(description='Código válido')
    def codigo_valido_status(self, obj):
        return obj.codigo_valido()


@admin.register(Pagamento)
class PagamentoAdmin(admin.ModelAdmin):
    list_display = ['id', 'consumacao', 'valor', 'forma_pagamento', 'data']
    list_filter = ['forma_pagamento', 'data']
    search_fields = ['consumacao__quarto', 'consumacao__nome_cliente', 'observacao']
    date_hierarchy = 'data'


@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ['nome']
    search_fields = ['nome']


class ItemCompraInline(admin.TabularInline):
    model = ItemCompra
    extra = 0
    autocomplete_fields = ['item']


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = ['id', 'fornecedor', 'data', 'nota_fiscal', 'valor_total', 'ativa']
    list_filter = ['ativa', 'data', 'fornecedor']
    search_fields = ['nota_fiscal', 'fornecedor__nome', 'observacao']
    inlines = [ItemCompraInline]
    date_hierarchy = 'data'


@admin.register(ItemCompra)
class ItemCompraAdmin(admin.ModelAdmin):
    list_display = ['compra', 'item', 'quantidade', 'unidade', 'valor_unitario']
    list_filter = ['unidade', 'compra__fornecedor']
    search_fields = ['item__nome', 'compra__nota_fiscal', 'compra__fornecedor__nome']
    autocomplete_fields = ['compra', 'item']


@admin.register(Estoque)
class EstoqueAdmin(admin.ModelAdmin):
    list_display = ['item', 'quantidade', 'unidade', 'quantidade_minima', 'status_estoque', 'ultimo_preco', 'ultima_atualizacao']
    list_filter = ['unidade']
    search_fields = ['item__nome']
    readonly_fields = ['ultima_atualizacao', 'status_estoque']

    @admin.display(description='Status')
    def status_estoque(self, obj):
        return obj.status()


@admin.register(MovimentacaoEstoque)
class MovimentacaoEstoqueAdmin(admin.ModelAdmin):
    list_display = ['data', 'item', 'tipo', 'quantidade', 'unidade', 'origem', 'valor_unitario']
    list_filter = ['tipo', 'unidade', 'data']
    search_fields = ['item__nome', 'origem', 'observacao']
    date_hierarchy = 'data'
