import React, { useState, useEffect, useRef } from 'react';
import './OrdersView.css';

function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);
  const prevIdsRef = useRef(new Set());
  const audioCtxRef = useRef(null);

  // Огноо форматлах функц
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      // Хэрэв захиалга 1 минутаас бага хугацаанд ирсэн бол
      if (diffMins < 1) {
        return '🕐 Дөнгөж сая';
      }
      // 60 минутаас бага
      if (diffMins < 60) {
        return `🕐 ${diffMins} минутын өмнө`;
      }
      // 24 цагаас бага
      if (diffHours < 24) {
        return `🕐 ${diffHours} цагийн өмнө`;
      }
      // 7 хоногоос бага
      if (diffDays < 7) {
        return `📅 ${diffDays} өдрийн өмнө`;
      }
      // Бусад тохиолдолд
      const absolute = `${date.toLocaleDateString('mn-MN')} ${date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}`;
      return `📅 ${absolute}`;
    } catch (e) {
      return dateString;
    }
  };

  const formatDateWithAbsolute = (dateString) => {
    const relative = formatDate(dateString);
    try {
      const date = new Date(dateString);
      const absolute = `${date.toLocaleDateString('mn-MN')} ${date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}`;
      return `${relative} • ${absolute}`;
    } catch (e) {
      return relative;
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('https://oyushop-1.onrender.com/api/orders', {
        headers: {
          ...authHeaders()
        }
      });
      const data = await response.json();
      const newOrders = Array.isArray(data) ? data : [];
      const newIds = new Set(newOrders.map(o => o._id));
      const prevIds = prevIdsRef.current;
      if (prevIds.size > 0) {
        newOrders.forEach(o => {
          if (!prevIds.has(o._id)) {
            playBeep();
            showNotification('🆕 Шинэ захиалга', `${o.customerName} захиалга өглөө`);
          }
        });
      }
      prevIdsRef.current = newIds;
      setOrders(newOrders);
    } catch (err) {
      console.error('Алдаа:', err);
    }
  };

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => osc.stop(), 200);
    } catch {}
  };

  const showNotification = (title, body) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') new Notification(title, { body, icon: '/favicon.ico' });
        });
      }
    } catch {}
  };

  const handleExportXlsx = async () => {
    try {
      setExporting(true);
      const response = await fetch('https://oyushop-1.onrender.com/api/orders/export/xlsx', {
        headers: {
          ...authHeaders()
        }
      });
      if (!response.ok) throw new Error('export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('❌ Excel татаж чадсангүй. Админ эрх шалгана уу.');
    } finally {
      setExporting(false);
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
      const response = await fetch(`https://oyushop-1.onrender.com/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders()
        }
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
      const response = await fetch(`https://oyushop-1.onrender.com/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (err) {
      alert('❌ Алдаа гарлаа');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'ALL') {
      return true;
    }
    const currentStatus = order.status || 'Шинэ захиалга';
    return currentStatus === statusFilter;
  });

  return (
    <div className="orders-view">
      <div className="orders-header">
        <h2>📋 Хэрэглэгчийн захиалгууд ({filteredOrders.length}/{orders.length})</h2>
        <div className="orders-actions">
          <div className="orders-filter">
            <label htmlFor="statusFilter">Статус шүүх:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">📋 Бүгд</option>
              <option value="Шинэ захиалга">🆕 Зөвхөн шинэ</option>
              <option value="Хүлээгдэж байгаа">⏳ Хүлээгдэж байгаа</option>
              <option value="Хүргэгдсэн">✅ Хүргэгдсэн</option>
              <option value="Цуцалсан">❌ Цуцалсан</option>
            </select>
          </div>
          <button onClick={handleExportXlsx} className="export-btn" disabled={exporting}>
            {exporting ? '⏳ Татаж байна...' : '📥 Excel татах'}
          </button>
        </div>
      </div>

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
              {filteredOrders.map(order => (
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
                  <td className="price">
                    {order.totalPrice}₮
                    {order.discountAmount > 0 && (
                      <div className="promo-badge" title={`Код: ${order.promoCode || ''}`}>
                        🎟️ −{order.discountAmount}₮ {order.promoCode ? `(${order.promoCode})` : ''}
                      </div>
                    )}
                  </td>
                  <td className="date">{formatDateWithAbsolute(order.orderDate)}</td>
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
                      value={order.status || 'Шинэ захиалга'}
                      onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                      className="status-select"
                      title="Статус өөрчлөх"
                    >
                      <option value="Шинэ захиалга">🆕 Шинэ захиалга</option>
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

              {selectedOrder.videoUrl && (
                <div className="detail-group">
                  <label>🎬 Видео тайлбар:</label>
                  <video src={selectedOrder.videoUrl} controls className="order-video" />
                </div>
              )}

              <div className="detail-group">
                <label>Захиалгын огноо:</label>
                <p>{formatDateWithAbsolute(selectedOrder.orderDate)}</p>
              </div>

              <div className="detail-group">
                <label>🎟️ Урамшууллын код:</label>
                <p>{selectedOrder.promoCode || '(Ашиглаагүй)'}</p>
              </div>

              <div className="detail-group">
                <label>Хөнгөлөлт:</label>
                <p>{selectedOrder.discountAmount ? `-${selectedOrder.discountAmount}₮` : '0₮'}</p>
              </div>

              <div className="detail-group">
                <label>Дүн (хөнгөлөлтөөс өмнө):</label>
                <p>{selectedOrder.subtotal}₮</p>
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
