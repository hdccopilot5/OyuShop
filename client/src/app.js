import React, { useEffect, useState } from "react";
import "./app.css";
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";
import UserCheckout from "./UserCheckout";

// Shop page component
function ShopPage({ 
  products, category, loading, cartItems, 
  setCategory, addToCart, increaseQuantity, decreaseQuantity, handleCheckout 
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState({});
  const [zoomImage, setZoomImage] = useState(null);

  const handleImageClick = (image) => {
    setZoomImage(image);
  };

  const closeZoom = () => {
    setZoomImage(null);
  };

  const selectProductImage = (productId, index) => {
    setSelectedImageIndex(prev => ({
      ...prev,
      [productId]: index
    }));
  };

  const getAllImages = (product) => {
    const images = [];
    if (product.image) images.push(product.image);
    if (product.images && product.images.length > 0) {
      images.push(...product.images);
    }
    return images;
  };

  const getCurrentImage = (product) => {
    const allImages = getAllImages(product);
    const index = selectedImageIndex[product._id] || 0;
    return allImages[index] || product.image;
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-placeholder">
              <span className="logo-text">OYU</span>
            </div>
            <div className="header-text">
              <h1 className="title">Oyu online delguur</h1>
              <p className="subtitle">🛍️Манай дэлгүүр нь #онлайн бөгөөд чанартай барааг #хамгийн_хямд үнээр найрсаг үйлчилгээгээр санал болгохыг зорин ажилладаг 🤗 Бүх бараа #хүргэлттэй. Бид танд өөрсдийн туршиж үзсэн бараагаа санал болгодог гэдгээрээ онцлогтой 💕</p>
              <div className="contact-row">
                <a
                  className="social-link"
                  href="https://www.facebook.com/profile.php?id=61575911835307"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook хуудас"
                >
                  <span className="social-icon" aria-hidden>📘</span>
                  Facebook хуудас
                </a>
                <div className="phone-list" aria-label="Холбогдох утас">
                  <span className="phone-label">📞</span>
                  <a href="tel:99752020" className="phone-number">9975-2020</a>
                  <span className="phone-dot">•</span>
                  <a href="tel:94346134" className="phone-number">9434-6134</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="content">
        <div className="filter-section">
          <label className="filter-label">Ангилал сонгох:</label>
          <select 
            className="filter-select" 
            onChange={e => setCategory(e.target.value)} 
            value={category}
          >
            <option value="">🏪 Бүх барааг харах</option>
            <option value="baby">👶 Хүүхдийн бараа</option>
            <option value="moms">👩 Төрсөн эхийн бараа</option>
          </select>

          <div className="header-buttons">
            <button 
              onClick={handleCheckout}
              className={`checkout-btn ${cartItems.length === 0 ? 'disabled' : ''}`}
              disabled={cartItems.length === 0}
            >
              🛒 Сагс ({cartItems.length})
            </button>
          </div>
        </div>

        {loading && <p className="loading">Ачаалж байна...</p>}

        {!loading && products.length === 0 && (
          <p className="no-products">Энэ ангиллд бараа байхгүй байна</p>
        )}

        <div className="products-grid">
          {products.map((p) => (
            <div key={p._id || Math.random()} className="product-card">
              <div className="product-image-wrapper">
                {getCurrentImage(p) ? (
                  <img 
                    src={getCurrentImage(p)} 
                    alt={p.name} 
                    className="product-image clickable" 
                    onClick={() => handleImageClick(getCurrentImage(p))}
                  />
                ) : (
                  <div className="product-image-placeholder">📦</div>
                )}
              </div>
              {getAllImages(p).length > 1 && (
                <div className="image-thumbnails">
                  {getAllImages(p).map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${p.name} ${index + 1}`}
                      className={`thumbnail ${(selectedImageIndex[p._id] || 0) === index ? 'active' : ''}`}
                      onClick={() => selectProductImage(p._id, index)}
                    />
                  ))}
                </div>
              )}
              <div className="product-info">
                <h3 className="product-name">{p.name}</h3>
                <p className="product-description">{p.description}</p>
                <div className="product-footer">
                  <span className="product-price">{p.price}₮</span>
                  <button 
                    onClick={() => addToCart(p)}
                    className="add-to-cart-btn"
                    disabled={(p.stock || 0) === 0}
                  >
                    {(p.stock || 0) === 0 ? 'Үлдэгдэлгүй' : 'Сагс дээр нэмэх'}
                  </button>
                </div>
                <div className="product-stock">
                  <small>Үлдэгдэл: <strong>{p.stock || 0}</strong></small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {zoomImage && (
        <div className="zoom-modal" onClick={closeZoom}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-close-btn" onClick={closeZoom}>✕</button>
            <img src={zoomImage} alt="Томруулсан зураг" className="zoomed-image" />
          </div>
        </div>
      )}

      <footer className="footer">
        <p>© 2026.Oyu online delguur. Зохиогчийн бүх эрх хуулиар хамгаалагдсан болно.</p>
      </footer>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isCheckout, setIsCheckout] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAdminLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`https://oyushop.onrender.com/api/products${category ? '?category=' + category : ''}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.log("Сервер холбогдоогүй байна");
        setLoading(false);
      });
  }, [category]);

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    navigate('/');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminLoggedIn(false);
    navigate('/');
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item._id === product._id);
      if (existingItem) {
        return prev.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const increaseQuantity = (productId) => {
    setCartItems(prev => 
      prev.map(item =>
        item._id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (productId) => {
    setCartItems(prev => 
      prev.map(item =>
        item._id === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item._id !== productId));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Сагс хоос байна');
      return;
    }
    navigate('/checkout');
  };

  const handleOrderSuccess = () => {
    setCartItems([]);
    alert('✅ Захиалга амжилттай хүлээн авлаа!');
    navigate('/');
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ShopPage 
            products={products}
            category={category}
            loading={loading}
            cartItems={cartItems}
            setCategory={setCategory}
            addToCart={addToCart}
            increaseQuantity={increaseQuantity}
            decreaseQuantity={decreaseQuantity}
            handleCheckout={handleCheckout}
          />
        }
      />
      <Route 
        path="/admin" 
        element={
          isAdminLoggedIn ? (
            <AdminPanel onLogout={handleAdminLogout} />
          ) : (
            <AdminLogin onLoginSuccess={handleAdminLogin} />
          )
        }
      />
      <Route 
        path="/checkout" 
        element={
          <UserCheckout 
            cartItems={cartItems}
            onOrderSuccess={handleOrderSuccess}
            onBack={() => navigate('/')}
            onIncreaseQuantity={increaseQuantity}
            onDecreaseQuantity={decreaseQuantity}
            onRemoveFromCart={removeFromCart}
          />
        }
      />
    </Routes>
  );
}

// Main App wrapper with Router
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;