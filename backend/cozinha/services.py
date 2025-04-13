from datetime import datetime

def generate_signature() -> dict:
    """Generate parameters for direct file upload."""
    timestamp = int(datetime.now().timestamp())
    
    return {
        'timestamp': timestamp,
        'upload_url': '/api/itens/upload_image/'
    }

def generate_image_url(filename):
    """Generate a URL for accessing images."""
    if not filename:
        return None
    return f"/media/{filename}"