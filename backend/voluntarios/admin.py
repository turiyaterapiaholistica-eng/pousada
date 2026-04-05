from django.contrib import admin
from .models import Atividade, Badge, Volunteer, VolunteerBadge, Schedule, Task, Occurrence


@admin.register(Atividade)
class AtividadeAdmin(admin.ModelAdmin):
    list_display = ['nome', 'area', 'turno_sugerido', 'dificuldade', 'ativa']
    list_filter = ['area', 'turno_sugerido', 'dificuldade', 'ativa']
    search_fields = ['nome']


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo', 'icone']
    list_filter = ['tipo']
    search_fields = ['nome']


class VolunteerBadgeInline(admin.TabularInline):
    model = VolunteerBadge
    extra = 0
    raw_id_fields = ['badge', 'concedido_por']


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'pais_origem', 'data_chegada', 'status']
    list_filter = ['status', 'pais_origem']
    search_fields = ['user__first_name', 'user__last_name', 'user__username']
    filter_horizontal = ['habilidades']
    inlines = [VolunteerBadgeInline]
    raw_id_fields = ['user']


@admin.register(VolunteerBadge)
class VolunteerBadgeAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'badge', 'data_conquista', 'concedido_por']
    list_filter = ['badge__tipo']
    raw_id_fields = ['volunteer', 'concedido_por']


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'data', 'turno']
    list_filter = ['turno', 'data']
    date_hierarchy = 'data'
    raw_id_fields = ['volunteer']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['template', 'volunteer', 'data', 'turno', 'status', 'horas_gastas']
    list_filter = ['status', 'turno', 'data']
    date_hierarchy = 'data'
    raw_id_fields = ['template', 'volunteer']


@admin.register(Occurrence)
class OccurrenceAdmin(admin.ModelAdmin):
    list_display = ['tipo', 'prioridade', 'status', 'volunteer', 'data']
    list_filter = ['tipo', 'prioridade', 'status']
    date_hierarchy = 'data'
