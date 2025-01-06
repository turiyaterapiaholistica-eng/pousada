from datetime import datetime
import cloudinary
import os

cloudinary.config(
   cloud_name=os.getenv('CLOUD_NAME'),
   api_key=os.getenv('API_KEY'),
   api_secret=os.getenv('API_SECRET'),
)

def generate_signature() -> dict:
   """Generate a signed Cloudinary upload url."""
   timestamp = int(datetime.now().timestamp())
   params = {
       "timestamp": timestamp,
       "upload_preset": "ml_default"
   }
   
   signature = cloudinary.utils.api_sign_request(
       params,
       os.getenv('API_SECRET')
   )
   
   return {
       'signature': signature,
       'api_key': os.getenv('API_KEY'),
       'timestamp': timestamp,
       'upload_url': f"https://api.cloudinary.com/v1_1/{os.getenv('CLOUD_NAME')}/image/upload"
   }