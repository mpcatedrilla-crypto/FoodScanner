import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, RecipeIngredient, Ingredient, RecipeMatch, RecipeWithIngredients } from './types';
import { matchAndRankRecipes, RecipeIngredientRow } from './recipe-matching';
import { getPanlasangPinoyNutrition } from './recipe-nutrition-data';

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function applyRecipeNutritionFallbacks<T extends Recipe>(recipe: T): T {
  const pp = getPanlasangPinoyNutrition(recipe.name);
  if (!pp) return recipe;

  return {
    ...recipe,
    calories_per_serving: recipe.calories_per_serving ?? pp.calories,
    protein_per_serving: recipe.protein_per_serving ?? pp.protein,
    carbs_per_serving: recipe.carbs_per_serving ?? pp.carbs,
    fats_per_serving: recipe.fats_per_serving ?? pp.fats,
  };
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const dbName = 'food_scanner_v24.db';
    const dbDir = FileSystem.documentDirectory;
    const dbPath = `${dbDir}/${dbName}`.replace('//', '/');

    try {
      try {
        if (dbDir) {
          await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
        }
      } catch (e) {}

      const dbInfo = await FileSystem.getInfoAsync(dbPath);

      if (!dbInfo.exists) {
        const asset = Asset.fromModule(require('../../assets/app_v6.db'));
        try {
          await asset.downloadAsync();
        } catch (e) {}

        if (asset.localUri) {
          await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
        } else {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await FileSystem.writeAsStringAsync(dbPath, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      }

      db = await SQLite.openDatabaseAsync(
        dbName,
        {},
        dbDir ? dbDir.replace('file://', '') : undefined
      );
      return db;
    } catch (err) {
      dbPromise = null;
      console.error('DB Mount Error:', err);
      Alert.alert('DB Error', String(err));
      throw err;
    }
  })();

  return dbPromise;
}

export async function getRecipes(category?: string | string[]): Promise<Recipe[]> {
  let database = await getDb();
  const rawCategory = Array.isArray(category) ? category[0] : category;

  let allRecipes: Recipe[];
  try {
    allRecipes = await database.getAllAsync<Recipe>('SELECT * FROM recipes ORDER BY name ASC');
  } catch (err) {
    db = null;
    dbPromise = null;
    database = await getDb();
    allRecipes = await database.getAllAsync<Recipe>('SELECT * FROM recipes ORDER BY name ASC');
  }

  allRecipes = allRecipes.map(applyRecipeNutritionFallbacks);

  if (!rawCategory || rawCategory.trim() === '' || rawCategory.toLowerCase() === 'all') {
    return allRecipes;
  }

  const trimmed = rawCategory.trim();
  const catKey = trimmed.toLowerCase();
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    chicken: ['chicken', 'manok', 'tinola', 'afritada'],
    pork: ['pork', 'baboy', 'liempo', 'lechon', 'menudo', 'sinigang'],
    beef: ['beef', 'baka', 'caldereta', 'nilaga', 'bulalo'],
    seafood: ['seafood', 'fish', 'isda', 'tilapia', 'bangus', 'shrimp', 'hipon', 'pusit', 'squid', 'crab', 'alimango', 'tahong', 'escabeche', 'sinanglay'],
    vegetables: ['vegetables', 'vegetable', 'gulay', 'talong', 'eggplant', 'ampalaya', 'sitaw', 'monggo', 'laing', 'pinakbet', 'tortang', 'sarciado', 'itlog'],
  };

  const baseKeywords = catKey
    .split('|')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
  const expandedKeywords = CATEGORY_KEYWORDS[catKey] || baseKeywords;

  if (expandedKeywords.length === 0) return allRecipes;

  return allRecipes.filter((r) => {
    const nameEn = (r.name || '').toLowerCase();
    const nameTg = (r.name_tagalog || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    const cat = (r.category || '').toLowerCase();
    return expandedKeywords.some(
      (kw) => nameEn.includes(kw) || nameTg.includes(kw) || desc.includes(kw) || cat.includes(kw)
    );
  });
}

export async function getIngredients(): Promise<Ingredient[]> {
  try {
    let database = await getDb();
    try {
      return await database.getAllAsync<Ingredient>('SELECT * FROM ingredients');
    } catch (e) {
      db = null;
      dbPromise = null;
      database = await getDb();
      return await database.getAllAsync<Ingredient>('SELECT * FROM ingredients');
    }
  } catch (err) {
    return [];
  }
}

