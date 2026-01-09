const mongoose = require('mongoose');

const uri = 'mongodb+srv://oyuadmin:Mongol2020@oyushop.pkfj1cb.mongodb.net/babyshop?appName=OyuShop';

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  images: [String],
  stock: { type: Number, default: 0 },
  orderIndex: { type: Number, default: () => Date.now() }
});

const Product = mongoose.model('Product', ProductSchema);

async function checkZeroStock() {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB холбогдлоо\n');
    
    // Үлдэгдэлгүй бараанууд
    const zeroStock = await Product.find({ $or: [{ stock: 0 }, { stock: { $exists: false } }] });
    
    console.log('=== ҮЛДЭГДЭЛГҮЙ БАРААНУУД ===\n');
    
    if (zeroStock.length === 0) {
      console.log('Үлдэгдэлгүй бараа байхгүй байна ✅\n');
    } else {
      zeroStock.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.name}`);
        console.log(`   ID: ${p._id}`);
        console.log(`   Үнэ: ${p.price}₮`);
        console.log(`   Үлдэгдэл: ${p.stock ?? 'undefined'}`);
        console.log(`   Ангилал: ${p.category}`);
        console.log('');
      });
    }
    
    console.log(`Нийт үлдэгдэлгүй: ${zeroStock.length}`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Алдаа:', err.message);
    process.exit(1);
  }
}

checkZeroStock();
