const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/app/recipes.tsx', 'utf8');

// Import RecipeImages
code = code.replace(/import type \{ Recipe \} from '\.\.\/lib\/types';/, "import type { Recipe } from '../lib/types';\nimport { RecipeImages } from '../lib/imageMap';");

// Update source
code = code.replace(/source=\{\{ uri: \(item\.image_url && !item\.image_url\.includes\('supabase'\)\) \? item\.image_url : 'https:\/\/placehold\.co\/600x400\/ea580c\/ffffff\.png' \}\}/, "source={RecipeImages[item.id] || require('../../assets/images/hero-food.jpg')}");

fs.writeFileSync('C:/projects/food-scanner/mobile/src/app/recipes.tsx', code);
