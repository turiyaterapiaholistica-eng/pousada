# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies and build
cd frontend
npm install
npm run build

cd ..
python manage.py collectstatic --no-input
python manage.py migrate