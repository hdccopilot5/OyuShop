    # 🛍️ Oyu Online Shop

Modern e-commerce platform for baby products built with MERN stack.

## 🚀 Features

- ⚛️ **React Frontend** - Modern UI with React 18
- 🔥 **Node.js Backend** - Express REST API
- 💾 **MongoDB Database** - Product & Order management
- 👨‍💼 **Admin Panel** - Product management, order tracking
- 🛒 **Shopping Cart** - Add to cart, checkout
- 📦 **Order Management** - Status tracking (Pending, Delivered, Cancelled)
- 🖼️ **Multi-image Support** - Product galleries with color variants

## 📋 Prerequisites

- Node.js 14+ 
- MongoDB 4+
- npm or yarn

## 🔧 Installation

### 1. Clone Repository
```bash
git clone https://github.com/hdccopilot5/OyuShop.git
cd OyuShop
```

### 2. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 3. Environment Setup

Create `.env` file in server directory:
```env
MONGODB_URI=mongodb://localhost:27017/babyshop
PORT=5000
```

### 4. Start MongoDB

```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### 5. Run Application

**Start Server:**
```bash
cd server
npm start
```

**Start Client:**
```bash
cd client
npm start
```

## 🌐 Deployment

### Render.com (Recommended)

#### Backend Deployment:
1. Go to [Render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Settings:
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Environment Variables:**
     - `MONGODB_URI` - Your MongoDB Atlas connection string
     - `PORT` - 5000

#### Frontend Deployment:
1. New → Static Site
2. Settings:
   - **Build Command:** `cd client && npm install && npm run build`
   - **Publish Directory:** `client/build`
   - Update API URL in client code to backend URL

### MongoDB Atlas (Database)
1. Create free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Get connection string
3. Add to Render environment variables

## 👨‍💼 Admin Access

- **URL:** http://localhost:3000/admin
- **Username:** admin
- **Password:** 99752020

## 📡 API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders (admin)
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Auth
- `POST /api/admin/login` - Admin login

## 🗄️ Database Schema

### Product
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String, // 'baby' or 'moms'
  image: String, // Base64
  images: [String], // Array of Base64
  stock: Number
}
```

### Order
```javascript
{
  customerName: String,
  address: String,
  phone: String,
  notes: String,
  products: [{ _id, name, price, quantity }],
  totalPrice: Number,
  orderDate: String,
  status: String // 'Хүлээгдэж байгаа', 'Хүргэгдсэн', 'Цуцалсан'
}
```

## 🛠️ Tech Stack

- **Frontend:** React 18, React Router v7
- **Backend:** Node.js, Express 4
- **Database:** MongoDB, Mongoose
- **Styling:** Custom CSS

## 📦 Project Structure

```
onlineshop/
├── client/                # React frontend
│   ├── src/
│   │   ├── app.js        # Main shop page
│   │   ├── AdminLogin.js # Admin login
│   │   ├── AdminPanel.js # Product management
│   │   ├── OrdersView.js # Order management
│   │   └── UserCheckout.js # Checkout page
│   └── package.json
├── server/               # Node.js backend
│   ├── index.js         # Express server + API
│   └── package.json
└── README.md
```

## 📸 Screenshots

- Shop page with product gallery
- Admin panel with product CRUD
- Order management with status tracking

## 🔒 Security Notes

⚠️ **For Production:**
- Change admin credentials
- Use JWT authentication
- Add rate limiting
- Enable HTTPS
- Validate all inputs
- Use environment variables

## 📄 License

© 2026 Oyu Online Shop. All rights reserved.

## 👥 Author

Created by HDC Copilot Team

## 🤝 Contributing

Pull requests are welcome!
