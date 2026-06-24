/* ══════════════════════════════════════════════
   db/seed.js
   Run once with: node db/seed.js
   Populates the menu table with starter items and
   creates a default admin login.
══════════════════════════════════════════════ */
const bcrypt = require('bcryptjs');
const db = require('./jsonStore');

const menuItems = [
  // Coffee
  { name: 'Signature Espresso', category: 'coffee', description: 'Bold single-origin espresso with a smooth crema finish.', price: 180, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Creamy Latte', category: 'coffee', description: 'Perfectly steamed milk poured over a double shot of espresso.', price: 220, image: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Mocha Delight', category: 'coffee', description: 'Rich chocolate blended with house espresso and foamed milk.', price: 250, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Classic Cappuccino', category: 'coffee', description: 'Velvety cappuccino with a thick layer of microfoam and cinnamon.', price: 200, image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500&auto=format&fit=crop&q=80', available: true },

  // Fast Food
  { name: 'Grilled Club Sandwich', category: 'fastfood', description: 'Triple-layered with chicken, lettuce, tomato, and garlic aioli.', price: 320, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Haven Burger', category: 'fastfood', description: 'Juicy patty, caramelised onions, cheddar, and smoky sauce.', price: 380, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Crispy Fries', category: 'fastfood', description: 'Golden seasoned fries served with signature dipping sauces.', price: 150, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Café Wrap', category: 'fastfood', description: 'Grilled veggies or chicken in a whole-wheat wrap with hummus.', price: 280, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80', available: true },

  // Desserts
  { name: 'New York Cheesecake', category: 'desserts', description: 'Classic baked cheesecake with a buttery graham cracker crust.', price: 290, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Brownie Lava', category: 'desserts', description: 'Warm chocolate brownie with a molten centre, served with ice cream.', price: 310, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Velvet Layer Cake', category: 'desserts', description: 'Red velvet cake topped with cream cheese frosting.', price: 260, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Butter Croissant', category: 'desserts', description: 'Flaky, golden croissant fresh from the oven every morning.', price: 160, image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=500&auto=format&fit=crop&q=80', available: true },

  // Beverages
  { name: 'Berry Smoothie', category: 'beverages', description: 'Mixed berries blended with almond milk and honey.', price: 200, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Lemon Mint Cooler', category: 'beverages', description: 'Zesty lemon with fresh mint leaves and sparkling water.', price: 140, image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Iced Caramel Macchiato', category: 'beverages', description: 'Cold espresso layered with vanilla milk and caramel drizzle.', price: 260, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Rich Hot Chocolate', category: 'beverages', description: 'Velvety dark chocolate made with whole milk and a hint of vanilla.', price: 220, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=80', available: true },

  // Specials
  { name: "Haven Breakfast Platter", category: 'specials', description: 'Eggs, toast, avocado, seasonal fruit, and house brew coffee.', price: 520, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&auto=format&fit=crop&q=80', available: true },
  { name: "Chef's Pasta of the Day", category: 'specials', description: 'Fresh handmade pasta in a rotating sauce — ask your server today.', price: 420, image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Truffle Mushroom Toast', category: 'specials', description: 'Sourdough with sautéed mushrooms, truffle oil, and poached egg.', price: 390, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80', available: true },
  { name: 'Stack of Pancakes', category: 'specials', description: 'Fluffy buttermilk pancakes with maple syrup and fresh berries.', price: 340, image: 'https://images.unsplash.com/photo-1484723091739-30990d1c1e2a?w=500&auto=format&fit=crop&q=80', available: true },
];

function seedMenu() {
  const existing = db.all('menu');
  if (existing.length > 0) {
    console.log(`Menu already has ${existing.length} items — skipping seed. Delete db/data/menu.json to re-seed.`);
    return;
  }
  menuItems.forEach(item => db.insert('menu', item));
  console.log(`Seeded ${menuItems.length} menu items.`);
}

function seedAdmin() {
  const existing = db.findOne('admins', a => a.username === 'admin');
  if (existing) {
    console.log('Admin user already exists — skipping.');
    return;
  }
  const passwordHash = bcrypt.hashSync('Admin@123', 10);
  db.insert('admins', { username: 'admin', passwordHash });
  console.log('Created default admin user → username: admin | password: Admin@123');
  console.log('IMPORTANT: change this password after first login.');
}

seedMenu();
seedAdmin();