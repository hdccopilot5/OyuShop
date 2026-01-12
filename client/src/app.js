import React, { useEffect, useState } from "react";
import "./app.css";
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";
import UserCheckout from "./UserCheckout";
import Tutorials from "./Tutorials";

// Shop page component
function ShopPage({ 
  products, category, loading, cartItems, 
  setCategory, addToCart, increaseQuantity, decreaseQuantity, handleCheckout, toggleDarkMode, darkMode,
  searchQuery, setSearchQuery, priceFilter, setPriceFilter, toggleWishlist, isInWishlist, wishlist
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState({});
  const [zoomImage, setZoomImage] = useState(null);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Filter products by search, category, and price
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = priceFilter === 'all' ||
      (priceFilter === 'under10k' && p.price < 10000) ||
      (priceFilter === '10k-20k' && p.price >= 10000 && p.price < 20000) ||
      (priceFilter === '20k-50k' && p.price >= 20000 && p.price < 50000) ||
      (priceFilter === 'over50k' && p.price >= 50000);

    return matchesSearch && matchesPrice;
  });

  const SkeletonCard = () => (
    <div className="skeleton-card">
      <div className="skeleton-image"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text short"></div>
      <div className="skeleton-button"></div>
    </div>
  );

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

          <label className="filter-label">Үнэ:</label>
          <select 
            className="filter-select" 
            onChange={e => setPriceFilter(e.target.value)} 
            value={priceFilter}
          >
            <option value="all">💰 Бүх үнэ</option>
            <option value="under10k">💵 10,000₮ хүртэл</option>
            <option value="10k-20k">💵 10,000₮ - 20,000₮</option>
            <option value="20k-50k">💵 20,000₮ - 50,000₮</option>
            <option value="over50k">💵 50,000₮+</option>
          </select>

          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Бараа хайх..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="header-buttons">
            <Link to="/tutorials" className="checkout-btn" style={{textDecoration: 'none'}}>🎬 Заавар</Link>
            <button 
              onClick={handleCheckout}
              className={`checkout-btn ${cartItems.length === 0 ? 'disabled' : ''}`}
              disabled={cartItems.length === 0}
            >
              🛒 Сагс ({cartItems.length})
            </button>
            <button onClick={toggleDarkMode} className="dark-mode-toggle" title={darkMode ? 'Цагаан өнгө' : 'Хар өнгө'}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            <a 
              href="https://www.messenger.com/t/701484816372660" 
              target="_blank" 
              rel="noreferrer"
              className="messenger-btn"
              title="Messenger холбоо"
            >
              💬
            </a>
          </div>
        </div>

        {loading && (
          <div className="products-grid">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <p className="no-products">{searchQuery || priceFilter !== 'all' ? 'Хайлтад тохирох бараа олдсонгүй' : 'Энэ ангиллд бараа байхгүй байна'}</p>
        )}

        <div className="products-grid">
          {filteredProducts.map((p) => (
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
                    onClick={() => {
                      addToCart(p);
                      setAddingToCart(p._id);
                      setTimeout(() => setAddingToCart(null), 600);
                    }}
                    className={`add-to-cart-btn ${addingToCart === p._id ? 'adding' : ''}`}
                    disabled={(p.stock || 0) === 0}
                  >
                    {(p.stock || 0) === 0 ? 'Үлдэгдэлгүй' : addingToCart === p._id ? '✓ Нэмэгдлээ' : 'Сагс дээр нэмэх'}
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

      {showScrollTop && (
        <button className="scroll-to-top" onClick={scrollToTop} title="Дээш очих">
          ⬆️
        </button>
      )}

      {showWishlist && (
        <div className="zoom-modal" onClick={() => setShowWishlist(false)}>
          <div className="wishlist-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wishlist-modal-header">
              <h2>❤️ Дуртай бараанууд ({wishlist.length})</h2>
              <button className="zoom-close-btn" onClick={() => setShowWishlist(false)}>✕</button>
            </div>
            {wishlist.length === 0 ? (
              <p className="no-wishlist">Дуртай бараа байхгүй байна</p>
            ) : (
              <div className="wishlist-grid">
                {wishlist.map(p => (
                  <div key={p._id} className="wishlist-item">
                    <img src={p.image} alt={p.name} className="wishlist-item-image" />
                    <div className="wishlist-item-info">
                      <h4>{p.name}</h4>
                      <p className="wishlist-item-price">{p.price}₮</p>
                      <div className="wishlist-item-actions">
                        <button onClick={() => addToCart(p)} className="add-to-cart-btn-small">
                          🛒 Сагсанд
                        </button>
                        <button onClick={() => toggleWishlist(p)} className="remove-wishlist-btn" title="Хасах">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAdminLoggedIn(true);
    }
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
    // Load wishlist
    const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(savedWishlist);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`https://oyushop-1.onrender.com/api/products${category ? '?category=' + category : ''}`)
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

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const toggleWishlist = (product) => {
    const isInWishlist = wishlist.some(item => item._id === product._id);
    let newWishlist;
    if (isInWishlist) {
      newWishlist = wishlist.filter(item => item._id !== product._id);
    } else {
      newWishlist = [...wishlist, product];
    }
    setWishlist(newWishlist);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId);
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
            toggleDarkMode={toggleDarkMode}
            darkMode={darkMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            toggleWishlist={toggleWishlist}
            isInWishlist={isInWishlist}
            wishlist={wishlist}
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
      <Route path="/tutorials" element={<Tutorials />} />
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