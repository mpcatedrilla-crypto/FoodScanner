import json
import urllib.request
import re

SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXVkYnhqZGNpcmtlamlkc2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU1NDAxNywiZXhwIjoyMDk1MTMwMDE3fQ.cYkUdpAEFW20EmgNP4O7IRUXX6-yfW60b0Kj0zc1dDs'
SUPABASE_URL = 'https://sfiudbxjdcirkejidscl.supabase.co'

# Read local mapping
with open(r'C:\projects\food-scanner\mobile\src\lib\image-map.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract JSON string
json_str = content[content.find('{'):content.rfind('}')+1]
wiki_map = json.loads(json_str)

# Fetch all recipes
req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/recipes?select=id,name', headers={'apikey': SERVICE_ROLE_KEY, 'Authorization': f'Bearer {SERVICE_ROLE_KEY}'})
recipes = json.loads(urllib.request.urlopen(req).read())

updated_count = 0

for recipe in recipes:
    name = recipe['name']
    id = recipe['id']
    if name in wiki_map:
        image_url = wiki_map[name]
        
        # PATCH database using service_role key to bypass RLS
        patch_req = urllib.request.Request(
            f'{SUPABASE_URL}/rest/v1/recipes?id=eq.{id}',
            data=json.dumps({'image_url': image_url}).encode('utf-8'),
            headers={
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            method='PATCH'
        )
        try:
            urllib.request.urlopen(patch_req)
            updated_count += 1
            print(f"Updated {name}")
        except Exception as e:
            print(f"Failed to update {name}: {e}")

print(f"Successfully updated {updated_count} recipes in the database.")
