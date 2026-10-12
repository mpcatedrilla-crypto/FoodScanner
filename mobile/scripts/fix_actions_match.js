const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', 'utf8');

code = code.replace(
  /const matches: RecipeMatch\[\] = allRecipes\.map\(recipe => \{[\s\S]*?totalIngredients: riRows\.length,\s*\};\s*\}\);/m,
  `const matches: RecipeMatch[] = allRecipes.map(recipe => {
    const riRows = allRecipeIngredients.filter(ri => ri.recipe_id === recipe.id);
    const matched: Ingredient[] = [];
    const missing: Ingredient[] = [];
    
    for (const ri of riRows) {
      const ing = allIngredients.find(i => i.id === ri.ingredient_id);
      if (!ing) continue;
      if (detectedMap.has(ri.ingredient_id)) {
        matched.push(ing);
      } else {
        missing.push(ing);
      }
    }

    return {
      recipe,
      matchedIngredients: matched,
      missingIngredients: missing,
      matchPercentage: riRows.length > 0 ? (matched.length / riRows.length) * 100 : 0,
      matchCount: matched.length,
      totalIngredients: riRows.length
    } as any;
  });`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', code);
