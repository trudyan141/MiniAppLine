import sqlite from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Database path
const dbPath = path.join(__dirname, 'db.sqlite');

// Connect to the database
const db = sqlite(dbPath);

console.log('Connected to database:', dbPath);

// Delete existing menu items
console.log('Deleting existing menu items...');
db.prepare('DELETE FROM menu_items').run();
console.log('✅ Deleted all menu items');

// Insert new menu items
console.log('🌱 Seeding menu items...');
const menuItems = [
  { name: 'Espresso', category: 'Coffee', description: 'Strong Italian coffee', price: 300, image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/51/%28A_Donde_Vamos%2C_Quito%29_Chocolate_of_Ecuador_and_Espresso.JPG', available: 1 },
  { name: 'Latte', category: 'Coffee', description: 'Espresso with steamed milk', price: 350, image_url: 'https://driftaway.coffee/wp-content/uploads/2015/09/shutterstock_117176206.jpg', available: 1 },
  { name: 'Chocolate Cake', category: 'Dessert', description: 'Rich chocolate cake', price: 400, image_url: 'https://i.ebayimg.com/images/g/LtgAAOSwKKxlEsrW/s-l1600.webp', available: 1 },
  { name: 'Green Tea', category: 'Tea', description: 'Japanese green tea', price: 250, image_url: 'https://i.ebayimg.com/images/g/AP8AAOSw6Btj9UCV/s-l1600.webp', available: 1 },
  { name: 'Sandwich', category: 'Food', description: 'Ham and cheese sandwich', price: 500, image_url: 'https://www.clubhouse.ca/-/media/project/oneweb/mccormick-us/frenchs/recipes/h/1376x774/ham_and_cheese_sandwich_with_creamy_yellow_mustard_1376x774.jpg?rev=609ac9507b2641d4bbffd8a53c8bd132&vd=20220426T153226Z&extension=webp&hash=CA4DA2460ED9D2F6183F2483EF4AE1CC', available: 1 },
];

const insertStmt = db.prepare(`
  INSERT INTO menu_items (name, category, description, price, image_url, available)
  VALUES (?, ?, ?, ?, ?, ?)
`);

menuItems.forEach(item => {
  insertStmt.run(item.name, item.category, item.description, item.price, item.image_url, item.available);
});

console.log(`✅ Seeded ${menuItems.length} menu items`);

// Close the database connection
db.close();
console.log('Database connection closed.');
