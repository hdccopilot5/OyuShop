const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb+srv://oyuadmin:Mongol2020@oyushop.pkfj1cb.mongodb.net/babyshop?appName=OyuShop';

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

async function checkProducts() {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB холбогдлоо\n');
    
    // Сүүлд нэмэгдсэн 10 бараа
    const recentProducts = await Product.find({}).sort({ _id: -1 }).limit(10);
    console.log('=== СҮҮЛД НЭМЭГДСЭН 10 БАРАА ===\n');
    
    recentProducts.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name}`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Үнэ: ${p.price}₮`);
      console.log(`   Үлдэгдэл: ${p.stock}`);
      console.log(`   Ангилал: ${p.category}`);
      console.log(`   Зураг: ${p.image ? 'Байгаа' : 'Байхгүй'}`);
      console.log('');
    });
    
    // Нийт бараа
    const totalCount = await Product.countDocuments();
    console.log(`Нийт бараа: ${totalCount}`);
    
    // Үлдэгдэлгүй бараа
    const noStock = await Product.find({ $or: [{ stock: 0 }, { stock: { $exists: false } }] }).countDocuments();
    console.log(`Үлдэгдэлгүй бараа: ${noStock}`);
    
    // Ангиллаар
    const babyCount = await Product.find({ category: 'baby' }).countDocuments();
    const momsCount = await Product.find({ category: 'moms' }).countDocuments();
    console.log(`\nХүүхдийн бараа: ${babyCount}`);
    console.log(`Төрсөн эхийн бараа: ${momsCount}`);
    
    await mongoose.disconnect();
    console.log('\nAmжилттай дуусгалаа');
  } catch (err) {
    console.error('Алдаа гарлаа:', err.message);
    process.exit(1);
  }
}

checkProducts();
