import { matchAndRankRecipes } from './recipe-matching';
import type { Ingredient, Recipe } from './types';

function recipe(id: string, name: string): Recipe {
  return { id, name } as Recipe;
}

function ingredient(id: string, name: string, coco_class: string | null = null): Ingredient {
  return { id, name, coco_class } as Ingredient;
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${label}: expected ${e}, got ${a}`);
  }
}

const pork = ingredient('pork', 'Pork', 'pork');
const onion = ingredient('onion', 'Onion', 'onion');
const garlic = ingredient('garlic', 'Garlic', 'garlic');
const eggplant = ingredient('eggplant', 'Eggplant', 'eggplant');
const ingredients = [pork, onion, garlic, eggplant];

const recipes = [
  recipe('bicol', 'Bicol Express'),
  recipe('ginisa', 'Ginisang Gulay'),
  recipe('adobo', 'Pork Adobo'),
  recipe('ensalada', 'Ensalada'),
];

const links = [
  { recipe_id: 'bicol', ingredient_id: 'pork', is_main: 1 },
  { recipe_id: 'bicol', ingredient_id: 'onion', is_main: 0 },
  { recipe_id: 'bicol', ingredient_id: 'garlic', is_main: 0 },
  { recipe_id: 'ginisa', ingredient_id: 'pork', is_main: 0 },
  { recipe_id: 'ginisa', ingredient_id: 'onion', is_main: 0 },
  { recipe_id: 'adobo', ingredient_id: 'pork', is_main: 1 },
  { recipe_id: 'ensalada', ingredient_id: 'eggplant', is_main: 1 },
];

const ranked = matchAndRankRecipes(recipes, ingredients, links, ['pork']);
assertEqual(ranked.map(r => r.recipe.id), ['adobo', 'bicol', 'ginisa'], 'pork rank order');
assertEqual(ranked.map(r => r.matchScore), [3, 3, 1], 'weighted scores');
assertEqual(ranked.length, 3, 'drop zero-match ensalada');

const cocoRanked = matchAndRankRecipes(recipes, ingredients, links, ['pork']);
assertEqual(cocoRanked[0].recipe.id, 'adobo', 'fewer ingredients wins score tie');

const many = matchAndRankRecipes(
  Array.from({ length: 8 }, (_, i) => recipe(`r${i}`, `R${i}`)),
  [pork],
  Array.from({ length: 8 }, (_, i) => ({ recipe_id: `r${i}`, ingredient_id: 'pork', is_main: 1 })),
  ['pork'],
);
assertEqual(many.length, 5, 'top 5 cap');

const empty = matchAndRankRecipes(recipes, ingredients, links, []);
assertEqual(empty.length, 0, 'empty detected list');

console.log('recipe-matching tests passed');
