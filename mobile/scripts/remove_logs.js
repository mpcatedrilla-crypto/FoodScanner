const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', 'utf8');
code = code.replace(/\{\/\* DEBUG OVERLAY \*\/\}[\s\S]*?<\/View>/, '');
fs.writeFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', code);
