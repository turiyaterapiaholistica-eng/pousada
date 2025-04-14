from django.db import models
from django.utils import timezone
from decimal import Decimal
from django.db.models import Sum, F, ExpressionWrapper, DecimalField

# Import existing models
from .models import ItemCardapio

class Fornecedor(models.Model):
    nome = models.CharField(max_length=100)
    
    def __str__(self):
        return self.nome
    
    class Meta:
        verbose_name = 'Fornecedor'
        verbose_name_plural = 'Fornecedores'
        ordering = ['nome']

class Compra(models.Model):
    data = models.DateTimeField(default=timezone.now)
    fornecedor = models.ForeignKey(Fornecedor, on_delete=models.SET_NULL, null=True, blank=True)
    nota_fiscal = models.CharField(max_length=50, blank=True, null=True)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    observacao = models.TextField(blank=True)
    ativa = models.BooleanField(default=True)  # Novo campo para controle de exclusão lógica
    
    def __str__(self):
        fornecedor = self.fornecedor.nome if self.fornecedor else "Sem fornecedor"
        return f"Compra {self.id} - {fornecedor} - {self.data.strftime('%d/%m/%Y')}"
    
    def calcular_total(self):
        """Recalcula o valor total com base nos itens"""
        total = self.itens.aggregate(
            total=Sum(F('quantidade') * F('valor_unitario'), output_field=DecimalField())
        )['total'] or 0
        self.valor_total = total
        self.save(update_fields=['valor_total'])
        return total
    
    class Meta:
        ordering = ['-data']
        verbose_name = 'Compra'
        verbose_name_plural = 'Compras'

class ItemCompra(models.Model):
    UNIDADE_CHOICES = [
        ('un', 'Unidade'),
        ('kg', 'Quilograma'),
        ('g', 'Grama'),
        ('l', 'Litro'),
        ('ml', 'Mililitro'),
        ('cx', 'Caixa'),
        ('pct', 'Pacote')
    ]
    
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='itens')
    item = models.ForeignKey(ItemCardapio, on_delete=models.RESTRICT)
    quantidade = models.DecimalField(max_digits=10, decimal_places=3)
    unidade = models.CharField(max_length=5, choices=UNIDADE_CHOICES, default='un')
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        # Atualiza preço de custo no ItemCardapio
        self.item.preco_custo = self.valor_unitario
        self.item.save(update_fields=['preco_custo'])
        
        # Salva o item
        super().save(*args, **kwargs)
        
        # Atualiza o estoque
        self.atualizar_estoque()
        
        # Recalcula o total da compra
        self.compra.calcular_total()
    
    def atualizar_estoque(self):
        """Atualiza o estoque após adicionar um item de compra"""
        estoque, created = Estoque.objects.get_or_create(
            item=self.item,
            defaults={'quantidade': 0, 'unidade': self.unidade}
        )
        
        if estoque.unidade != self.unidade:
            # Se a unidade for diferente, salva o registro com alerta
            MovimentacaoEstoque.objects.create(
                item=self.item,
                tipo='entrada',
                quantidade=self.quantidade,
                unidade=self.unidade,
                valor_unitario=self.valor_unitario,
                origem=f"Compra #{self.compra.id}",
                observacao=f"Atenção: Unidade diferente do estoque atual ({estoque.unidade})"
            )
        else:
            # Atualiza o estoque
            estoque.quantidade += self.quantidade
            estoque.save()
            
            # Registra a movimentação
            MovimentacaoEstoque.objects.create(
                item=self.item,
                tipo='entrada',
                quantidade=self.quantidade,
                unidade=self.unidade,
                valor_unitario=self.valor_unitario,
                origem=f"Compra #{self.compra.id}"
            )
    
    def __str__(self):
        return f"{self.quantidade} {self.unidade} - {self.item.nome}"
    
    class Meta:
        verbose_name = 'Item de Compra'
        verbose_name_plural = 'Itens de Compra'

class Estoque(models.Model):
    UNIDADE_CHOICES = [
        ('un', 'Unidade'),
        ('kg', 'Quilograma'),
        ('g', 'Grama'),
        ('l', 'Litro'),
        ('ml', 'Mililitro'),
        ('cx', 'Caixa'),
        ('pct', 'Pacote')
    ]
    
    item = models.OneToOneField(ItemCardapio, on_delete=models.CASCADE, related_name='estoque')
    quantidade = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    unidade = models.CharField(max_length=5, choices=UNIDADE_CHOICES, default='un')
    quantidade_minima = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    ultimo_preco = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ultima_atualizacao = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.item.nome}: {self.quantidade} {self.unidade}"
    
    def status(self):
        """Retorna o status do estoque: normal, baixo ou crítico"""
        if self.quantidade <= 0:
            return "sem_estoque"
        if self.quantidade_minima > 0 and self.quantidade <= self.quantidade_minima * Decimal('0.5'):
            return "critico"
        if self.quantidade_minima > 0 and self.quantidade <= self.quantidade_minima:
            return "baixo"
        return "normal"
    
    def atualizar_disponibilidade(self):
        """Atualiza disponibilidade do item no cardápio"""
        if self.quantidade <= 0:
            self.item.disponivel = False
            self.item.save(update_fields=['disponivel'])
    
    class Meta:
        verbose_name = 'Estoque'
        verbose_name_plural = 'Estoques'
        ordering = ['item__nome']

class MovimentacaoEstoque(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('saida', 'Saída'),
        ('ajuste', 'Ajuste'),
        ('perda', 'Perda/Descarte')
    ]
    
    UNIDADE_CHOICES = [
        ('un', 'Unidade'),
        ('kg', 'Quilograma'),
        ('g', 'Grama'),
        ('l', 'Litro'),
        ('ml', 'Mililitro'),
        ('cx', 'Caixa'),
        ('pct', 'Pacote')
    ]
    
    item = models.ForeignKey(ItemCardapio, on_delete=models.CASCADE, related_name='movimentacoes')
    data = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    quantidade = models.DecimalField(max_digits=10, decimal_places=3)
    unidade = models.CharField(max_length=5, choices=UNIDADE_CHOICES)
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    origem = models.CharField(max_length=100, blank=True)
    observacao = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.item.nome} - {self.quantidade} {self.unidade}"
    
    class Meta:
        verbose_name = 'Movimentação de Estoque'
        verbose_name_plural = 'Movimentações de Estoque'
        ordering = ['-data']

# Modificação na classe ItemConsumacao para incluir baixa de estoque
def atualizar_estoque_por_consumo(sender, instance, created, **kwargs):
    """Atualiza o estoque quando um item é consumido"""
    from django.db.models.signals import post_save
    from .models import ItemConsumacao
    
    if created:  # Apenas na criação do item
        try:
            estoque = Estoque.objects.get(item=instance.item)
            
            # Registra a saída no estoque
            MovimentacaoEstoque.objects.create(
                item=instance.item,
                tipo='saida',
                quantidade=instance.quantidade,
                unidade=estoque.unidade,
                origem=f"Consumação #{instance.consumacao.id}",
                valor_unitario=instance.item.preco
            )
            
            # Atualiza a quantidade em estoque
            estoque.quantidade = max(0, estoque.quantidade - instance.quantidade)
            estoque.save()
            
            # Verifica disponibilidade
            estoque.atualizar_disponibilidade()
            
        except Estoque.DoesNotExist:
            # Se não houver estoque registrado, apenas ignora
            pass

# Conectar o sinal
from django.db.models.signals import post_save
from .models import ItemConsumacao

post_save.connect(atualizar_estoque_por_consumo, sender=ItemConsumacao)