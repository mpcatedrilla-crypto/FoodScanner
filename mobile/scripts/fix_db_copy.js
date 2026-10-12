const fs = require('fs');
let code = fs.readFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', 'utf8');

code = code.replace(
  /async function getDb\(\): Promise<SQLite\.SQLiteDatabase> \{[\s\S]*?db = await SQLite\.openDatabaseAsync\(dbName\);\s*return db;/m,
  `async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  const dbName = 'app_v4.db';
  const dbDir = SQLite.defaultDatabaseDirectory || \`\${FileSystem.documentDirectory}SQLite\`;
  const dbPath = \`\${dbDir}/\${dbName}\`.replace('//', '/');
  
  try {
    try {
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    } catch(e) {}

    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    
    // Only copy if it does not exist (or if we intentionally want to overwrite)
    if (!dbInfo.exists) {
      const asset = Asset.fromModule(require('../../assets/app_v4.db'));
      try { await asset.downloadAsync(); } catch(e) {}
      
      if (asset.localUri) {
        await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
      } else {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        await FileSystem.writeAsStringAsync(dbPath, base64, { encoding: FileSystem.EncodingType.Base64 });
      }
    }
    
    db = await SQLite.openDatabaseAsync(dbName);
    return db;`
);

fs.writeFileSync('C:/projects/food-scanner/mobile/src/lib/actions.ts', code);
