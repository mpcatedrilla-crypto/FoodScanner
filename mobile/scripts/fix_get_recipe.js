const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', 'utf8');

code = code.replace(
  /return \{ \.\.\.recipe, ingredients: formattedIngredients \};/g,
  `return { ...recipe, recipe_ingredients: formattedIngredients };`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', code);
