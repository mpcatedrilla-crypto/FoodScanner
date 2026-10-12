const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('=== TEST SUITE: Warm & Spicy Theme & Requirements ===');

// 1. Theme checks
const targetFiles = [
  'src/app/index.tsx',
  'src/app/scan.tsx',
  'src/app/recipes.tsx',
  'src/app/help.tsx',
  'src/app/about.tsx',
  'src/app/terms.tsx',
];

for (const file of targetFiles) {
  const content = fs.readFileSync(file, 'utf8');
  test(`${file} contains background #FFF9F2`, () => {
    assert(content.includes('#FFF9F2'), `Missing #FFF9F2 in ${file}`);
  });
  test(`${file} contains primary #ea580c`, () => {
    assert(content.includes('#ea580c'), `Missing #ea580c in ${file}`);
  });
}

// 2. Home screen layout checks
const indexContent = fs.readFileSync('src/app/index.tsx', 'utf8');

test('Home screen has "Recipes Available" section title', () => {
  assert(indexContent.includes('Recipes Available'), 'Missing "Recipes Available"');
});

test('Home screen does NOT have "Browse by Category"', () => {
  assert(!indexContent.includes('Browse by Category'), 'Found "Browse by Category"');
});

test('Home screen does NOT have "Recommended for You"', () => {
  assert(!indexContent.includes('Recommended for You'), 'Found "Recommended for You"');
});

test('All 5 category images retained and referenced', () => {
  assert(indexContent.includes('cat_chicken.png'), 'Missing cat_chicken.png');
  assert(indexContent.includes('cat_pork.png'), 'Missing cat_pork.png');
  assert(indexContent.includes('cat_beef.png'), 'Missing cat_beef.png');
  assert(indexContent.includes('cat_seafood.png'), 'Missing cat_seafood.png');
  assert(indexContent.includes('cat_veggies.png'), 'Missing cat_veggies.png');
});

test('Pork uses Ham icon and Chicken uses Drumstick', () => {
  assert(indexContent.includes('icon: Drumstick'), 'Chicken missing Drumstick');
  assert(indexContent.includes('icon: Ham'), 'Pork missing Ham');
});

test('Category icons use style instead of unsupported className', () => {
  assert(!indexContent.includes('<cat.icon size={28} color="rgba(255,255,255,0.95)" className='), 'Found unsupported className on cat.icon');
});

test('Category buttons pass category parameter to /recipes', () => {
  assert(indexContent.includes("pathname: '/recipes'"), 'Missing /recipes route navigation');
  assert(indexContent.includes('category: cat.name'), 'Missing category parameter passing');
});

// 3. Tab Bar and Scan Button
const layoutContent = fs.readFileSync('src/app/_layout.tsx', 'utf8');

test('Tab bar has exactly 3 visible screens (index, scan, help)', () => {
  const visibleTabs = [];
  const screenMatches = [...layoutContent.matchAll(/<Tabs\.Screen\s+name="([^"]+)"([\s\S]*?)\/>/g)];
  for (const match of screenMatches) {
    const name = match[1];
    const body = match[2];
    if (!body.includes('href: null')) {
      visibleTabs.push(name);
    }
  }
  assert.deepStrictEqual(visibleTabs, ['index', 'scan', 'help'], `Expected ['index', 'scan', 'help'], got ${JSON.stringify(visibleTabs)}`);
});

test('Scan tab is at index 1 (exact 50% horizontal center)', () => {
  const screens = [...layoutContent.matchAll(/name="(index|scan|help)"/g)].map(m => m[1]);
  assert.strictEqual(screens[1], 'scan', 'Scan is not the middle tab');
});

test('Scan button is prominent 52x52 with #ea580c background', () => {
  assert(layoutContent.includes('width: 52'), 'Missing width 52');
  assert(layoutContent.includes('height: 52'), 'Missing height 52');
  assert(layoutContent.includes('borderRadius: 26'), 'Missing borderRadius 26');
  assert(layoutContent.includes("backgroundColor: '#ea580c'"), 'Missing #ea580c background on scan button');
});

test('Tab bar height accommodates 52px button without overflow (barHeight >= 70)', () => {
  assert(layoutContent.includes('barHeight = 70'), 'barHeight not increased to 70 for 52px button clearance');
});

test('Scan tab has tabBarShowLabel: false', () => {
  assert(layoutContent.includes('tabBarShowLabel: false'), 'Missing tabBarShowLabel: false on scan tab');
});

