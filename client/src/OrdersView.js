import React, { useState, useEffect } from 'react';
import './OrdersView.css';

function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('https://oyushop.onrender.com/api/orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Алдаа:', err);
    }
  };

  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
  };

  const closeDetails = () => {
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Энэ захиалгыг устгах уу?')) {
      return;
    }

    try {
      const response = await fetch(`https://oyushop.onrender.com/api/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchOrders();
        alert('✅ Захиалга устгагдлаа');
      }
    } catch (err) {
      alert('❌ Алдаа гарлаа');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const response = await fetch(`https://oyushop.onrender.com/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (err) {
      alert('❌ Алдаа гарлаа');
    }
  };

  return (
    <div className="orders-view">
      <h2>📋 Хэрэглэгчийн захиалгууд ({orders.length})</h2>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>Захиалга байхгүй байна</p>
        </div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Хэрэглэгч</th>
                <th>Утас</th>
                <th>Хаяг</th>
                <th>Дүн</th>
                <th>Огноо</th>
                <th>Статус</th>
                <th>Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td className="customer-name">{order.customerName}</td>
                  <td>{order.phone}</td>
                  <td className="address-cell">
                    <div>{order.address}</div>
                    {order.notes && (
                      <small className="address-details">
                        💬 {order.notes}
                      </small>
                    )}
                  </td>
                  <td className="price">{order.totalPrice}₮</td>
                  <td className="date">{order.orderDate}</td>
                  <td className="status">
                    <span className={`status-badge ${
                      order.status === 'Хүргэгдсэн' ? 'delivered' : 
                      order.status === 'Цуцалсан' ? 'cancelled' : 
                      'pending'
                    }`}>
                      {order.status || 'Хүлээгдэж байгаа'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      onClick={() => handleSelectOrder(order)}
                      className="detail-btn"
                      title="Дэлгэрэнгүй харах"
                    >
                      👁️
                    </button>
                    <select
                      value={order.status || 'Хүлээгдэж байгаа'}
                      onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                      className="status-select"
                      title="Статус өөрчлөх"
                    >
                      <option value="Хүлээгдэж байгаа">⏳ Хүлээгдэж байгаа</option>
                      <option value="Хүргэгдсэн">✅ Хүргэгдсэн</option>
                      <option value="Цуцалсан">❌ Цуцалсан</option>
                    </select>
                    <button 
                      onClick={() => handleDeleteOrder(order._id)}
                      className="delete-btn"
                      title="Устгах"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="order-modal">
          <div className="modal-content">
            <button onClick={closeDetails} className="close-btn">✕</button>
            
            <h3>📦 Захиалгын дэлгэрэнгүй</h3>

            <div className="order-details">
              <div className="detail-group">
                <label>Хэрэглэгчийн нэр:</label>
                <p>{selectedOrder.customerName}</p>
              </div>

              <div className="detail-group">
                <label>Утасны дугаар:</label>
                <p>{selectedOrder.phone}</p>
              </div>

              <div className="detail-group">
                <label>Гэрийн хаяг:</label>
                <p>{selectedOrder.address}</p>
              </div>

              <div className="detail-group">
                <label>💬 Захиалгын тайлбар:</label>
                <p>{selectedOrder.notes || '(Мэдээлэл байхгүй)'}</p>
              </div>

              <div className="detail-group">
                <label>Захиалгын огноо:</label>
                <p>{selectedOrder.orderDate}</p>
              </div>
            </div>

            <h4>📥 Сонгосон бараа:</h4>
            <div className="products-in-order">
              {selectedOrder.products.map((product, index) => (
                <div key={index} className="product-item">
                  <div className="product-details">
                    <h5>{product.name}</h5>
                    <p className="product-desc">{product.description}</p>
                  </div>
                  <div className="product-qty">
                    <span className="qty">{product.quantity} ширхэг</span>
                    <span className="unit-price">{product.price}₮ × {product.quantity}</span>
                  </div>
                  <div className="product-total">
                    {product.price * product.quantity}₮
                  </div>
                </div>
              ))}
            </div>

            <div className="order-total">
              <h4>Нийт дүн:</h4>
              <p className="total-amount">{selectedOrder.totalPrice}₮</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersView;
