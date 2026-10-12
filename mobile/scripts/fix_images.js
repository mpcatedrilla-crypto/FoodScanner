const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/app/recipes.tsx', 'utf8');

code = code.replace(
  /source=\{\{ uri: item.image_url \|\| 'https:\/\/placehold.co\/600x400\/ea580c\/ffffff.png' \}\}/,
  "source={{ uri: (item.image_url && !item.image_url.includes('supabase')) ? item.image_url : 'https://placehold.co/600x400/ea580c/ffffff.png' }}"
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/app/recipes.tsx', code);
