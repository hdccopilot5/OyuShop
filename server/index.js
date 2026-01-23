const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Serve uploaded files statically
const uploadDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
} catch {}
app.use('/uploads', express.static(uploadDir));

// Multer storage for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const mimetype = (file.mimetype || '').toLowerCase();
    const name = (file.originalname || '').toLowerCase();
    const looksLikeVideo = mimetype.startsWith('video/')
      || mimetype === 'application/octet-stream' // iOS Safari sometimes sends octet-stream
      || mimetype === 'video/quicktime';
    const extVideo = name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm') || name.endsWith('.m4v');
    if (looksLikeVideo || extVideo) cb(null, true);
    else cb(new Error('Зөвхөн видео файл байж болно'));
  }
});

// API: Видео файл хуулж авах
app.post('/api/upload/video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Файл илгээгээгүй байна' });
    }

    console.log('📹 Video upload:', req.file.filename, 'size:', req.file.size);
    console.log('☁️ Cloudinary ready:', CLOUDINARY_READY);

    // If Cloudinary is enabled, upload to Cloudinary and return secure URL
    if (CLOUDINARY_READY) {
      try {
        console.log('🚀 Uploading to Cloudinary...');
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'video',
          folder: 'tutorials'
        });
        console.log('✅ Cloudinary success:', result.secure_url);
        // Clean up local temp file
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.json({ success: true, url: result.secure_url });
      } catch (e) {
        console.log('❌ Cloudinary upload error:', e.message);
        console.log('Error details:', e);
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(500).json({ success: false, message: `Cloudinary алдаа: ${e.message || 'upload'} ` });
      }
    }

    // Cloudinary disabled or not allowed: only use local if explicitly enabled
    if (!ALLOW_LOCAL_UPLOADS) {
      try { fs.unlinkSync(req.file.path); } catch {}
      console.log('⛔ Local upload disabled. Set ALLOW_LOCAL_UPLOADS=true if you want local fallback.');
      return res.status(500).json({ success: false, message: 'Cloudinary идэвхгүй эсвэл амжилтгүй. Local upload идэвхгүй.' });
    }

    console.log('⚠️ Cloudinary disabled, using local file');
    const absoluteUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ success: true, url: absoluteUrl, cloudinary: false });
  } catch (err) {
    res.status(500).json({ success: false, message: `Видео илгээхэд алдаа: ${err.message || ''}` });
  }
});

