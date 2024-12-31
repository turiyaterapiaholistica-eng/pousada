
# Exit on error
set -o errexit

# Install python dependencies
pip install -r requirements.txt

# Navigate to backend directory
cd backend

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate