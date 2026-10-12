const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', 'utf8');

code = code.replace(
  /const handleReviewIngredients = \(\) => \{\s*setIsLiveScanning\(false\);\s*handleShowRecipes\(\);\s*\};/,
  `const handleReviewIngredients = () => {
      // Keep live scanning running
      handleShowRecipes();
    };

    useEffect(() => {
      if (isDrawerOpen) {
        handleShowRecipes();
      }
    }, [matchedIngredients.length, isDrawerOpen]);`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', code);
