import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, RecipeIngredient, Ingredient, RecipeMatch } from './types';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  const dbName = 'food_scanner_v2.db';
  const dbDir = FileSystem.documentDirectory;
  const dbPath = `${dbDir}/${dbName}`.replace('//', '/');
  
  try {
    try {
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    } catch(e) {}

    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    
    // Only copy if it does not exist (or if we intentionally want to overwrite)
    if (!dbInfo.exists) {
      const asset = Asset.fromModule(require('../../assets/app_v4.db'));
      try { await asset.downloadAsync(); } catch(e) {}
      
      if (asset.localUri) {
        await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
      } else {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        await FileSystem.writeAsStringAsync(dbPath, base64, { encoding: FileSystem.EncodingType.Base64 });
      }
    }
    
    db = await SQLite.openDatabaseAsync(dbName, {}, dbDir ? dbDir.replace('file://', '') : undefined);
    return db;
  } catch (err) {
    console.error('DB Mount Error:', err); Alert.alert('DB Error', String(err));
    throw err;
  }
}

export async function getRecipes(category?: string | string[]): Promise<Recipe[]> {
  const database = await getDb();
  let rawCategory = Array.isArray(category) ? category[0] : category;

  if (!rawCategory || rawCategory.trim() === '' || rawCategory.toLowerCase() === 'all') {
    return await database.getAllAsync<Recipe>('SELECT * FROM recipes');
  }

  const catKey = rawCategory.toLowerCase().trim();
  const keywords = catKey.split('|').map(k => k.trim()).filter(k => k.length > 0);
  
  const allRecipes = await database.getAllAsync<Recipe>('SELECT * FROM recipes');
  if (keywords.length === 0) return allRecipes;

  return allRecipes.filter(r => {
    const nameEn = r.name.toLowerCase();
    const nameTg = (r.name_tagalog || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    return keywords.some(kw => nameEn.includes(kw) || nameTg.includes(kw) || desc.includes(kw));
  });
}

export async function getIngredients(): Promise<Ingredient[]> {
  try {
    const database = await getDb();
    const rows = await database.getAllAsync<Ingredient>('SELECT * FROM ingredients');
    return rows;
  } catch (err) {
    return [];
  }
}

export async function getRecipeById(id: string) {
  const database = await getDb();
  const recipe = await database.getFirstAsync<Recipe>('SELECT * FROM recipes WHERE id = ?', [id]);
  if (!recipe) return null;

  const recipeIngredients = await database.getAllAsync<any>(
    `SELECT ri.*, i.name as ingredient_name, i.name_tagalog as ingredient_tagalog, i.coco_class
     FROM recipe_ingredients ri 
     JOIN ingredients i ON ri.ingredient_id = i.id 
     WHERE ri.recipe_id = ?`, 
    [id]
  );

  const formattedIngredients: RecipeIngredient[] = recipeIngredients.map(ri => ({
    id: ri.id,
    recipe_id: ri.recipe_id,
    ingredient_id: ri.ingredient_id,
    amount: ri.amount,
    unit: ri.unit,
    is_required: ri.is_optional ? false : true,
    created_at: ri.created_at,
    ingredient: {
      id: ri.ingredient_id,
      name: ri.ingredient_name,
      name_tagalog: ri.ingredient_tagalog,
      coco_class: ri.coco_class
    }
  }));

  return { ...recipe, recipe_ingredients: formattedIngredients };
}

export async function findMatchingRecipes(detectedIngredientIds: string[]): Promise<RecipeMatch[]> {
  const database = await getDb();
  const allRecipes = await database.getAllAsync<Recipe>('SELECT * FROM recipes');
  const allIngredients = await database.getAllAsync<Ingredient>('SELECT * FROM ingredients');
  const allRecipeIngredients = await database.getAllAsync<{recipe_id: string, ingredient_id: string}>('SELECT recipe_id, ingredient_id FROM recipe_ingredients');

  const detected = detectedIngredientIds.map(i => i.toLowerCase().trim());
  if (detected.length === 0) return [];

  const detectedMap = new Set<string>();
  for (const ing of allIngredients) {
    if (
      detected.includes(ing.id.toLowerCase()) || 
      detected.includes(ing.name.toLowerCase()) || 
      (ing.coco_class && ing.coco_class.toLowerCase().split(',').some((cc: string) => detected.includes(cc.trim())))
    ) {
      detectedMap.add(ing.id);
    }
  }

  const matches: RecipeMatch[] = allRecipes.map(recipe => {
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
  });

  return matches
    .filter(m => m.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || a.totalIngredients - b.totalIngredients);
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

export async function deleteRecipeHistory(id: string) {
  const history = await getRecipeHistory();
  const newHistory = history.filter((h: any) => h.id !== id);
  await AsyncStorage.setItem('history', JSON.stringify(newHistory));
  return true;
}

