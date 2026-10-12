const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', 'utf8');

code = code.replace(
  /const hit = ingredientsDB\.find\(i =>\s*\n\s*\(i\.coco_class.*?\n.*?\n\s*\);/m,
  `const hit = ingredientsDB.find(i => {
          const sanitize = (str) => str ? str.replace(/[\\u200B-\\u200D\\uFEFF]/g, '').toLowerCase().trim() : '';
          const pClass = sanitize(pred.class);
          const iName = sanitize(i.name);
          const iClasses = i.coco_class ? i.coco_class.split(',').map(sanitize) : [];
          return iClasses.includes(pClass) || iName === pClass;
        });`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', code);
