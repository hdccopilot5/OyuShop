const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://oyuadmin:Mongol2020@oyushop.pkfj1cb.mongodb.net/babyshop?appName=OyuShop";

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  images: [String],
  stock: { type: Number, default: 0 },
  orderIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', ProductSchema);

async function cleanupDuplicates() {
  try {
    console.log('🔗 MongoDB холбож байна...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB холбогдлоо');

    // Давхардсан бараа олох
    const duplicates = await Product.aggregate([
      {
        $group: {
          _id: '$name',
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicates.length === 0) {
      console.log('✅ Давхардсан бараа байхгүй');
      process.exit(0);
    }

    console.log(`\n⚠️  ${duplicates.length} нэр давхардсан байна:`);
    for (const dup of duplicates) {
      console.log(`📦 "${dup._id}" - ${dup.count} копи`);

      // Эхний барааг үлдээсээр бусдыг устгa
      const idsToDelete = dup.ids.slice(1);
      const result = await Product.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`   → ${result.deletedCount} копи устгагдлаа`);
    }

    // Нийт бараа шалгах
    const totalCount = await Product.countDocuments();
    console.log(`\n✅ Бүрэн дүүрэлт: ${totalCount} бараа`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Алдаа:', err.message);
    process.exit(1);
  }
}

cleanupDuplicates();