// API: S3 presigned PUT URL авах (илүү найдвартай хадгалалт)
app.post('/api/upload/video/presign', async (req, res) => {
  if (!CLOUDINARY_ENABLED) {
    return res.status(400).json({ success: false, message: 'Cloudinary идэвхгүй байна' });
  }
  try {
    const { filename, contentType } = req.body || {};
    if (!filename) {
      return res.status(400).json({ success: false, message: 'filename шаардлагатай' });
    }
    // Return Cloudinary upload widget config instead of presigned URL
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `videos/${Date.now()}-${String(filename).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    
    res.json({ 
      success: true, 
      cloudinary: true,
      cloudName: cloudinary.config().cloud_name,
      publicId
    });
  } catch (e) {
    console.log('Cloudinary presign error:', e.message);
    return res.status(500).json({ success: false, message: 'Upload алдаа' });
  }
});

// Feature flags / Environment-based config
const GPT5_ENABLED = String(process.env.GPT5_ENABLED ?? 'true').toLowerCase() === 'true';
const CLOUDINARY_ENABLED = String(process.env.CLOUDINARY_ENABLED ?? 'true').toLowerCase() === 'true';
const ALLOW_LOCAL_UPLOADS = String(process.env.ALLOW_LOCAL_UPLOADS ?? 'false').toLowerCase() === 'true';

const cloudinaryName = process.env.CLOUDINARY_NAME;
const cloudinaryKey = process.env.CLOUDINARY_API_KEY;
const cloudinarySecret = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_READY = CLOUDINARY_ENABLED && cloudinaryName && cloudinaryKey && cloudinarySecret;

// Cloudinary config
if (CLOUDINARY_READY) {
  cloudinary.config({
    cloud_name: cloudinaryName,
    api_key: cloudinaryKey,
    api_secret: cloudinarySecret
  });
  console.log('✅ Cloudinary сонгогдлоо');
} else {
  console.log('⚠️ Cloudinary тохиргоо дутуу. CLOUDINARY_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET шалгана уу.');
}

// Public config endpoint for clients
app.get('/api/config', (req, res) => {
  res.json({ gpt5Enabled: GPT5_ENABLED, cloudinaryEnabled: CLOUDINARY_READY });
});

// Health check endpoint - keep-alive-д ашиглана
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Админ наамтарт (environment variable-аас авна)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || '99752020$Myesu'
};
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token-12345';

// Simple admin auth middleware (Bearer <token>)
const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (auth === `Bearer ${ADMIN_TOKEN}`) return next();
  return res.status(401).json({ success: false, message: 'Admin auth required' });
};

// Загварууд
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

const OrderSchema = new mongoose.Schema({
  customerName: String,
  address: String,
  phone: String,
  notes: String,
  products: [{
    _id: String,
    name: String,
    description: String,
    price: Number,
    quantity: Number
  }],
  totalPrice: Number,
  subtotal: Number,
  promoCode: String,
  discountAmount: { type: Number, default: 0 },
  orderDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Шинэ захиалга' },
  videoUrl: String
});

const Order = mongoose.model('Order', OrderSchema);

// In-memory cache for products to survive intermittent DB timeouts
let productsCache = { items: [], ts: 0 };
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

const InventoryLogSchema = new mongoose.Schema({
  productCode: String,
  productName: String,
  importDate: Date,
  costPrice: Number,
  salePrice: Number,
  quantity: Number,
  cargoPrice: { type: Number, default: 0 },
  inspectionCost: { type: Number, default: 0 },
  otherCost: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const InventoryLog = mongoose.model('InventoryLog', InventoryLogSchema);

// Купон / урамшууллын код
const PromoCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
  amount: Number,
  active: { type: Boolean, default: true },
  usageLimit: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const PromoCode = mongoose.model('PromoCode', PromoCodeSchema);

// Заавар бичлэгийн загвар
const TutorialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Tutorial = mongoose.model('Tutorial', TutorialSchema);

// Mock өгөгдөл
const mockProducts = [
  {
    _id: '1',
    name: 'Хүүхдийн нөөрдөг',
    description: 'Дулаан, тав тухтай нөөрдөг',
    price: 25000,
    category: 'baby',
    image: 'https://via.placeholder.com/200?text=Baby+Blanket',
    stock: 15,
    orderIndex: 1
  },
  {
    _id: '2',
    name: 'Эхийн өд өмсөлт',
    description: 'Удаан хугацаанд өмсөх боломжтой',
    price: 45000,
    category: 'moms',
    image: 'https://via.placeholder.com/200?text=Mom+Wear',
    stock: 8,
    orderIndex: 2
  },
  {
    _id: '3',
    name: 'Хүүхдийн идэвхтэй тоглоом',
    description: 'Сөнсөн гэмтэл үүсгэхгүй тоглоом',
    price: 35000,
    category: 'baby',
    image: 'https://via.placeholder.com/200?text=Toy',
    stock: 12,
    orderIndex: 3
  },
  {
    _id: '4',
    name: 'Хүүхдийн сав',
    description: 'Нэг дарц нээх сав',
    price: 18000,
    category: 'baby',
    image: 'https://via.placeholder.com/200?text=Baby+Bottle',
    stock: 20,
    orderIndex: 4
  },
  {
    _id: '5',
    name: 'Эхийн эргүүлэлт сав',
    description: 'Дулаан ус сайн хадгалдаг',
    price: 22000,
    category: 'moms',
    image: 'https://via.placeholder.com/200?text=Water+Bottle',
    stock: 10,
    orderIndex: 5
  },
  {
    _id: '6',
    name: 'Хүүхдийн өмсөлт сонголт',
    description: '100% байгалийн материал',
    price: 32000,
    category: 'baby',
    image: 'https://via.placeholder.com/200?text=Baby+Clothes',
    stock: 18,
    orderIndex: 6
  }
];

let isMongoConnected = false;
let inventoryLogs = [];

// Хэрэглэгчийн захиалгууд (mock)
let orders = [
  {
    _id: '1',
    customerName: 'Баттүүгийн Төмөр',
    address: 'Улаанбаатар хот, Сүхбаатар дүүрэг',
    phone: '99111159',
    notes: '',
    videoUrl: '',
    products: [
      { _id: '1', name: 'Хүүхдийн нөөрдөг', price: 25000, quantity: 1, description: 'Дулаан, тав тухтай нөөрдөг' }
    ],
    totalPrice: 25000,
    orderDate: new Date(),
    status: 'Шинэ захиалга'
  }
];

// Заавар бичлэгүүд (mock fallback)
let tutorialMocks = [
  // { _id: 't1', title: 'Жишээ заавар', description: 'Хүргэлтийн заавар', videoUrl: 'https://example.com/video.mp4', createdAt: new Date() }
];

let promoMocks = [
  { _id: 'p1', code: 'WELCOME10', type: 'percent', amount: 10, active: true, usageLimit: 0, usedCount: 0 },
  { _id: 'p2', code: '5000OFF', type: 'flat', amount: 5000, active: true, usageLimit: 100, usedCount: 0 }
];

// Debug endpoint - database шалгах
app.get('/api/debug/db', async (req, res) => {
  try {
    const count = await Product.countDocuments();
    const products = await Product.find({}).limit(5);
    res.json({
      mongoConnected: isMongoConnected,
      totalProducts: count,
      sampleProducts: products,
      dbName: mongoose.connection.name,
      dbHost: mongoose.connection.host
    });
  } catch (err) {
    res.status(500).json({ error: err.message, mongoConnected: isMongoConnected });
  }
});

// API: Хүүхдийн болон төрсөн эхийн барааны жагсаалт
app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  // Parse lowStock more carefully to avoid 0 or invalid values
  const lowStockThreshold = (req.query.lowStock && req.query.lowStock !== '') 
    ? Number(req.query.lowStock) 
    : undefined;
  
  console.log('🔍 GET /api/products - MongoDB холболт:', isMongoConnected);
  
  // Build filter outside try/catch so it is available for retry
  let filter = {};
  if (category) filter.category = category;
  // Only add stock filter if it's a positive number
  if (lowStockThreshold !== undefined && !isNaN(lowStockThreshold) && lowStockThreshold > 0) {
    filter.stock = { $lt: lowStockThreshold };
  }
  
  if (isMongoConnected) {
    try {
      console.log('📊 Query filter:', JSON.stringify(filter));
      
      // Optimized query: lean docs + projection + maxTimeMS
      const query = Product
        .find(filter)
        .select('name description price category image images stock orderIndex')
        .sort({ orderIndex: 1, name: 1 })
        .lean()
        .maxTimeMS(30000); // 30s for slow Render↔Atlas connection

      // Set a hard timeout guard as well (node-side)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 30s')), 30000)
      );
      
      const products = await Promise.race([query.exec(), timeoutPromise]);
      console.log('✅ MongoDB-с бараа олсон:', products.length);
      productsCache = { items: products, ts: Date.now() };
      
      return res.json(products);
    } catch (err) {
      console.log('⚠️ MongoDB query алдаа:', err.message);
      // One quick retry without node-side Promise.race guard
      try {
        const products2 = await Product
          .find(filter)
          .select('name description price category image images stock orderIndex')
          .sort({ orderIndex: 1, name: 1 })
          .lean()
          .maxTimeMS(45000) // allow even longer on retry
          .exec();
        console.log('🔁 Retry success, items:', products2.length);
        productsCache = { items: products2, ts: Date.now() };
        return res.json(products2);
      } catch (e2) {
        console.log('❌ Retry failed:', e2.message);
      }
      // If we have recent cache, serve it
      if (productsCache.items && productsCache.items.length > 0) {
        const age = Date.now() - productsCache.ts;
        console.log(`🧠 Cache ашиглав (age ${age}ms, ttl ${CACHE_TTL_MS}ms)`);
        return res.json(productsCache.items);
      }
      console.log('⛔ DB алдаа ба cache хоосон - хоосон жагсаалт буцаалаа');
      return res.json([]);
    }
  }
  
  // MongoDB холбогдоогүй: cache байвал буцаана, эс бөгөөс хоосон
  if (productsCache.items && productsCache.items.length > 0) {
    const age = Date.now() - productsCache.ts;
    console.log(`🧠 Cache (no DB) ашиглав (age ${age}ms)`);
    return res.json(productsCache.items);
  }
  console.log('⛔ DB холбогдоогүй ба cache хоосон - хоосон жагсаалт');
  return res.json([]);
});

// API: Шинэ бараа нэмэх (админ)
app.post('/api/products', async (req, res) => {
  const payload = { ...req.body };
  if (!payload.orderIndex) {
    const maxIndex = mockProducts.reduce((m,p)=>Math.max(m, p.orderIndex||0), 0) + 1;
    payload.orderIndex = maxIndex;
  }
  if (isMongoConnected) {
    try {
      const product = new Product(payload);
      await product.save();
      return res.json(product);
    } catch (err) {
      console.log('MongoDB асалтын алдаа:', err.message);
    }
  }
  
  // Mock хариу
  const newProduct = { _id: Date.now().toString(), ...payload };
  mockProducts.push(newProduct);
  res.json(newProduct);
});

// API: Бараа устгах
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  
  if (isMongoConnected) {
    try {
      await Product.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Бараа устгагдлаа' });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  
  // Mock өгөгдлөөс устгах
  const index = mockProducts.findIndex(p => p._id === id);
  if (index > -1) {
    mockProducts.splice(index, 1);
    return res.json({ success: true, message: 'Бараа устгагдлаа' });
  }
  
  res.status(404).json({ success: false, message: 'Бараа олдсонгүй' });
});

// API: Бараа засах
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  if (isMongoConnected) {
    try {
      const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });
      return res.json(updated);
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  
  // Mock өгөгдлөө засах
  const product = mockProducts.find(p => p._id === id);
  if (product) {
    Object.assign(product, updateData);
    return res.json(product);
  }
  
  res.status(404).json({ success: false, message: 'Бараа олдсонгүй' });
});

// API: Барааны дараалал шинэчлэх (drag & drop)
app.post('/api/products/reorder', requireAdmin, async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ success: false, message: 'orderedIds шаардлагатай' });
  }

  if (isMongoConnected) {
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await Product.findByIdAndUpdate(orderedIds[i], { orderIndex: i + 1 });
      }
      return res.json({ success: true });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
      return res.status(500).json({ success: false, message: 'Алдаа гарлаа' });
    }
  }

  orderedIds.forEach((id, idx) => {
    const p = mockProducts.find(m => m._id === id);
    if (p) p.orderIndex = idx + 1;
  });
  res.json({ success: true });
});

// API: Бөөний үнийн өөрчлөлт (хувиар)
app.post('/api/products/bulk-price', requireAdmin, async (req, res) => {
  const { ids, percent } = req.body;
  if (!Array.isArray(ids) || typeof percent !== 'number') {
    return res.status(400).json({ success: false, message: 'ids ба percent шаардлагатай' });
  }
  const factor = 1 + percent / 100;

  if (isMongoConnected) {
    try {
      for (const id of ids) {
        const prod = await Product.findById(id);
        if (prod) {
          prod.price = Math.max(0, Math.round(prod.price * factor));
          await prod.save();
        }
      }
      return res.json({ success: true });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
      return res.status(500).json({ success: false, message: 'Алдаа гарлаа' });
    }
  }

  ids.forEach(id => {
    const prod = mockProducts.find(p => p._id === id);
    if (prod) {
      prod.price = Math.max(0, Math.round(prod.price * factor));
    }
  });
  res.json({ success: true });
});

// API: Админ нэвтрэх
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    res.json({ 
      success: true, 
      token: ADMIN_TOKEN,
      message: 'Амжилттай нэвтэрлээ'
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Нэвтрэх нэр эсвэл нууц үг буруу' 
    });
  }
});

// API: Захиалга үүсгэх
app.post('/api/orders', async (req, res) => {
  const { customerName, address, phone, notes, products, videoUrl, promoCode } = req.body;
  
  if (!customerName || !address || !phone || !products || products.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Бүх мэдээлэл нөхөөрэй' 
    });
  }

  // Дүн тооцоолол
  const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  const applyPromo = async (code, total) => {
    if (!code) return { discount: 0, promo: null };
    let promo = null;
    if (isMongoConnected) {
      promo = await PromoCode.findOne({ code, active: true });
    } else {
      promo = promoMocks.find(p => p.code === code && p.active);
    }
    if (!promo) return { discount: 0, promo: null };
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return { discount: 0, promo: null };
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return { discount: 0, promo: null };

    const discount = promo.type === 'flat'
      ? Math.min(total, promo.amount)
      : Math.min(total, Math.round((promo.amount / 100) * total));
    return { discount, promo };
  };

  let discountAmount = 0;
  let promoDoc = null;
  try {
    const resPromo = await applyPromo(promoCode, subtotal);
    discountAmount = resPromo.discount;
    promoDoc = resPromo.promo;
  } catch {}

  const orderData = {
    customerName,
    address,
    phone,
    notes,
    products,
    videoUrl: videoUrl || '',
    subtotal,
    discountAmount,
    promoCode: promoDoc ? promoCode : null,
    totalPrice: Math.max(0, subtotal - discountAmount),
    orderDate: new Date(),
    status: 'Шинэ захиалга'
  };

  if (isMongoConnected) {
    try {
      // Үлдэгдэл шалгах ба хасах
      for (const item of products) {
        const product = await Product.findById(item._id);
        if (!product) {
          return res.status(400).json({ 
            success: false, 
            message: `Бараа олдсонгүй: ${item.name}` 
          });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            success: false, 
            message: `Хангалтгүй үлдэгдэл: ${product.name} (Үлдсэн: ${product.stock}, Захиалга: ${item.quantity})` 
          });
        }
      }
      
      // Захиалга хадгалах
      const order = new Order(orderData);
      await order.save();
      if (promoDoc) {
        await PromoCode.findByIdAndUpdate(promoDoc._id, { $inc: { usedCount: 1 } });
      }
      
      // Үлдэгдэл хасах
      for (const item of products) {
        await Product.findByIdAndUpdate(
          item._id,
          { $inc: { stock: -item.quantity } }
        );
      }
      
      return res.json({ success: true, message: 'Захиалга хүлээн авлаа', order });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
      return res.status(500).json({ success: false, message: 'Алдаа гарлаа' });
    }
  }

  // Mock fallback
  const order = { _id: Date.now().toString(), ...orderData };
  orders.push(order);
  if (promoDoc) {
    promoDoc.usedCount = (promoDoc.usedCount || 0) + 1;
  }
  res.json({ success: true, message: 'Захиалга хүлээн авлаа', order });
});

// API: Бүх захиалгууд авах (админ)
app.get('/api/orders', requireAdmin, async (req, res) => {
  if (isMongoConnected) {
    try {
      const dbOrders = await Order.find().sort({ _id: -1 });
      return res.json(dbOrders);
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  
  res.json(orders);
});

// API: Orders CSV export (admin)
app.get('/api/orders/export/csv', requireAdmin, async (req, res) => {
  try {
    let exportOrders = orders;
    if (isMongoConnected) {
      exportOrders = await Order.find().sort({ _id: -1 });
    }

    const header = ['customerName','phone','address','notes','subtotal','discountAmount','promoCode','totalPrice','status','orderDate','products'];
    const rows = exportOrders.map(o => {
      const items = (o.products || []).map(p => `${p.name} x${p.quantity}`).join(' | ');
      return [
        escapeCsv(o.customerName),
        escapeCsv(o.phone),
        escapeCsv(o.address),
        escapeCsv(o.notes || ''),
        o.subtotal || o.totalPrice || 0,
        o.discountAmount || 0,
        escapeCsv(o.promoCode || ''),
        o.totalPrice || 0,
        escapeCsv(o.status || ''),
        new Date(o.orderDate || o._id).toISOString(),
        escapeCsv(items)
      ].join(',');
    });

    const csv = [header.join(','), ...rows].join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for proper character encoding in Excel
    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    return res.send(bom + csv);
  } catch (e) {
    console.log('CSV export error:', e.message);
    res.status(500).send('CSV export failed');
  }
});

// API: Захиалгын дэлгэрэнгүй
app.get('/api/orders/:id', requireAdmin, async (req, res) => {
  if (isMongoConnected) {
    try {
      const order = await Order.findById(req.params.id);
      if (order) {
        return res.json(order);
      }
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  
  const order = orders.find(o => o._id === req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ success: false, message: 'Захиалга олдсонгүй' });
  }
});

// Helper: escape CSV
const escapeCsv = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  if (s.search(/([",\n])/g) >= 0) {
    return '"' + s + '"';
  }
  return s;
};

// Stats helpers
const startOfToday = () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0,0,0,0);
  return d;
};

// API: Stats summary (admin)
app.get('/api/stats/summary', requireAdmin, async (req, res) => {
  try {
    const today = startOfToday();
    const seven = daysAgo(7);

    let todays = orders.filter(o => new Date(o.orderDate) >= today);
    let last7 = orders.filter(o => new Date(o.orderDate) >= seven);

    if (isMongoConnected) {
      todays = await Order.find({ orderDate: { $gte: today } });
      last7 = await Order.find({ orderDate: { $gte: seven } });
    }

    const sum = (arr) => arr.reduce((s,o)=>s+(o.totalPrice||0),0);

    return res.json({
      todayOrders: todays.length,
      todayAmount: sum(todays),
      last7Orders: last7.length,
      last7Amount: sum(last7)
    });
  } catch (e) {
    console.log('Stats error:', e.message);
    res.status(500).json({ success:false, message:'Stats error' });
  }
});

// API: Top products (admin)
app.get('/api/stats/top-products', requireAdmin, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const range = req.query.range || '7d';
    let since = daysAgo(7);
    if (range === '30d') since = daysAgo(30);
    if (range === 'today') since = startOfToday();

    let result = [];
    if (isMongoConnected) {
      result = await Order.aggregate([
        { $match: { orderDate: { $gte: since } } },
        { $unwind: '$products' },
        { $group: { _id: '$products._id', name: { $first: '$products.name' }, qty: { $sum: '$products.quantity' }, revenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } } } },
        { $sort: { qty: -1 } },
        { $limit: limit }
      ]);
    } else {
      const map = new Map();
      orders.filter(o => new Date(o.orderDate) >= since).forEach(o => {
        (o.products||[]).forEach(p => {
          const key = p._id || p.name;
          const cur = map.get(key) || { _id: key, name: p.name, qty:0, revenue:0 };
          cur.qty += p.quantity;
          cur.revenue += (p.quantity * p.price);
          map.set(key, cur);
        });
      });
      result = Array.from(map.values()).sort((a,b)=>b.qty-a.qty).slice(0, limit);
    }

    res.json(result);
  } catch (e) {
    console.log('Top products error:', e.message);
    res.status(500).json({ success:false, message:'Top products error' });
  }
});

// API: Захиалга устгах (админ)
app.delete('/api/orders/:id', requireAdmin, async (req, res) => {
  if (isMongoConnected) {
    try {
      const result = await Order.findByIdAndDelete(req.params.id);
      if (result) {
        return res.json({ success: true, message: 'Захиалга устгагдлаа' });
      }
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  
  const index = orders.findIndex(o => o._id === req.params.id);
  if (index !== -1) {
    orders.splice(index, 1);
    res.json({ success: true, message: 'Захиалга устгагдлаа' });
  } else {
    res.status(404).json({ success: false, message: 'Захиалга олдсонгүй' });
  }
});

// API: Захиалгын статус шинэчлэх (админ)
app.patch('/api/orders/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  
  if (isMongoConnected) {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Захиалга олдсонгүй' });
      }

      const prevStatus = order.status;

      // Цуцалсан үед үлдэгдэл буцааж нэмэх (нэг удаа)
      if (status === 'Цуцалсан' && prevStatus !== 'Цуцалсан') {
        for (const item of order.products) {
          await Product.findByIdAndUpdate(
            item._id,
            { $inc: { stock: item.quantity } }
          );
        }
      }

      // Цуцалсан байснаас буцааж (Хүлээгдэж / Хүргэгдсэн) болгоход үлдэгдэл дахин хасах
      if (prevStatus === 'Цуцалсан' && status !== 'Цуцалсан') {
        // Эхлээд хүрэлцээтэй эсэхийг шалгана
        for (const item of order.products) {
          const product = await Product.findById(item._id);
          if (!product) {
            return res.status(400).json({ success: false, message: `Бараа олдсонгүй: ${item.name}` });
          }
          if (product.stock < item.quantity) {
            return res.status(400).json({ success: false, message: `Хангалтгүй үлдэгдэл: ${product.name} (Үлдсэн: ${product.stock}, Шаардлагатай: ${item.quantity})` });
          }
        }
        // Хүрэлцээтэй бол дахин хасна
        for (const item of order.products) {
          await Product.findByIdAndUpdate(
            item._id,
            { $inc: { stock: -item.quantity } }
          );
        }
      }

      order.status = status;
      await order.save();
      return res.json({ success: true, message: 'Статус шинэчлэгдлээ', order });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
      return res.status(500).json({ success: false, message: 'Алдаа гарлаа' });
    }
  }
  
  // Mock fallback
  const order = orders.find(o => o._id === req.params.id);
  if (order) {
    const prevStatus = order.status;

    if (status === 'Цуцалсан' && prevStatus !== 'Цуцалсан') {
      order.products.forEach(item => {
        const product = mockProducts.find(p => p._id === item._id);
        if (product) {
          product.stock = (product.stock || 0) + (item.quantity || 0);
        }
      });
    }

    if (prevStatus === 'Цуцалсан' && status !== 'Цуцалсан') {
      // Check stock
      for (const item of order.products) {
        const product = mockProducts.find(p => p._id === item._id);
        if (!product) {
          return res.status(400).json({ success: false, message: `Бараа олдсонгүй: ${item.name}` });
        }
        if ((product.stock || 0) < (item.quantity || 0)) {
          return res.status(400).json({ success: false, message: `Хангалтгүй үлдэгдэл: ${product.name}` });
        }
      }
      // Deduct
      order.products.forEach(item => {
        const product = mockProducts.find(p => p._id === item._id);
        if (product) {
          product.stock = (product.stock || 0) - (item.quantity || 0);
        }
      });
    }

    order.status = status;
    return res.json({ success: true, message: 'Статус шинэчлэгдлээ', order });
  }

  res.status(404).json({ success: false, message: 'Захиалга олдсонгүй' });
});

// API: Бараа бүртгэл үүсгэх (админ)
app.post('/api/inventory-logs', async (req, res) => {
  const { productCode, productName, importDate, costPrice, salePrice, quantity, cargoPrice, inspectionCost, otherCost } = req.body;
  
  if (!productCode || !productName || !costPrice || !salePrice || !quantity) {
    return res.status(400).json({ 
      success: false, 
      message: 'Бүх мэдээлэл нөхөөрэй' 
    });
  }

  const logData = {
    productCode,
    productName,
    importDate: new Date(importDate),
    costPrice: parseFloat(costPrice),
    salePrice: parseFloat(salePrice),
    quantity: parseInt(quantity),
    cargoPrice: parseFloat(cargoPrice) || 0,
    inspectionCost: parseFloat(inspectionCost) || 0,
    otherCost: parseFloat(otherCost) || 0,
    createdAt: new Date()
  };

  if (isMongoConnected) {
    try {
      const log = new InventoryLog(logData);
      await log.save();
      return res.json({ success: true, message: 'Бараа бүртгэгдлээ', log });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
      return res.status(500).json({ success: false, message: 'Алдаа гарлаа' });
    }
  }

  // Mock fallback
  const log = { _id: Date.now().toString(), ...logData };
  inventoryLogs.push(log);
  res.json({ success: true, message: 'Бараа бүртгэгдлээ', log });
});

// API: Бүх бараа бүртгэлүүдийг авах (админ)
app.get('/api/inventory-logs', async (req, res) => {
  if (isMongoConnected) {
    try {
      const logs = await InventoryLog.find().sort({ createdAt: -1 });
      return res.json(logs);
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  
  res.json(inventoryLogs);
});

// API: Бараа бүртгэлийг Excel болгон татаж авах
app.get('/api/inventory-logs/export/csv', async (req, res) => {
  let logs = [];
  
  if (isMongoConnected) {
    try {
      logs = await InventoryLog.find().sort({ createdAt: -1 });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
      logs = inventoryLogs;
    }
  } else {
    logs = inventoryLogs;
  }

  // CSV формат үүсгэх
  const headers = ['Барааны код', 'Барааны нэр', 'Монголд ирсэн огноо', 'Үндсэн үнэ', 'Зарах үнэ', 'Ширхэг', 'Карго үнэ', 'Баталтын зардал', 'Бусад зардал', 'Нийт зардал', 'Нийт орлого', 'Нийт ашиг', 'Бүртгэлийн огноо'];
  const csvRows = logs.map(log => {
    const cargoPrice = log.cargoPrice || 0;
    const inspectionCost = log.inspectionCost || 0;
    const otherCost = log.otherCost || 0;
    const totalCost = (log.costPrice * log.quantity) + cargoPrice + inspectionCost + otherCost;
    const totalRevenue = log.salePrice * log.quantity;
    const totalProfit = totalRevenue - totalCost;
    
    return [
      log.productCode,
      log.productName,
      new Date(log.importDate).toLocaleDateString('mn-MN'),
      log.costPrice,
      log.salePrice,
      log.quantity,
      cargoPrice,
      inspectionCost,
      otherCost,
      totalCost,
      totalRevenue,
      totalProfit,
      new Date(log.createdAt).toLocaleString('mn-MN')
    ];
  });

  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=baraanyg-burtgel-' + new Date().toISOString().split('T')[0] + '.csv');
  res.send('\ufeff' + csvContent); // BOM for Excel UTF-8
});

// API: Бараа бүртгэл устгах (админ)
app.delete('/api/inventory-logs/:id', async (req, res) => {
  if (isMongoConnected) {
    try {
      const result = await InventoryLog.findByIdAndDelete(req.params.id);
      if (result) {
        return res.json({ success: true, message: 'Бүртгэл устгагдлаа' });
      }
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  
  const index = inventoryLogs.findIndex(log => log._id === req.params.id);
  if (index !== -1) {
    inventoryLogs.splice(index, 1);
    res.json({ success: true, message: 'Бүртгэл устгагдлаа' });
  } else {
    res.status(404).json({ success: false, message: 'Бүртгэл олдсонгүй' });
  }
});

// API: Бараа бүртгэл засах (админ)
app.put('/api/inventory-logs/:id', async (req, res) => {
  const { productCode, productName, importDate, costPrice, salePrice, quantity, cargoPrice, inspectionCost, otherCost } = req.body;
  
  const updateData = {
    productCode,
    productName,
    importDate: new Date(importDate),
    costPrice: parseFloat(costPrice),
    salePrice: parseFloat(salePrice),
    quantity: parseInt(quantity),
    cargoPrice: parseFloat(cargoPrice) || 0,
    inspectionCost: parseFloat(inspectionCost) || 0,
    otherCost: parseFloat(otherCost) || 0
  };

  if (isMongoConnected) {
    try {
      const updated = await InventoryLog.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (updated) {
        return res.json({ success: true, message: 'Бүртгэл шинэчлэгдлээ', log: updated });
      }
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
      return res.status(500).json({ success: false, message: 'Алдаа гарлаа' });
    }
  }

  // Mock fallback
  const index = inventoryLogs.findIndex(log => log._id === req.params.id);
  if (index !== -1) {
    inventoryLogs[index] = { ...inventoryLogs[index], ...updateData };
    return res.json({ success: true, message: 'Бүртгэл шинэчлэгдлээ', log: inventoryLogs[index] });
  }

  res.status(404).json({ success: false, message: 'Бүртгэл олдсонгүй' });
});

// MongoDB-д холболт оролдох (MONGODB_URI байхгүй бол mock-оор үргэлжилнэ)
const MONGODB_URI = process.env.MONGODB_URI;
console.log('🔍 MONGODB_URI тохируулагдсан:', !!MONGODB_URI);
if (MONGODB_URI) {
  console.log('📝 URI эхэлэл:', MONGODB_URI.substring(0, 50) + '...');
}

if (!MONGODB_URI) {
  console.log('⚠️ MongoDB URI тохируулаагүй. Mock өгөгдөл ашиглаж байна.');
} else {
  mongoose
    .connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increased for Render free tier
      socketTimeoutMS: 75000,
      maxPoolSize: 5, // Reduced to avoid connection overload
      minPoolSize: 1,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
    })
    .then(() => {
      isMongoConnected = true;
      console.log('✅ MongoDB холбогдлоо!');
      console.log('📊 Connected to:', mongoose.connection.name, '@', mongoose.connection.host);
      // Warm-up products cache to avoid mock fallback and cold starts
      try {
        Product.find({})
          .select('name description price category image stock orderIndex')
          .sort({ orderIndex: 1, name: 1 })
          .lean()
          .limit(200)
          .then(items => {
            productsCache = { items, ts: Date.now() };
            console.log('🧠 Warmed products cache:', items.length);
          })
          .catch(e => console.log('⚠️ Warm-up query алдаа:', e.message));
      } catch (e) {
        console.log('⚠️ Warm-up гүйцэтгэхэд алдаа:', e.message);
      }
    })
    .catch((err) => {
      console.log('⚠️ MongoDB холбогдоогүй. Mock өгөгдөл ашиглаж байна.');
      console.log('❌ Алдаа:', err.message);
      console.log('🔗 Attempt URI:', MONGODB_URI.substring(0, 50) + '...');
    });
}

// Сервер асаах
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Сервер ${PORT} портоор асав`);
  console.log(`👨‍💼 Админ нэвтрэх: username=${ADMIN_CREDENTIALS.username}`);
  console.log('💡 Хурд нэмэгдүүлэх заавар: https://cron-job.org дээр 14 минут тутамд /api/health руу GET request үүсгэ');
});

