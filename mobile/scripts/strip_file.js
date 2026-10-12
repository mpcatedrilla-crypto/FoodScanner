const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', 'utf8');

code = code.replace(
  /db = await SQLite\.openDatabaseAsync\(dbName, \{\}, dbDir\);/g,
  `db = await SQLite.openDatabaseAsync(dbName, {}, dbDir ? dbDir.replace('file://', '') : undefined);`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', code);
