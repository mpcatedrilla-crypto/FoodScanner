const fs = require('fs');

let layoutCode = fs.readFileSync('src/app/_layout.tsx', 'utf8');

// Replace the Image scan button back with the clean orange circular button and ScanText icon
const oldBlockRegex = /<View\s+style=\{\{[\s\S]*?\}\}\s*>\s*<Image[\s\S]*?\/>\s*<\/View>/;

const newBlock = `<View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: '#ea580c',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#ea580c',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 6,
                      elevation: 6,
                    }}
                  >
                    <ScanText color="#ffffff" size={28} />
                  </View>`;

if (oldBlockRegex.test(layoutCode)) {
  layoutCode = layoutCode.replace(oldBlockRegex, newBlock);
  // Also reset tabBarIconStyle dimensions
  layoutCode = layoutCode.replace(/width:\s*72,\s*height:\s*72,\s*borderRadius:\s*36/g, 'width: 56, height: 56, borderRadius: 28');
  fs.writeFileSync('src/app/_layout.tsx', layoutCode);
  console.log("Successfully restored original scan button!");
} else {
  console.log("Pattern did not match");
}
