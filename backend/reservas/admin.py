from django.contrib import admin

from .models import CheckIn, CheckOut, Hospede, Quarto, Reserva


@admin.register(Quarto)
class QuartoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo', 'classe', 'status', 'capacidade_adultos', 'capacidade_criancas', 'valor_diaria_padrao']
    list_filter = ['tipo', 'classe', 'status', 'tem_vista', 'tipo_banheiro', 'espaco_externo']
    search_fields = ['nome', 'descricao']
    list_editable = ['status']


@admin.register(Hospede)
class HospedeAdmin(admin.ModelAdmin):
    list_display = ['nome', 'sobrenome', 'email', 'telefone', 'tipo_documento', 'numero_documento', 'data_cadastro']
    list_filter = ['tipo_documento', 'data_cadastro']
    search_fields = ['nome', 'sobrenome', 'email', 'telefone', 'numero_documento']
    date_hierarchy = 'data_cadastro'


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ['id', 'quarto', 'hospede', 'data_chegada', 'data_saida', 'status', 'num_adultos', 'num_criancas', 'valor_total']
    list_filter = ['status', 'data_chegada', 'data_saida', 'quarto']
    search_fields = ['hospede__nome', 'hospede__sobrenome', 'quarto__nome', 'observacoes']
    date_hierarchy = 'data_chegada'
    autocomplete_fields = ['quarto', 'hospede']


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ['reserva', 'data_hora', 'observacoes']
    search_fields = ['reserva__hospede__nome', 'reserva__hospede__sobrenome', 'reserva__quarto__nome', 'observacoes']
    date_hierarchy = 'data_hora'
    autocomplete_fields = ['reserva']


@admin.register(CheckOut)
class CheckOutAdmin(admin.ModelAdmin):
    list_display = ['reserva', 'data_hora', 'valor_consumo', 'valor_total']
    search_fields = ['reserva__hospede__nome', 'reserva__hospede__sobrenome', 'reserva__quarto__nome', 'observacoes']
    date_hierarchy = 'data_hora'
    autocomplete_fields = ['reserva']