test('Scan tab has tabBarIconStyle with 52x52 dimensions and tabBarButton centering', () => {
  assert(layoutContent.includes('tabBarIconStyle:'), 'Missing tabBarIconStyle on scan tab');
  assert(layoutContent.includes('tabBarButton:'), 'Missing tabBarButton on scan tab');
});

test('TabLayout provides root StatusBar style="dark"', () => {
  assert(layoutContent.includes('<StatusBar style="dark" />'), 'Missing root StatusBar style="dark" in TabLayout');
});

// 4. Recipe Screen and DOST Nutrition
const recipesContent = fs.readFileSync('src/app/recipes.tsx', 'utf8');

test('recipes.tsx displays calories', () => {
  assert(recipesContent.includes('calories_per_serving'), 'Missing calories_per_serving');
  assert(recipesContent.includes('cal'), 'Missing "cal" label');
});

test('recipes.tsx displays protein', () => {
  assert(recipesContent.includes('protein_per_serving'), 'Missing protein_per_serving');
  assert(recipesContent.includes('Protein:'), 'Missing "Protein:" label');
});

test('recipes.tsx displays carbs', () => {
  assert(recipesContent.includes('carbs_per_serving'), 'Missing carbs_per_serving');
  assert(recipesContent.includes('Carbs:'), 'Missing "Carbs:" label');
});

test('recipes.tsx displays fats', () => {
  assert(recipesContent.includes('fats_per_serving'), 'Missing fats_per_serving');
  assert(recipesContent.includes('Fats:'), 'Missing "Fats:" label');
});

test('recipes.tsx does NOT display cooking steps / instructions', () => {
  assert(!recipesContent.includes('instructions'), 'Found instructions in recipes.tsx');
  assert(!recipesContent.includes('step'), 'Found step in recipes.tsx');
});

test('recipes.tsx safely handles array and string parameters', () => {
  assert(recipesContent.includes('Array.isArray(params.category)'), 'Missing Array.isArray check on params.category');
  assert(recipesContent.includes('Array.isArray(params.title)'), 'Missing Array.isArray check on params.title');
});

// 5. Database Category Filtering Logic Simulation
const seed = require('../src/lib/seedData.json');

const CATEGORY_KEYWORDS = {
  chicken: ['chicken', 'manok'],
  poultry: ['chicken', 'manok'],
  pork: ['pork', 'baboy', 'lechon', 'liempo'],
  beef: ['beef', 'baka', 'bulalo'],
  meat: ['pork', 'beef', 'baboy', 'baka', 'lechon', 'liempo', 'bulalo'],
  seafood: ['fish', 'shrimp', 'squid', 'bangus', 'tilapia', 'pusit', 'isda', 'seafood', 'crab', 'alimango', 'hipon', 'tuna'],
  seafoods: ['fish', 'shrimp', 'squid', 'bangus', 'tilapia', 'pusit', 'isda', 'seafood', 'crab', 'alimango', 'hipon', 'tuna'],
  fish: ['fish', 'shrimp', 'squid', 'bangus', 'tilapia', 'pusit', 'isda', 'seafood', 'crab', 'alimango', 'hipon', 'tuna'],
  vegetables: ['vegetable', 'gourd', 'eggplant', 'squash', 'gulay', 'pinakbet', 'chopsuey', 'monggo', 'laing', 'pechay', 'kangkong', 'sitaw', 'ampalaya'],
  vegetable: ['vegetable', 'gourd', 'eggplant', 'squash', 'gulay', 'pinakbet', 'chopsuey', 'monggo', 'laing', 'pechay', 'kangkong', 'sitaw', 'ampalaya'],
  veggies: ['vegetable', 'gourd', 'eggplant', 'squash', 'gulay', 'pinakbet', 'chopsuey', 'monggo', 'laing', 'pechay', 'kangkong', 'sitaw', 'ampalaya'],
  veggie: ['vegetable', 'gourd', 'eggplant', 'squash', 'gulay', 'pinakbet', 'chopsuey', 'monggo', 'laing', 'pechay', 'kangkong', 'sitaw', 'ampalaya'],
  gulay: ['vegetable', 'gourd', 'eggplant', 'squash', 'gulay', 'pinakbet', 'chopsuey', 'monggo', 'laing', 'pechay', 'kangkong', 'sitaw', 'ampalaya'],
};

