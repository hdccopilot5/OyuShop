// Локал database-аас бараануудыг уншиж Render production руу нэмэх
const mongoose = require('mongoose');

const localUri = 'mongodb+srv://oyuadmin:Mongol2020@oyushop.pkfj1cb.mongodb.net/babyshop?appName=OyuShop';
const RENDER_API = 'https://oyushop-1.onrender.com/api';

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

async function syncProducts() {
  try {
    console.log('🔄 Локал MongoDB-оос бараа уншиж байна...\n');
    await mongoose.connect(localUri);
    
    const products = await Product.find({});
    console.log(`📦 Нийт ${products.length} бараа олдлоо\n`);
    
    if (products.length === 0) {
      console.log('❌ Бараа олдсонгүй!');
      process.exit(0);
    }
    
    console.log('🚀 Render production руу бараа илгээж байна...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const product of products) {
      try {
        const productData = {
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          image: product.image,
          images: product.images || [],
          stock: product.stock,
          orderIndex: product.orderIndex
        };
        
        const response = await fetch(`${RENDER_API}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        
        if (response.ok) {
          successCount++;
          console.log(`✅ ${successCount}. ${product.name}`);
        } else {
          failCount++;
          console.log(`❌ Алдаа: ${product.name}`);
        }
      } catch (err) {
        failCount++;
        console.log(`❌ Алдаа: ${product.name} - ${err.message}`);
      }
    }
    
    console.log(`\n✅ Амжилттай: ${successCount}`);
    console.log(`❌ Амжилтгүй: ${failCount}`);
    console.log('\n🎉 Дууслаа!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Алдаа:', err.message);
    process.exit(1);
  }
}

syncProducts();
