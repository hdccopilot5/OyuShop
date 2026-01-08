import React, { useState } from 'react';
import './UserCheckout.css';

function UserCheckout({ cartItems, onOrderSuccess, onBack, onIncreaseQuantity, onDecreaseQuantity, onRemoveFromCart }) {
  const [formData, setFormData] = useState({
    customerName: '',
    address: '',
    notes: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Утасны дугаарын валидейшн - зөвхөн 8 оронтой тоо
    if (name === 'phone') {
      const phoneDigits = value.replace(/\D/g, '').slice(0, 8);
      setFormData(prev => ({
        ...prev,
        phone: phoneDigits
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://oyushop.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          products: cartItems
        })
      });

      const data = await response.json();

      if (data.success) {
        onOrderSuccess();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Сервертэй холбогдох алдаа');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="checkout-container">
      <button onClick={onBack} className="back-btn">← Буцах</button>
      
      <div className="checkout-content">
        <div className="form-section">
          <h2>👤 Хэрэглэгчийн мэдээлэл</h2>
          
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-group">
              <label>Нэр *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Өөрийн нэр"
                required
              />
            </div>

            <div className="form-group">
              <label>Гэрийн хаяг *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Улаанбаатар хот, Чингэлтэй дүүрэг..."
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Захиалгын тайлбар (нэмэлт мэдээлэл)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Орцны код, давхар, эсвэл бусад нэмэлт мэдээлэл оруулах..."
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Утасны дугаар * (8 оронтой)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="99112233"
                maxLength="8"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Илгээж байна...' : '✅ Захиалга баталгаажуулах'}
            </button>
          </form>
        </div>

        <div className="order-summary">
          <h2>📦 Захиалгын дэлгэрэнгүй</h2>
          
          <div className="items-list">
            {cartItems.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>{item.price}₮/ширхэг</p>
                </div>
                <div className="quantity-section">
                  <button 
                    type="button"
                    onClick={() => onDecreaseQuantity(item._id)}
                    className="qty-btn"
                  >
                    −
                  </button>
                  <span className="qty-display">{item.quantity}</span>
                  <button 
                    type="button"
                    onClick={() => onIncreaseQuantity(item._id)}
                    className="qty-btn"
                  >
                    +
                  </button>
                </div>
                <div className="item-total">
                  {item.price * item.quantity}₮
                </div>
                <button 
                  type="button"
                  onClick={() => onRemoveFromCart(item._id)}
                  className="remove-btn"
                  title="Сагснаас хасах"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <div className="total-section">
            <div>
              <h3>Нийт үнэ:</h3>
              <div className="total-price">{totalPrice}₮</div>
            </div>
            <div className="delivery-info">
              <p>📦 Хүргэлт: <strong>5.000₮ - 8.000₮</strong></p>
              <p>🚐 Орон нутгийн унаанд тавьж өгнө</p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="footer">
        <p>© 2026.Oyu online delguur. Зохиогчийн бүх эрх хуулиар хамгаалагдсан болно.</p>
      </footer>
    </div>
  );
}

export default UserCheckout;