// API: Заавар бичлэгүүд
// Бүх заавар бичлэгүүд авах (public)
app.get('/api/tutorials', async (req, res) => {
  if (isMongoConnected) {
    try {
      const items = await Tutorial.find().sort({ createdAt: -1 });
      return res.json(items);
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  res.json(tutorialMocks.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Шинэ заавар бичлэг нэмэх (админ UI-с дуудагдана)
app.post('/api/tutorials', async (req, res) => {
  const { title, description, videoUrl } = req.body;
  if (!title || !videoUrl) {
    return res.status(400).json({ success: false, message: 'Гарчиг ба видео холбоос шаардлагатай' });
  }
  if (isMongoConnected) {
    try {
      const doc = new Tutorial({ title, description, videoUrl });
      await doc.save();
      return res.json({ success: true, tutorial: doc });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
      return res.status(500).json({ success: false, message: 'Алдаа гарлаа' });
    }
  }
  const mock = { _id: Date.now().toString(), title, description: description || '', videoUrl, createdAt: new Date() };
  tutorialMocks.push(mock);
  res.json({ success: true, tutorial: mock });
});

// Заавар бичлэг устгах
app.delete('/api/tutorials/:id', async (req, res) => {
  if (isMongoConnected) {
    try {
      const result = await Tutorial.findByIdAndDelete(req.params.id);
      if (result) return res.json({ success: true });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  const idx = tutorialMocks.findIndex(t => t._id === req.params.id);
  if (idx !== -1) {
    tutorialMocks.splice(idx, 1);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: 'Олдсонгүй' });
});

// API: Купон/Урамшуулал (admin)
app.get('/api/promocodes', requireAdmin, async (req, res) => {
  if (isMongoConnected) {
    try {
      const items = await PromoCode.find().sort({ createdAt: -1 });
      return res.json(items);
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  res.json(promoMocks.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)));
});

app.post('/api/promocodes', requireAdmin, async (req, res) => {
  const { code, type, amount, usageLimit, expiresAt, active } = req.body;
  if (!code || !amount) {
    return res.status(400).json({ success: false, message: 'Код болон дүн заавал' });
  }

  if (isMongoConnected) {
    try {
      const doc = new PromoCode({
        code: code.trim().toUpperCase(),
        type: type || 'percent',
        amount: Number(amount),
        usageLimit: Number(usageLimit) || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active !== false
      });
      await doc.save();
      return res.json({ success: true, promo: doc });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
      return res.status(500).json({ success: false, message: 'Алдаа гарлаа' });
    }
  }

  const exists = promoMocks.find(p => p.code === code.trim().toUpperCase());
  if (exists) return res.status(400).json({ success: false, message: 'Код давхцаж байна' });
  const mock = {
    _id: Date.now().toString(),
    code: code.trim().toUpperCase(),
    type: type || 'percent',
    amount: Number(amount),
    usageLimit: Number(usageLimit) || 0,
    usedCount: 0,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    active: active !== false,
    createdAt: new Date()
  };
  promoMocks.push(mock);
  res.json({ success: true, promo: mock });
});

app.delete('/api/promocodes/:id', requireAdmin, async (req, res) => {
  if (isMongoConnected) {
    try {
      const deleted = await PromoCode.findByIdAndDelete(req.params.id);
      if (deleted) return res.json({ success: true });
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
      return res.status(500).json({ success: false, message: 'Алдаа гарлаа' });
    }
  }
  const idx = promoMocks.findIndex(p => p._id === req.params.id);
  if (idx !== -1) {
    promoMocks.splice(idx, 1);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: 'Код олдсонгүй' });
});

// API: Купон шалгах (public)
app.post('/api/promocodes/validate', async (req, res) => {
  const { code, total } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Код оруулна уу' });

  const findPromo = async () => {
    if (isMongoConnected) {
      return PromoCode.findOne({ code: code.trim().toUpperCase(), active: true });
    }
    return promoMocks.find(p => p.code === code.trim().toUpperCase() && p.active);
  };

  try {
    const promo = await findPromo();
    if (!promo) return res.status(404).json({ success: false, message: 'Код олдсонгүй эсвэл идэвхгүй' });
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return res.status(400).json({ success: false, message: 'Кодын хугацаа дууссан' });
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return res.status(400).json({ success: false, message: 'Кодын хэрэглээ дүүрсэн' });

    const subtotal = Number(total) || 0;
    const discount = promo.type === 'flat'
      ? Math.min(subtotal, promo.amount)
      : Math.min(subtotal, Math.round((promo.amount / 100) * subtotal));
    return res.json({ success: true, discount, type: promo.type, amount: promo.amount, code: promo.code });
  } catch (err) {
    console.log('Promo validate error:', err.message);
    res.status(500).json({ success: false, message: 'Алдаа гарлаа' });
  }
});