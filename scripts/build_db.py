import sqlite3
import re
import os

DB_PATH = 'mobile/assets/app.db'
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

os.makedirs('mobile/assets', exist_ok=True)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Create tables
cursor.executescript('''
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_tagalog TEXT,
    description TEXT,
    cooking_time_minutes INTEGER,
    servings INTEGER,
    difficulty TEXT,
    calories_per_serving INTEGER,
    protein_per_serving INTEGER,
    carbs_per_serving INTEGER,
    fats_per_serving INTEGER,
    instructions TEXT,
    popularity_score INTEGER,
    is_base_recipe BOOLEAN,
    reference_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_tagalog TEXT,
    category TEXT,
    calories_per_100g INTEGER,
    protein_per_100g INTEGER,
    carbs_per_100g INTEGER,
    fats_per_100g INTEGER,
    coco_class TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_id TEXT,
    ingredient_id TEXT,
    amount REAL,
    unit TEXT,
    is_optional BOOLEAN DEFAULT 0,
    FOREIGN KEY(recipe_id) REFERENCES recipes(id),
    FOREIGN KEY(ingredient_id) REFERENCES ingredients(id),
    PRIMARY KEY(recipe_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS recipe_history (id TEXT);
CREATE TABLE IF NOT EXISTS user_saved_recipes (id TEXT);
''')

files = ['chunk1.sql', 'final_seed.sql', 'updates.sql']
for f_name in files:
    if not os.path.exists(f_name):
        continue
    with open(f_name, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # SQLite translations
        content = re.sub(r'gen_random_uuid\(\)', "lower(hex(randomblob(16)))", content)
        content = re.sub(r"'::jsonb", "'", content)
        
        try:
            cursor.executescript(content)
        except Exception as e:
            print(f"Error in {f_name}: {e}")

conn.commit()
conn.close()
print("Built app.db successfully!")