function simulateGetRecipes(category) {
  const rawCategory = Array.isArray(category) ? category[0] : category;
  if (!rawCategory || typeof rawCategory !== 'string' || rawCategory.trim() === '' || rawCategory.toLowerCase() === 'all') {
    return seed.recipes;
  }
  const catKey = rawCategory.toLowerCase().trim();
  let keywords = [];
  if (CATEGORY_KEYWORDS[catKey]) {
    keywords = CATEGORY_KEYWORDS[catKey];
  } else if (rawCategory.includes('|')) {
    keywords = rawCategory.toLowerCase().split('|').map(s => s.trim()).filter(Boolean);
  } else {
    keywords = [catKey];
  }

  if (keywords.length === 0) {
    return seed.recipes;
  }

  return seed.recipes.filter(r => {
    return keywords.some(kw => 
      (r.name && r.name.toLowerCase().includes(kw)) ||
      (r.name_tagalog && r.name_tagalog.toLowerCase().includes(kw)) ||
      (r.description && r.description.toLowerCase().includes(kw))
    );
  });
}

test('Simulated getRecipes: Chicken matches recipes', () => {
  const res = simulateGetRecipes('Chicken');
  assert(res.length > 0, 'Chicken matched 0 recipes');
  assert.strictEqual(res.length, 16);
});

test('Simulated getRecipes: Pork matches recipes', () => {
  const res = simulateGetRecipes('Pork');
  assert(res.length > 0, 'Pork matched 0 recipes');
  assert.strictEqual(res.length, 24);
});

test('Simulated getRecipes: Beef matches recipes', () => {
  const res = simulateGetRecipes('Beef');
  assert(res.length > 0, 'Beef matched 0 recipes');
  assert.strictEqual(res.length, 8);
});

test('Simulated getRecipes: Seafood matches recipes', () => {
  const res = simulateGetRecipes('Seafood');
  assert(res.length > 0, 'Seafood matched 0 recipes');
  assert.strictEqual(res.length, 22);
});

test('Simulated getRecipes: Vegetables matches recipes', () => {
  const res = simulateGetRecipes('Vegetables');
  assert(res.length > 0, 'Vegetables matched 0 recipes');
  assert.strictEqual(res.length, 16);
});

test('Simulated getRecipes: Array parameter ["Chicken"] matches without error', () => {
  const res = simulateGetRecipes(['Chicken']);
  assert.strictEqual(res.length, 16);
});

test('Simulated getRecipes: Empty category returns all 115 recipes', () => {
  const res = simulateGetRecipes('');
  assert.strictEqual(res.length, 115);
});

test('Simulated getRecipes: Undefined category returns all 115 recipes', () => {
  const res = simulateGetRecipes(undefined);
  assert.strictEqual(res.length, 115);
});

test('Simulated getRecipes: Malformed delimiter query "|||" safely returns all 115 recipes', () => {
  const res = simulateGetRecipes('|||');
  assert.strictEqual(res.length, 115);
});

// 6. Old Green Elimination checks
function searchRecursive(dir, pattern) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.expo' && entry.name !== '.agents') {
        results.push(...searchRecursive(full, pattern));
      }
    } else if (entry.isFile() && (full.endsWith('.tsx') || full.endsWith('.ts') || full.endsWith('.css') || full.endsWith('.json'))) {
      const c = fs.readFileSync(full, 'utf8');
      if (pattern.test(c)) {
        results.push(full);
      }
    }
  }
  return results;
}

test('Zero occurrences of #0fa958 in src and global.css', () => {
  const greenFiles = searchRecursive('src', /0fa958/i);
  const globalCss = fs.readFileSync('global.css', 'utf8');
  if (/0fa958/i.test(globalCss)) greenFiles.push('global.css');
  assert.strictEqual(greenFiles.length, 0, `Found 0fa958 in: ${greenFiles.join(', ')}`);
});

test('Zero occurrences of pale green tints (#f0f9f4, #e6f4ea) in src', () => {
  const paleGreenFiles = searchRecursive('src', /(f0f9f4|e6f4ea)/i);
  assert.strictEqual(paleGreenFiles.length, 0, `Found pale green in: ${paleGreenFiles.join(', ')}`);
});

test('global.css primary color is Warm & Spicy orange #ea580c (HSL 20.5 90.2% 48.2%)', () => {
  const globalCss = fs.readFileSync('global.css', 'utf8');
  assert(globalCss.includes('20.5 90.2% 48.2%'), 'Missing #ea580c HSL in global.css');
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
