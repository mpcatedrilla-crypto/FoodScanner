import zipfile
from bs4 import BeautifulSoup
import sqlite3
import os
import shutil

docx_path = r'C:\projects\food-scanner\Ingredients_Images.docx'
extract_dir = r'C:\projects\food-scanner\Ingredients_Images_extracted'

conn = sqlite3.connect(r'C:\projects\food-scanner\mobile\assets\app_v4.db')
cursor = conn.cursor()
cursor.execute('SELECT id, name FROM recipes')
recipes = {row[1].strip().lower(): row[0] for row in cursor.fetchall()}

with zipfile.ZipFile(docx_path, 'r') as docx:
    doc_xml = docx.read('word/document.xml')
    rels_xml = docx.read('word/_rels/document.xml.rels')

rels_soup = BeautifulSoup(rels_xml, 'xml')
rels = {}
for rel in rels_soup.find_all('Relationship'):
    if 'image' in rel['Target']:
        rels[rel['Id']] = rel['Target'] 

doc_soup = BeautifulSoup(doc_xml, 'xml')
paragraphs = doc_soup.find_all(['w:p', 'w:tr'])

mapped_images = {}
current_recipe = None

for p in paragraphs:
    text = "".join([t.text for t in p.find_all('w:t')]).strip()
    if text:
        text_lower = text.lower()
        for r_name in recipes.keys():
            if r_name in text_lower:
                current_recipe = r_name
                break
    
    # Also check drawing within the same element
    drawings = p.find_all('w:drawing')
    for drawing in drawings:
        if current_recipe:
            blip = drawing.find('a:blip')
            if blip and blip.has_attr('r:embed'):
                rId = blip['r:embed']
                if rId in rels:
                    img_path = rels[rId] # e.g. media/image1.png
                    mapped_images[current_recipe] = img_path
                    current_recipe = None 

print(f"Mapped {len(mapped_images)} recipes to images.")

out_dir = r'C:\projects\food-scanner\mobile\assets\images\docx_recipes'
os.makedirs(out_dir, exist_ok=True)

map_file_lines = ["export const RecipeImages: Record<string, any> = {"]

count_copied = 0
for r_name, img_rel_path in mapped_images.items():
    uuid = recipes[r_name]
    # IMPORTANT FIX: the image path inside the docx is usually 'word/media/image1.png'
    # Wait, rels[rId] is just 'media/image1.png' if it's relative to word/
    src = os.path.join(extract_dir, 'word', img_rel_path.replace('/', os.sep))
    ext = os.path.splitext(src)[1]
    dest = os.path.join(out_dir, f'{uuid}{ext}')
    
    if os.path.exists(src):
        shutil.copy2(src, dest)
        map_file_lines.append(f'  "{uuid}": require("../../assets/images/docx_recipes/{uuid}{ext}"),')
        count_copied += 1
    else:
        print(f"Missing: {src}")

map_file_lines.append("};")

with open(r'C:\projects\food-scanner\mobile\src\lib\imageMap.ts', 'w') as f:
    f.write("\n".join(map_file_lines))

print(f"Done generating map and copying {count_copied} images.")
