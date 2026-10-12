const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', 'utf8');

code = code.replace(
  /const dbName = 'app_v4\.db';/g,
  `const dbName = 'food_scanner_v1.db';`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', code);
