import React, { useState, useEffect } from 'react';
import './AdminPanel.css';
import OrdersView from './OrdersView';

function AdminPanel({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'baby',
    image: '',
    images: [],
    stock: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('https://oyushop.onrender.com/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Алдаа:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setFormData(prev => ({
          ...prev,
          image: base64
        }));
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPreviews = [];
      const newImages = [];
      let filesProcessed = 0;

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          newImages.push(base64);
          newPreviews.push(base64);
          filesProcessed++;

          if (filesProcessed === files.length) {
            setFormData(prev => ({
              ...prev,
              images: [...(prev.images || []), ...newImages]
            }));
            setImagePreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!formData.name || !formData.description || !formData.price || formData.stock === '') {
      setMessage('❌ Бүх шаардлагатай мэдээлэлийг нөхөөрэй');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock)
      };

      if (editingId) {
        // Засах
        const response = await fetch(`https://oyushop.onrender.com/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });

        if (response.ok) {
          setMessage('✅ Бараа амжилттай засагдлаа');
          setEditingId(null);
          resetForm();
          fetchProducts();
        } else {
          setMessage('❌ Бараа засах алдаа');
        }
      } else {
        // Нэмэх
        const response = await fetch('https://oyushop.onrender.com/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });

        if (response.ok) {
          setMessage('✅ Бараа амжилттай нэмэгдлээ');
          resetForm();
          fetchProducts();
        } else {
          const errorData = await response.json();
          setMessage(`❌ ${errorData.message || 'Бараа нэмэх алдаа'}`);
        }
      }
    } catch (err) {
      setMessage('❌ Сервертэй холбогдох алдаа');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Энэ барааг устгахыг хүсч байна уу?')) {
      try {
        const response = await fetch(`https://oyushop.onrender.com/api/products/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setMessage('✅ Бараа амжилттай устгагдлаа');
          fetchProducts();
        }
      } catch (err) {
        setMessage('❌ Алдаа гарлаа');
      }
    }
  };

  const handleStockChange = async (id, change) => {
    const product = products.find(p => p._id === id);
    if (!product) return;
    
    const newStock = Math.max(0, (product.stock || 0) + change);
    
    try {
      const response = await fetch(`https://oyushop.onrender.com/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, stock: newStock })
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (err) {
      setMessage('❌ Үлдэгдэл заслах алдаа');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      images: product.images || [],
      stock: product.stock || ''
    });
    setImagePreview(product.image);
    setImagePreviews(product.images || []);
    setEditingId(product._id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'baby',
      image: '',
      images: [],
      stock: ''
    });
    setEditingId(null);
    setImagePreview('');
    setImagePreviews([]);
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>⚙️ Админ панель</h1>
        <button onClick={onLogout} className="logout-btn">Гарах</button>
      </header>

      <div className="admin-content">
        <div className="form-section">
          <div className="form-header">
            <h2>{editingId ? '📝 Барааг засах' : '➕ Шинэ бараа нэмэх'}</h2>
            <button 
              type="button"
              onClick={() => setShowForm(!showForm)} 
              className="toggle-form-btn"
            >
              {showForm ? '▲ Хаах' : '▼ Нээх'}
            </button>
          </div>

          {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

          {showForm && (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Барааны нэр *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Жишээ нь: Хүүхдийн нөөрдөг"
                required
              />
            </div>

            <div className="form-group">
              <label>Тайлбар *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Барааны дэлгэрэнгүй тайлбар"
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Үнэ (₮) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="25000"
                  required
                />
              </div>

              <div className="form-group">
                <label>Үлдэгдэл *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="10"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ангилал *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="baby">👶 Хүүхдийн бараа</option>
                  <option value="moms">👩 Төрсөн эхийн бараа</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Бараан зураг</label>
              <div className="image-upload-section">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-file-input"
                  id="imageInput"
                />
                <label htmlFor="imageInput" className="image-upload-label">
                  📁 Үндсэн зургийг сонгоно уу
                </label>
              </div>
              {imagePreview && (
                <div className="image-preview-wrapper">
                  <p className="preview-label">Үндсэн зургийн урьдчилсан үзүүлэлт:</p>
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Нэмэлт зургууд (өнгөний сонголт)</label>
              <div className="image-upload-section">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleImagesChange}
                  className="image-file-input"
                  id="multipleImagesInput"
                />
                <label htmlFor="multipleImagesInput" className="image-upload-label">
                  📁 Олон зураг сонгох (өнгөний хувилбар)
                </label>
              </div>
              {imagePreviews.length > 0 && (
                <div className="multiple-images-preview">
                  <p className="preview-label">Нэмэлт зургууд ({imagePreviews.length}):</p>
                  <div className="images-grid">
                    {imagePreviews.map((img, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={img} alt={`Preview ${index + 1}`} />
                        <button 
                          type="button"
                          onClick={() => removeImage(index)}
                          className="remove-image-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-buttons">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Хүлээлээ...' : editingId ? '💾 Засах' : '➕ Нэмэх'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="cancel-btn">
                  ✕ Цуцлах
                </button>
              )}
            </div>
          </form>
          )}
        </div>

        <div className="products-section">
          <div className="products-header">
            <h2>📦 Бүх бараа ({products.filter(p => 
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description.toLowerCase().includes(searchQuery.toLowerCase())
            ).length})</h2>
            <input
              type="text"
              placeholder="🔍 Бараа хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="products-table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Нэр</th>
                  <th>Ангилал</th>
                  <th>Үнэ</th>
                  <th>Үлдэгдэл</th>
                  <th>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .filter(p => 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.description.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(product => (
                  <tr key={product._id}>
                    <td>
                      <strong>{product.name}</strong>
                      <br />
                      <small>{product.description}</small>
                    </td>
                    <td>
                      {product.category === 'baby' ? '👶' : '👩'} {product.category}
                    </td>
                    <td className="price">{product.price}₮</td>
                    <td className="stock">
                      <div className="stock-controls">
                        <button 
                          onClick={() => handleStockChange(product._id, -1)}
                          className="stock-btn minus-btn"
                          title="Үлдэгдэл хасах"
                        >
                          −
                        </button>
                        <span className="stock-value">{product.stock || 0}</span>
                        <button 
                          onClick={() => handleStockChange(product._id, 1)}
                          className="stock-btn plus-btn"
                          title="Үлдэгдэл нэмэх"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="actions">
                      <button 
                        onClick={() => handleEdit(product)} 
                        className="edit-btn"
                        title="Засах"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(product._id)} 
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

          {products.length === 0 && (
            <p className="no-products">Бараа байхгүй байна</p>
          )}
        </div>
      </div>

      <OrdersView />
      
      <footer className="footer">
        <p>© 2026.Oyu online delguur. Зохиогчийн бүх эрх хуулиар хамгаалагдсан болно.</p>
      </footer>
    </div>
  );
}

export default AdminPanel;
