const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/app/index.tsx', 'utf8');
code = code.replace(/<Info size=\{20\} color="#ea580c" \/>/g, '<Info size={20} color="white" />');
fs.writeFileSync('C:/projects/food-scanner/mobile/src/app/index.tsx', code);