export async function getRecipeById(id: string): Promise<RecipeWithIngredients | null> {
  let database = await getDb();
  let recipe: Recipe | null;
  try {
    recipe = await database.getFirstAsync<Recipe>('SELECT * FROM recipes WHERE id = ?', [id]);
  } catch (e) {
    db = null;
    dbPromise = null;
    database = await getDb();
    recipe = await database.getFirstAsync<Recipe>('SELECT * FROM recipes WHERE id = ?', [id]);
  }
  if (!recipe) return null;

  const recipeIngredients = await database.getAllAsync<any>(
    `SELECT ri.*, i.name as ingredient_name, i.coco_class,
            i.calories_per_100g, i.protein_per_100g, i.carbs_per_100g, i.fats_per_100g
     FROM recipe_ingredients ri 
     JOIN ingredients i ON ri.ingredient_id = i.id 
     WHERE ri.recipe_id = ?`,
    [id]
  );

  const formattedIngredients: RecipeIngredient[] = recipeIngredients.map((ri, idx) => ({
    id: ri.id || `${ri.recipe_id}_${ri.ingredient_id}_${idx}`,
    recipe_id: ri.recipe_id,
    ingredient_id: ri.ingredient_id,
    amount: ri.amount,
    unit: ri.unit,
    is_required: ri.is_optional ? false : true,
    is_main: ri.is_main,
    created_at: ri.created_at,
    ingredient: {
      id: ri.ingredient_id,
      name: ri.ingredient_name,
      name_tagalog: ri.ingredient_tagalog || '',
      coco_class: ri.coco_class,
      calories_per_100g: ri.calories_per_100g,
      protein_per_100g: ri.protein_per_100g,
      carbs_per_100g: ri.carbs_per_100g,
      fats_per_100g: ri.fats_per_100g,
    },
  }));

  const enrichedRecipe = applyRecipeNutritionFallbacks(recipe);
  return { ...enrichedRecipe, recipe_ingredients: formattedIngredients };
}

export async function findMatchingRecipes(detectedIngredientIds: string[]): Promise<RecipeMatch[]> {
  let database = await getDb();
  try {
    const allRecipes = (await database.getAllAsync<Recipe>('SELECT * FROM recipes')).map(applyRecipeNutritionFallbacks);
    const allIngredients = await database.getAllAsync<Ingredient>('SELECT * FROM ingredients');
    const allRecipeIngredients = await database.getAllAsync<RecipeIngredientRow>(
      'SELECT recipe_id, ingredient_id, is_main FROM recipe_ingredients'
    );

    return matchAndRankRecipes(
      allRecipes,
      allIngredients,
      allRecipeIngredients,
      detectedIngredientIds,
      5
    );
  } catch (err) {
    // Re-open database handle if Android native SQLite pointer became stale
    db = null;
    dbPromise = null;
    database = await getDb();
    const allRecipes = (await database.getAllAsync<Recipe>('SELECT * FROM recipes')).map(applyRecipeNutritionFallbacks);
    const allIngredients = await database.getAllAsync<Ingredient>('SELECT * FROM ingredients');
    const allRecipeIngredients = await database.getAllAsync<RecipeIngredientRow>(
      'SELECT recipe_id, ingredient_id, is_main FROM recipe_ingredients'
    );
    return matchAndRankRecipes(
      allRecipes,
      allIngredients,
      allRecipeIngredients,
      detectedIngredientIds,
      5
    );
  }
}

export async function getRecipeHistory() {
  const history = await AsyncStorage.getItem('history');
  return history ? JSON.parse(history) : [];
}

export async function saveRecipeHistory(recipeId: string) {
  const history = await getRecipeHistory();
  if (history.find((h: any) => h.recipe_id === recipeId)) return true;

  const database = await getDb();
  const recipe = await database.getFirstAsync<Recipe>('SELECT * FROM recipes WHERE id = ?', [recipeId]);

  history.unshift({
    id: Date.now().toString(),
    recipe_id: recipeId,
    recipes: recipe,
    created_at: new Date().toISOString(),
  });

  await AsyncStorage.setItem('history', JSON.stringify(history.slice(0, 50)));
  return true;
}

export async function addRecipeHistory(_userId: string, recipeId: string) {
  return saveRecipeHistory(recipeId);
}

export async function deleteRecipeHistory(id: string) {
  const history = await getRecipeHistory();
  const newHistory = history.filter((h: any) => h.id !== id);
  await AsyncStorage.setItem('history', JSON.stringify(newHistory));
  return true;
}
