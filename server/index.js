const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Админ наамтарт
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: '99752020'
};

// Загварууд
const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  images: [String],
  stock: { type: Number, default: 0 }
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
  orderDate: String,
  status: { type: String, default: 'Шинэ захиалга' }
});

const Order = mongoose.model('Order', OrderSchema);

// Mock өгөгдөл
const mockProducts = [
  {
    _id: '1',
    name: 'Хүүхдийн нөөрдөг',
    description: 'Дулаан, тав тухтай нөөрдөг',
    price: 25000,
    category: 'baby',
    image: 'https://via.placeholder.com/200?text=Baby+Blanket',
    stock: 15
  },
  {
    _id: '2',
    name: 'Эхийн өд өмсөлт',
    description: 'Удаан хугацаанд өмсөх боломжтой',
    price: 45000,
    category: 'moms',
    image: 'https://via.placeholder.com/200?text=Mom+Wear',
    stock: 8
  },
  {
    _id: '3',
    name: 'Хүүхдийн идэвхтэй тоглоом',
    description: 'Сөнсөн гэмтэл үүсгэхгүй тоглоом',
    price: 35000,
    category: 'baby',
    image: 'https://via.placeholder.com/200?text=Toy',
    stock: 12
  },
  {
    _id: '4',
    name: 'Хүүхдийн сав',
    description: 'Нэг дарц нээх сав',
    price: 18000,
    category: 'baby',
    image: 'https://via.placeholder.com/200?text=Baby+Bottle',
    stock: 20
  },
  {
    _id: '5',
    name: 'Эхийн эргүүлэлт сав',
    description: 'Дулаан ус сайн хадгалдаг',
    price: 22000,
    category: 'moms',
    image: 'https://via.placeholder.com/200?text=Water+Bottle',
    stock: 10
  },
  {
    _id: '6',
    name: 'Хүүхдийн өмсөлт сонголт',
    description: '100% байгалийн материал',
    price: 32000,
    category: 'baby',
    image: 'https://via.placeholder.com/200?text=Baby+Clothes',
    stock: 18
  }
];

let isMongoConnected = false;

// Хэрэглэгчийн захиалгууд (mock)
let orders = [
  {
    _id: '1',
    customerName: 'Баттүүгийн Төмөр',
    address: 'Улаанбаатар хот, Сүхбаатар дүүрэг',
    phone: '99111159',
    notes: '',
    products: [
      { _id: '1', name: 'Хүүхдийн нөөрдөг', price: 25000, quantity: 1, description: 'Дулаан, тав тухтай нөөрдөг' }
    ],
    totalPrice: 25000,
    orderDate: new Date().toLocaleString('mn-MN'),
    status: 'Шинэ захиалга'
  }
];

// API: Хүүхдийн болон төрсөн эхийн барааны жагсаалт
app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  
  if (isMongoConnected) {
    try {
      let filter = {};
      if (category) filter.category = category;
      const products = await Product.find(filter);
      return res.json(products);
    } catch (err) {
      console.log('MongoDB асалтын алдаа:', err.message);
    }
  }
  
  // Mock өгөгдөл буцаах
  let products = mockProducts;
  if (category) {
    products = products.filter(p => p.category === category);
  }
  res.json(products);
});

// API: Шинэ бараа нэмэх (админ)
app.post('/api/products', async (req, res) => {
  if (isMongoConnected) {
    try {
      const product = new Product(req.body);
      await product.save();
      return res.json(product);
    } catch (err) {
      console.log('MongoDB асалтын алдаа:', err.message);
    }
  }
  
  // Mock хариу
  const newProduct = { _id: Date.now().toString(), ...req.body };
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

// API: Админ нэвтрэх
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    res.json({ 
      success: true, 
      token: 'admin-token-12345',
      message: 'Амжилттай нэвтэрлээ'
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Нэтэвтэх нэр эсвэл нууц үг буруу' 
    });
  }
});

// API: Захиалга үүсгэх
app.post('/api/orders', async (req, res) => {
  const { customerName, address, phone, notes, products } = req.body;
  
  if (!customerName || !address || !phone || !products || products.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Бүх мэдээлэл нөхөөрэй' 
    });
  }

  const orderData = {
    customerName,
    address,
    phone,
    notes,
    products,
    totalPrice: products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
    orderDate: new Date().toLocaleString('mn-MN'),
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
  res.json({ success: true, message: 'Захиалга хүлээн авлаа', order });
});

// API: Бүх захиалгууд авах (админ)
app.get('/api/orders', async (req, res) => {
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

// API: Захиалгын дэлгэрэнгүй
app.get('/api/orders/:id', async (req, res) => {
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

// API: Захиалга устгах (админ)
app.delete('/api/orders/:id', async (req, res) => {
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
app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  
  if (isMongoConnected) {
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (order) {
        return res.json({ success: true, message: 'Статус шинэчлэгдлээ', order });
      }
    } catch (err) {
      console.log('MongoDB алдаа:', err.message);
    }
  }
  
  const order = orders.find(o => o._id === req.params.id);
  if (order) {
    order.status = status;
    res.json({ success: true, message: 'Статус шинэчлэгдлээ', order });
  } else {
    res.status(404).json({ success: false, message: 'Захиалга олдсонгүй' });
  }
});

// MongoDB-д холболт оролдох
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/babyshop';
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    isMongoConnected = true;
    console.log('✅ MongoDB холбогдлоо!');
  })
  .catch((err) => {
    console.log('⚠️ MongoDB холбогдоогүй. Mock өгөгдөл ашиглаж байна.');
    console.log('Алдаа:', err.message);
  });

// Сервер асаах
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер ${PORT} портоор асав`);
  console.log('👨‍💼 Админ нэтэвтрэх: username=admin, password=99752020');
});