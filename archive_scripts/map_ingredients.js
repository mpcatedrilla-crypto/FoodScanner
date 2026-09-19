const fs = require('fs');
const urlRecipes = 'https://sfiudbxjdcirkejidscl.supabase.co/rest/v1/recipes?select=id,name';
const urlIngredients = 'https://sfiudbxjdcirkejidscl.supabase.co/rest/v1/ingredients?select=id,name';
const headers = {
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXVkYnhqZGNpcmtlamlkc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTQwMTcsImV4cCI6MjA5NTEzMDAxN30.W1JFAD-7vjIy1aHGJSH5jtlaCo8oZYMP2JiL2062wsw',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXVkYnhqZGNpcmtlamlkc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTQwMTcsImV4cCI6MjA5NTEzMDAxN30.W1JFAD-7vjIy1aHGJSH5jtlaCo8oZYMP2JiL2062wsw',
  'Content-Type': 'application/json'
};

async function run() {
  const [recipes, ingredients] = await Promise.all([
    fetch(urlRecipes, {headers}).then(r=>r.json()),
    fetch(urlIngredients, {headers}).then(r=>r.json())
  ]);

  const ingMap = {};
  for(const i of ingredients) ingMap[i.name.toLowerCase()] = i.id;

  const getIds = (names) => names.map(n => ingMap[n.toLowerCase()]).filter(Boolean);

  const inserts = [];

  for(const r of recipes) {
    const n = r.name.toLowerCase();
    const recipeId = r.id;
    let mapped = [];

    // Simple heuristic
    if(n.includes('adobo')) mapped.push('Soy Sauce', 'Vinegar', 'Garlic', 'Black pepper', 'Bay Leaf');
    if(n.includes('sinigang')) mapped.push('Tamarind Paste', 'Tomato', 'Onion', 'Water Spinach', 'String Beans', 'Fish sauce');
    if(n.includes('kare')) mapped.push('Peanut Butter', 'Shrimp Paste', 'String Beans', 'Eggplant', 'Bok Choy');
    if(n.includes('bicol')) mapped.push('Coconut Milk', 'Pork Belly', 'Shrimp Paste', 'Chili pepper');
    if(n.includes('sisig')) mapped.push('Pork Belly', 'Onion', 'Calamansi', 'Chili pepper', 'Egg');
    if(n.includes('tinola')) mapped.push('Chicken', 'Ginger', 'Onion', 'Water Spinach', 'Fish sauce');
    if(n.includes('nilaga')) mapped.push('Beef', 'Potato', 'Cabbage', 'Onion', 'Black pepper');
    if(n.includes('pancit')) mapped.push('Carrot', 'Cabbage', 'Soy Sauce', 'Onion', 'Garlic', 'Calamansi');
    if(n.includes('lumpia')) mapped.push('Lumpia Wrapper', 'Ground Pork', 'Carrot', 'Onion', 'Garlic', 'Egg');
    if(n.includes('torta') && n.includes('talong')) mapped.push('Eggplant', 'Egg', 'Salt', 'Cooking oil');
    if(n.includes('baboy') || n.includes('pork')) mapped.push('Pork');
    if(n.includes('manok') || n.includes('chicken')) mapped.push('Chicken');
    if(n.includes('baka') || n.includes('beef')) mapped.push('Beef');
    if(n.includes('isda') || n.includes('fish')) mapped.push('Fish sauce');
    if(n.includes('bangus')) mapped.push('Milkfish');
    
    // De-duplicate
    mapped = [...new Set(mapped)];
    const ids = getIds(mapped);
    
    for(const i of ids) {
      inserts.push({ recipe_id: recipeId, ingredient_id: i });
    }
  }

  // Insert to DB using upsert (on conflict ignore)
  // chunk by 100
  for(let i = 0; i < inserts.length; i += 100) {
    const chunk = inserts.slice(i, i + 100);
    await fetch('https://sfiudbxjdcirkejidscl.supabase.co/rest/v1/recipe_ingredients', {
      method: 'POST',
      headers: {...headers, 'Prefer': 'resolution=ignore-duplicates'},
      body: JSON.stringify(chunk)
    });
  }
  console.log('Mapped and inserted', inserts.length, 'missing ingredients across 120 recipes!');
}
run();
