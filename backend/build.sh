# build.sh

# Exit on error
set -o errexit

# Install python dependencies
pip install -r requirements.txt

# Collect static files
python backend/manage.py collectstatic --no-input

# Run migrations
python backend/manage.py migrate