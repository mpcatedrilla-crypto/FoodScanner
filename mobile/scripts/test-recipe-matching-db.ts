import Database from 'better-sqlite3';
import { matchAndRankRecipes } from '../src/lib/recipe-matching';
import type { Ingredient, Recipe } from '../src/lib/types';

const db = new Database('C:/projects/food-scanner/mobile/assets/app_v6.db', { readonly: true });
const recipes = db.prepare('SELECT * FROM recipes').all() as Recipe[];
const ingredients = db.prepare('SELECT * FROM ingredients').all() as Ingredient[];
const links = db.prepare('SELECT recipe_id, ingredient_id, is_main FROM recipe_ingredients').all() as {
  recipe_id: string;
  ingredient_id: string;
  is_main: number;
}[];

const pork = ingredients.find(i => i.name.toLowerCase() === 'pork');
if (!pork) throw new Error('Pork ingredient missing');

const ranked = matchAndRankRecipes(recipes, ingredients, links, [pork.id]);
if (ranked.length === 0) throw new Error('pork produced no matches');
if (ranked.length > 5) throw new Error('top 5 violated');

for (let i = 1; i < ranked.length; i++) {
  const prev = ranked[i - 1];
  const cur = ranked[i];
  const ok =
    prev.matchScore > cur.matchScore ||
    (prev.matchScore === cur.matchScore && prev.totalIngredients <= cur.totalIngredients);
  if (!ok) throw new Error('sort order broken');
}

const first = ranked[0];
if (first.matchScore < 3) {
  throw new Error(`expected a signature (score 3+) recipe first, got ${first.recipe.name} score ${first.matchScore}`);
}

console.log('sqlite pork top 5:');
for (const m of ranked) {
  console.log(`${m.matchScore}\t${m.totalIngredients}\t${m.recipe.name}`);
}
console.log('sqlite integration passed');
