const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/projects/food-scanner/mobile/assets/app_v4.db');

db.all("SELECT id, name, coco_class FROM ingredients WHERE coco_class LIKE '%onion%';", [], (err, rows) => {
  if (err) throw err;
  const predClass = "onion";
  const sanitize = (str) => str ? str.replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase().trim() : '';
  const pClass = sanitize(predClass);
  
  for (const i of rows) {
    const iName = sanitize(i.name);
    const iClasses = i.coco_class ? i.coco_class.split(',').map(sanitize) : [];
    
    const hit = iClasses.includes(pClass) || iName === pClass;
    console.log(`Checking ${i.name} (${i.coco_class}) against ${predClass}: ${hit}`);
  }
});
