# Pousada

## Configuracao local

No diretorio `backend`, crie um arquivo `.env` com o seguinte conteudo:

```env
DJANGO_SECRET_KEY=dev-only-insecure-key-pousada-local
DEBUG=True
DATABASE_URL=postgresql://postgres:dEDlrGUiNoWhrhiZvPWABbsPsgQWBfpb@maglev.proxy.rlwy.net:37774/railway
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

## Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

## Rodar o projeto

```bash
cd backend
python manage.py runserver
```
