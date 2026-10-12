const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', 'utf8');

code = code.replace(
  /const handleReviewIngredients = \(\) => \{\s*setIsLiveScanning\(false\);\s*setShowResultsUi\(true\);\s*\};/g,
  `const handleReviewIngredients = () => {
      setIsLiveScanning(false);
      handleShowRecipes();
    };`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', code);
