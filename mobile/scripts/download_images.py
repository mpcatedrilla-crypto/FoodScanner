import sqlite3
import requests
import os
import time
from bs4 import BeautifulSoup

db_path = 'C:/projects/food-scanner/mobile/assets/app_v4.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('SELECT id, name, reference_url FROM recipes WHERE reference_url IS NOT NULL')
recipes = cursor.fetchall()

img_dir = 'C:/projects/food-scanner/mobile/assets/images/recipes'
os.makedirs(img_dir, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

map_file_lines = ["export const RecipeImages: Record<string, any> = {"]

for rid, name, url in recipes:
    img_path = f'{img_dir}/{rid}.jpg'
    
    if os.path.exists(img_path):
        map_file_lines.append(f'  "{rid}": require("../../assets/images/recipes/{rid}.jpg"),')
        continue
        
    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        og_image = soup.find('meta', property='og:image')
        
        if og_image and og_image.get('content'):
            img_url = og_image['content']
            img_res = requests.get(img_url, headers=headers, timeout=10)
            
            with open(img_path, 'wb') as f:
                f.write(img_res.content)
            print(f"Downloaded {name}")
            map_file_lines.append(f'  "{rid}": require("../../assets/images/recipes/{rid}.jpg"),')
        else:
            print(f"No og:image for {name}")
    except Exception as e:
        print(f"Error {name}: {e}")

map_file_lines.append("};")

with open('C:/projects/food-scanner/mobile/src/lib/imageMap.ts', 'w') as f:
    f.write("\n".join(map_file_lines))

print("Done! imageMap.ts created.")
