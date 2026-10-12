const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', 'utf8');

// 1. Remove the entire `if (showResultsUi) { ... }` block
code = code.replace(/if\s*\(showResultsUi\)\s*\{[\s\S]*?return\s*\([\s\S]*?<\/SafeAreaView>\s*\);\s*\}/, '');

// 2. Insert RecipeResultsDrawer into the main return
code = code.replace(
  /<\/SafeAreaView>\s*<\/View>\s*\);\s*\}\s*const styles/m,
  `        <RecipeResultsDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setIsLiveScanning(true);
            setMatchedIngredients([]);
          }}
          recipes={recipes}
          detectedIngredients={matchedIngredients}
        />
      </SafeAreaView>
    </View>
  );
}
const styles`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/app/scan.tsx', code);
