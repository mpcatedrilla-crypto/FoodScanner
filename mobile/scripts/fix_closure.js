const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', 'utf8');

code = code.replace(
  /\/\/ Match against local DB[\s\S]*?setMatchedIngredients\(currentMatched\);/,
  `// Match against local DB
      setMatchedIngredients(prev => {
        const currentMatched = [...prev];
        for (const pred of detected) {
          const hit = ingredientsDB.find(i => {
            const sanitize = (str) => str ? str.replace(/[\\u200B-\\u200D\\uFEFF]/g, '').toLowerCase().trim() : '';
            const pClass = sanitize(pred.class);
            const iName = sanitize(i.name);
            const iClasses = i.coco_class ? i.coco_class.split(',').map(sanitize) : [];
            return iClasses.includes(pClass) || iName === pClass;
          });
          if (hit && !currentMatched.find(m => m.id === hit.id)) currentMatched.push(hit);
        }
        return currentMatched;
      });`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', code);
