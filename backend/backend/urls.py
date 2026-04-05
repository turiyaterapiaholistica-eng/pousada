from django.contrib import admin
from django.urls import path, include, re_path
from django.conf.urls.static import static
from django.conf import settings
from cozinha import views as cozinha_views  # Importe as views necessárias para o frontend

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('reservas.urls')),
    path('api/', include('cozinha.urls')),
    path('api/volunteers/', include('voluntarios.urls')),

    # Rotas do frontend
    path('', cozinha_views.index, name='index'),
    re_path(r'^.*$', cozinha_views.index, name='index-paths'),
] 

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)