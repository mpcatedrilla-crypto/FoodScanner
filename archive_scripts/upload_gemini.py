import json
import urllib.request
import os

SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXVkYnhqZGNpcmtlamlkc2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU1NDAxNywiZXhwIjoyMDk1MTMwMDE3fQ.cYkUdpAEFW20EmgNP4O7IRUXX6-yfW60b0Kj0zc1dDs'
SUPABASE_URL = 'https://sfiudbxjdcirkejidscl.supabase.co'
HEADERS = {'apikey': SERVICE_ROLE_KEY, 'Authorization': f'Bearer {SERVICE_ROLE_KEY}'}

# Get IDs for the 5 recipes
req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/recipes?select=id,name', headers=HEADERS)
recipes = json.loads(urllib.request.urlopen(req).read())
recipe_dict = {r['name']: r['id'] for r in recipes}

images_to_upload = {
    'Kwek-Kwek': r'C:\Users\Marck\.gemini\antigravity\brain\9968128a-a5db-435d-b103-ecfb9bf88241\kwek_kwek_1789637697541.jpg',
    'Papaitan': r'C:\Users\Marck\.gemini\antigravity\brain\9968128a-a5db-435d-b103-ecfb9bf88241\papaitan_1789637712247.jpg',
    'Dinakdakan': r'C:\Users\Marck\.gemini\antigravity\brain\9968128a-a5db-435d-b103-ecfb9bf88241\dinakdakan_1789637724475.jpg',
    'Taho': r'C:\Users\Marck\.gemini\antigravity\brain\9968128a-a5db-435d-b103-ecfb9bf88241\taho_1789637738987.jpg',
    'Halo-Halo': r'C:\Users\Marck\.gemini\antigravity\brain\9968128a-a5db-435d-b103-ecfb9bf88241\halo_halo_1789637751004.jpg'
}

for name, path in images_to_upload.items():
    if name not in recipe_dict: continue
    id = recipe_dict[name]
    
    with open(path, 'rb') as f:
        img_data = f.read()
        
    filename = f"{id}.jpg"
    upload_req = urllib.request.Request(
        f'{SUPABASE_URL}/storage/v1/object/recipe-images/{filename}',
        data=img_data,
        headers={
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true'
        },
        method='POST'
    )
    urllib.request.urlopen(upload_req)
    
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/recipe-images/{filename}"
    
    patch_req = urllib.request.Request(
        f'{SUPABASE_URL}/rest/v1/recipes?id=eq.{id}',
        data=json.dumps({'image_url': public_url}).encode('utf-8'),
        headers={
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
            'Content-Type': 'application/json'
        },
        method='PATCH'
    )
    urllib.request.urlopen(patch_req)
    print(f"Uploaded and linked Gemini image for {name}")

