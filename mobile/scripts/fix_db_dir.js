const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', 'utf8');

code = code.replace(
  /const dbDir = SQLite\.defaultDatabaseDirectory \|\| `\$\{FileSystem\.documentDirectory\}SQLite`;/g,
  `const dbDir = FileSystem.documentDirectory;`
);

code = code.replace(
  /db = await SQLite\.openDatabaseAsync\(dbName\);/g,
  `db = await SQLite.openDatabaseAsync(dbName, {}, dbDir);`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', code);
