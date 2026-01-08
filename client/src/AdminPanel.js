import React, { useState, useEffect, useRef } from 'react';
import './AdminPanel.css';
import OrdersView from './OrdersView';
import jsQR from 'jsqr';

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
  const [showProducts, setShowProducts] = useState(true);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [showInventory, setShowInventory] = useState(false);
  const [showOrders, setShowOrders] = useState(true);
  const [editingLogId, setEditingLogId] = useState(null);
  const [barcodeSupport, setBarcodeSupport] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const [inventoryForm, setInventoryForm] = useState({
    productCode: '',
    productName: '',
    importDate: new Date().toISOString().split('T')[0],
    costPrice: '',
    salePrice: '',
    quantity: '',
    cargoPrice: '',
    inspectionCost: '',
    otherCost: ''
  });

  // Tutorials state
  const [showTutorials, setShowTutorials] = useState(false);
  const [tutorials, setTutorials] = useState([]);
  const [tutorialForm, setTutorialForm] = useState({ title: '', description: '' });
  const [tutorialVideoFile, setTutorialVideoFile] = useState(null);
  const [config, setConfig] = useState({ s3Enabled: false, s3PublicBaseUrl: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (showInventory) {
      fetchInventoryLogs();
    }
  }, [showInventory]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://oyushop.onrender.com/api/config');
        const data = await res.json();
        setConfig({ s3Enabled: !!data.s3Enabled, s3PublicBaseUrl: data.s3PublicBaseUrl || '' });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (showTutorials) {
      fetchTutorials();
    }
  }, [showTutorials]);

  useEffect(() => {
    setBarcodeSupport(true);
    return () => {
      stopCameraScan();
    };
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

  const fetchInventoryLogs = async () => {
    try {
      const response = await fetch('https://oyushop.onrender.com/api/inventory-logs');
      const data = await response.json();
      setInventoryLogs(data);
    } catch (err) {
      console.error('Алдаа:', err);
    }
  };

  const fetchTutorials = async () => {
    try {
      const res = await fetch('https://oyushop.onrender.com/api/tutorials');
      const data = await res.json();
      setTutorials(Array.isArray(data) ? data : []);
    } catch (e) {
      setTutorials([]);
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

  const stopCameraScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const decodeWithZXing = async (canvas) => {
    try {
      const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      return code ? code.data : null;
    } catch (err) {
      return null;
    }
  };

  const startCameraScan = async () => {
    try {
      stopCameraScan();
      setScanMessage('Камер асааж байна...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
      setScanMessage('Код хайж байна...');

      let frameCount = 0;
      scanIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Зөвхөн 1-2 frame-ээр нэг удаа уншина (performance)
        frameCount++;
        if (frameCount % 3 !== 0) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code && code.data && code.data.trim()) {
          setInventoryForm(prev => ({ ...prev, productCode: code.data.trim() }));
          setScanMessage('✅ Код уншигдлаа: ' + code.data);
          stopCameraScan();
        }
      }, 300);
    } catch (err) {
      console.error('Camera scan error:', err);
      setScanMessage('Камер асаахад алдаа. Зураг оруулах эсвэл гараар бичнэ үү.');
      stopCameraScan();
    }
  };

  const handleImageUploadForCode = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanMessage('Зурагнаас код уншиж байна...');
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const img = new Image();
          img.onload = async () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              
              if (code && code.data) {
                setInventoryForm(prev => ({ ...prev, productCode: code.data.trim() }));
                setScanMessage('✅ Код уншигдлаа: ' + code.data);
              } else {
                setScanMessage('Код олдсонгүй. Гараар бичнэ үү.');
              }
            } catch (err) {
              console.error('Decode error:', err);
              setScanMessage('Код уншихад алдаа. Гараар бичнэ үү.');
            }
          };
          img.onerror = () => {
            setScanMessage('Зургийг уншиж чадсангүй.');
          };
          img.src = event.target.result;
        } catch (err) {
          console.error('Image scan error:', err);
          setScanMessage('Код уншихад алдаа гарлаа.');
        }
      };
      reader.onerror = () => {
        setScanMessage('Файлыг уншиж чадсангүй.');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File read error:', err);
      setScanMessage('Алдаа гарлаа.');
    }
  };

  const handleInventoryInputChange = (e) => {
    const { name, value } = e.target;
    setInventoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingLogId 
        ? `https://oyushop.onrender.com/api/inventory-logs/${editingLogId}`
        : 'https://oyushop.onrender.com/api/inventory-logs';
      
      const method = editingLogId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inventoryForm,
          costPrice: parseFloat(inventoryForm.costPrice),
          salePrice: parseFloat(inventoryForm.salePrice),
          quantity: parseInt(inventoryForm.quantity),
          cargoPrice: parseFloat(inventoryForm.cargoPrice) || 0,
          inspectionCost: parseFloat(inventoryForm.inspectionCost) || 0,
          otherCost: parseFloat(inventoryForm.otherCost) || 0
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(editingLogId ? '✅ Бүртгэл шинэчлэгдлээ' : '✅ Бараа бүртгэгдлээ');
        setInventoryForm({
          productCode: '',
          productName: '',
          importDate: new Date().toISOString().split('T')[0],
          costPrice: '',
          salePrice: '',
          quantity: '',
          cargoPrice: '',
          inspectionCost: '',
          otherCost: ''
        });
        setEditingLogId(null);
        fetchInventoryLogs();
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (err) {
      setMessage('❌ Алдаа гарлаа');
      console.error('Алдаа:', err);
    }
  };

  const handleEditInventoryLog = (log) => {
    setInventoryForm({
      productCode: log.productCode,
      productName: log.productName,
      importDate: new Date(log.importDate).toISOString().split('T')[0],
      costPrice: log.costPrice.toString(),
      salePrice: log.salePrice.toString(),
      quantity: log.quantity.toString(),
      cargoPrice: (log.cargoPrice || 0).toString(),
      inspectionCost: (log.inspectionCost || 0).toString(),
      otherCost: (log.otherCost || 0).toString()
    });
    setEditingLogId(log._id);
    window.scrollTo({ top: document.querySelector('.inventory-form').offsetTop - 100, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setInventoryForm({
      productCode: '',
      productName: '',
      importDate: new Date().toISOString().split('T')[0],
      costPrice: '',
      salePrice: '',
      quantity: '',
      cargoPrice: '',
      inspectionCost: '',
      otherCost: ''
    });
  };

  const handleDeleteInventoryLog = async (id) => {
    if (!window.confirm('Энэ бүртгэлийг устгах уу?')) return;

    try {
      const response = await fetch(`https://oyushop.onrender.com/api/inventory-logs/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchInventoryLogs();
        setMessage('✅ Бүртгэл устгагдлаа');
      }
    } catch (err) {
      setMessage('❌ Алдаа гарлаа');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('https://oyushop.onrender.com/api/inventory-logs/export/csv');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `baraanyg-burtgel-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('❌ Татаж авалт амжилтгүй');
    }
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

  // Tutorials handlers
  const handleTutorialInput = (e) => {
    const { name, value } = e.target;
    setTutorialForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTutorialFile = (e) => {
    const f = e.target.files && e.target.files[0];
    setTutorialVideoFile(f || null);
  };

  const handleCreateTutorial = async (e) => {
    e.preventDefault();
    if (!tutorialForm.title || !tutorialVideoFile) {
      setMessage('❌ Гарчиг болон видео шаардлагатай');
      return;
    }
    try {
      let videoUrl = '';
      if (config.s3Enabled) {
        const filename = `tutorial-${Date.now()}-${tutorialVideoFile.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
        const pres = await fetch('https://oyushop.onrender.com/api/upload/video/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, contentType: tutorialVideoFile.type || 'video/mp4' })
        });
        const presData = await pres.json();
        if (!presData.success) throw new Error('presign failed');
        const putRes = await fetch(presData.url, {
          method: 'PUT',
          headers: { 'Content-Type': tutorialVideoFile.type || 'video/mp4' },
          body: tutorialVideoFile
        });
        if (!putRes.ok) throw new Error('S3 PUT failed');
        videoUrl = presData.publicUrl;
      } else {
        const fd = new FormData();
        fd.append('video', tutorialVideoFile);
        const up = await fetch('https://oyushop.onrender.com/api/upload/video', { method: 'POST', body: fd });
        const upData = await up.json();
        if (!upData.success) throw new Error('upload failed');
        videoUrl = upData.url;
      }

      const res = await fetch('https://oyushop.onrender.com/api/tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: tutorialForm.title, description: tutorialForm.description, videoUrl })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Заавар бичлэг нэмэгдлээ');
        setTutorialForm({ title: '', description: '' });
        setTutorialVideoFile(null);
        fetchTutorials();
      } else {
        setMessage('❌ ' + (data.message || 'Алдаа'));
      }
    } catch (err) {
      setMessage('❌ Алдаа гарлаа');
    }
  };

  const handleDeleteTutorial = async (id) => {
    if (!window.confirm('Энэ бичлэгийг устгах уу?')) return;
    try {
      const res = await fetch(`https://oyushop.onrender.com/api/tutorials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('✅ Устгагдлаа');
        fetchTutorials();
      }
    } catch (e) {
      setMessage('❌ Алдаа гарлаа');
    }
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
            <div className="products-header-actions">
              <input
                type="text"
                placeholder="🔍 Бараа хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button 
                type="button"
                onClick={() => setShowProducts(!showProducts)} 
                className="toggle-products-btn"
              >
                {showProducts ? '▲ Хаах' : '▼ Нээх'}
              </button>
            </div>
          </div>

          {showProducts && (
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
          )}

          {products.length === 0 && showProducts && (
            <p className="no-products">Бараа байхгүй байна</p>
          )}
        </div>
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h2>📋 Хэрэглэгчийн захиалгууд</h2>
          <button 
            type="button"
            onClick={() => setShowOrders(!showOrders)} 
            className="toggle-orders-btn"
          >
            {showOrders ? '▲ Хаах' : '▼ Нээх'}
          </button>
        </div>
        
        {showOrders && <OrdersView />}
      </div>
      
      <div className="admin-section">
        <div className="section-header">
          <h2>📦 Бараа бүртгэл</h2>
          <button 
            type="button"
            onClick={() => setShowInventory(!showInventory)} 
            className="toggle-inventory-btn"
          >
            {showInventory ? '▲ Хаах' : '▼ Нээх'}
          </button>
        </div>

        {showInventory && (
          <>
            <form onSubmit={handleInventorySubmit} className="inventory-form">
              <h3>📝 {editingLogId ? '✏️ Бүртгэл засах' : 'Бараа бүртгэл'}</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Барааны код*</label>
                  <input 
                    type="text" 
                    name="productCode"
                    value={inventoryForm.productCode}
                    onChange={handleInventoryInputChange}
                    placeholder="ПР-001"
                    required
                  />
                  <div className="scanner-actions">
                    <button
                      type="button"
                      className="scan-btn"
                      onClick={startCameraScan}
                      disabled={isScanning && barcodeSupport}
                    >
                      📷 Камер унших
                    </button>
                    <label className="scan-upload">
                      📁 Зурагнаас унших
                      <input type="file" accept="image/*" onChange={handleImageUploadForCode} />
                    </label>
                  </div>
                  <div className="scanner-status">
                    <small>{scanMessage || 'Камер эсвэл зураг оруулж код уншуулна'}</small>
                  </div>
                  <div className="scanner-preview">
                    <video ref={videoRef} className={isScanning ? 'video-active' : ''} muted playsInline></video>
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                  </div>
                </div>
                <div className="form-group">
                  <label>Барааны нэр*</label>
                  <input 
                    type="text" 
                    name="productName"
                    value={inventoryForm.productName}
                    onChange={handleInventoryInputChange}
                    placeholder="Барааны нэр"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Монголд ирсэн огноо*</label>
                  <input 
                    type="date" 
                    name="importDate"
                    value={inventoryForm.importDate}
                    onChange={handleInventoryInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Үндсэн үнэ (₮)*</label>
                  <input 
                    type="number" 
                    name="costPrice"
                    value={inventoryForm.costPrice}
                    onChange={handleInventoryInputChange}
                    placeholder="25000"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Зарах үнэ (₮)*</label>
                  <input 
                    type="number" 
                    name="salePrice"
                    value={inventoryForm.salePrice}
                    onChange={handleInventoryInputChange}
                    placeholder="35000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ширхэг*</label>
                  <input 
                    type="number" 
                    name="quantity"
                    value={inventoryForm.quantity}
                    onChange={handleInventoryInputChange}
                    placeholder="10"
                    required
                  />
                </div>                <div className="form-group">
                  <label>Карго үнэ (₮)</label>
                  <input 
                    type="number" 
                    name="cargoPrice"
                    value={inventoryForm.cargoPrice}
                    onChange={handleInventoryInputChange}
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Баталтын зардал (₮)</label>
                  <input 
                    type="number" 
                    name="inspectionCost"
                    value={inventoryForm.inspectionCost}
                    onChange={handleInventoryInputChange}
                    placeholder="2000"
                  />
                </div>
                <div className="form-group">
                  <label>Бусад зардал (₮)</label>
                  <input 
                    type="number" 
                    name="otherCost"
                    value={inventoryForm.otherCost}
                    onChange={handleInventoryInputChange}
                    placeholder="1000"
                  />
                </div>              </div>

              <button type="submit" className="submit-btn">
                {editingLogId ? '💾 Шинэчлэх' : '💾 Бүртгүүлэх'}
              </button>
              {editingLogId && (
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  className="cancel-btn"
                >
                  ✕ Болих
                </button>
              )}
            </form>

            <div className="inventory-report">
              <div className="report-header">
                <h3>📊 Бараа бүртгэлийн тайлан</h3>
                <button onClick={handleExportCSV} className="export-btn">📥 Excel татаж авах</button>
              </div>

              {inventoryLogs.length === 0 ? (
                <p className="no-data">Бүртгэл байхгүй байна</p>
              ) : (
                <div className="inventory-table-wrapper">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Барааны код</th>
                        <th>Нэр</th>
                        <th>Ирсэн огноо</th>
                        <th>Үндсэн үнэ</th>
                        <th>Зарах үнэ</th>
                        <th>Ширхэг</th>
                        <th>Нийт зардал</th>
                        <th>Нийт орлого</th>
                        <th>Ашиг</th>
                        <th>Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryLogs.map(log => {
                        const cargoPrice = log.cargoPrice || 0;
                        const inspectionCost = log.inspectionCost || 0;
                        const otherCost = log.otherCost || 0;
                        const totalCost = (log.costPrice * log.quantity) + cargoPrice + inspectionCost + otherCost;
                        const totalRevenue = log.salePrice * log.quantity;
                        const totalProfit = totalRevenue - totalCost;
                        
                        return (
                          <tr key={log._id}>
                            <td className="code">{log.productCode}</td>
                            <td>{log.productName}</td>
                            <td>{new Date(log.importDate).toLocaleDateString('mn-MN')}</td>
                            <td className="price">{log.costPrice}₮</td>
                            <td className="price">{log.salePrice}₮</td>
                            <td className="quantity">{log.quantity}</td>
                            <td className="cost">{totalCost}₮</td>
                            <td className="revenue">{totalRevenue}₮</td>
                            <td className={totalProfit >= 0 ? 'profit' : 'loss'}>
                              {totalProfit >= 0 ? '+' : ''}{totalProfit}₮
                            </td>
                            <td>
                              <button 
                                onClick={() => handleEditInventoryLog(log)}
                                className="edit-btn"
                                title="Засах"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => handleDeleteInventoryLog(log._id)}
                                className="delete-btn"
                                title="Устгах"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h2>🎬 Заавар бичлэг</h2>
          <button 
            type="button"
            onClick={() => setShowTutorials(!showTutorials)} 
            className="toggle-inventory-btn"
          >
            {showTutorials ? '▲ Хаах' : '▼ Нээх'}
          </button>
        </div>

        {showTutorials && (
          <>
            <form onSubmit={handleCreateTutorial} className="inventory-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Гарчиг *</label>
                  <input type="text" name="title" value={tutorialForm.title} onChange={handleTutorialInput} placeholder="Жишээ: Хүргэлтийн заавар" required />
                </div>
                <div className="form-group">
                  <label>Видео файл *</label>
                  <input type="file" accept="video/*" onChange={handleTutorialFile} required />
                </div>
              </div>
              <div className="form-group">
                <label>Тайлбар</label>
                <textarea name="description" value={tutorialForm.description} onChange={handleTutorialInput} placeholder="Богино тайлбар..." rows="2" />
              </div>
              <button type="submit" className="submit-btn">Нэмэх</button>
            </form>

            <div className="inventory-report">
              <div className="report-header">
                <h3>📜 Нийт бичлэгүүд</h3>
              </div>
              {tutorials.length === 0 ? (
                <p className="no-data">Бичлэг байхгүй байна</p>
              ) : (
                <div className="inventory-table-wrapper">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>Гарчиг</th>
                        <th>Огноо</th>
                        <th>Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutorials.map(t => (
                        <tr key={t._id}>
                          <td>
                            <strong>{t.title}</strong>
                            {t.description && (<><br/><small>{t.description}</small></>)}
                          </td>
                          <td>{new Date(t.createdAt).toLocaleString('mn-MN')}</td>
                          <td>
                            <a href={t.videoUrl} target="_blank" rel="noreferrer" className="edit-btn" title="Үзэх">▶️</a>
                            <button onClick={() => handleDeleteTutorial(t._id)} className="delete-btn" title="Устгах">🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <footer className="footer">
        <p>© 2026.Oyu online delguur. Зохиогчийн бүх эрх хуулиар хамгаалагдсан болно.</p>
      </footer>
    </div>
  );
}

export default AdminPanel;
