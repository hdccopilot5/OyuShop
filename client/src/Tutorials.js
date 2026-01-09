import React, { useState, useEffect } from 'react';
import './Tutorials.css';

function Tutorials({ isAdmin = false, onEdit = null }) {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [config, setConfig] = useState({ cloudinaryEnabled: false });
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [videoFileName, setVideoFileName] = useState('');

  useEffect(() => {
    fetchTutorials();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('https://oyushop-1.onrender.com/api/config');
      const data = await res.json();
      setConfig({ cloudinaryEnabled: !!data.cloudinaryEnabled });
    } catch (err) {
      console.error('Config алдаа:', err);
    }
  };

  const fetchTutorials = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://oyushop-1.onrender.com/api/tutorials');
      const data = await res.json();
      console.log('Tutorials loaded:', data);
      setTutorials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Заавар уншиж чадсангүй:', err);
      setTutorials([]);
    } finally {
      setLoading(false);
    }
  };

  const authHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setMessage('❌ Видео файл сонгоно уу');
      return;
    }

    setVideoFile(file);
    setVideoFileName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !videoFile) {
      setMessage('❌ Гарчиг болон видео файл шаардлагатай');
      return;
    }

    try {
      let videoUrl = '';

      if (config.cloudinaryEnabled && window.cloudinary && window.cloudinary.openUploadWidget) {
        // Cloudinary widget ашигла
        const widget = window.cloudinary.openUploadWidget(
          {
            cloudName: 'dbpzliwb',
            uploadPreset: 'unsigned_preset',
            resourceType: 'video',
            multiple: false,
            cropping: false,
            folder: 'tutorials'
          },
          (error, result) => {
            if (result && result.event === 'success') {
              videoUrl = result.info.secure_url;
              saveTutorialToServer(videoUrl);
            } else if (error) {
              setMessage('❌ Видео илгээхэд алдаа');
            }
          }
        );
        // Widget нээх
        if (widget && widget.open) {
          widget.open();
        }
      } else {
        // Fallback: Server хэмжээ upload
        const fd = new FormData();
        fd.append('video', videoFile);

        const uploadRes = await fetch('https://oyushop-1.onrender.com/api/upload/video', {
          method: 'POST',
          headers: {
            ...authHeaders()
          },
          body: fd
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          setMessage('❌ Видео илгээхэд алдаа');
          return;
        }

        videoUrl = uploadData.url;
        saveTutorialToServer(videoUrl);
      }
    } catch (err) {
      console.error('Upload алдаа:', err);
      setMessage('❌ Видео илгээхэд алдаа гарлаа');
    }
  };

  const saveTutorialToServer = async (videoUrl) => {
    try {
      const res = await fetch('https://oyushop-1.onrender.com/api/tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          videoUrl
        })
      });

      const data = await res.json();
      if (data.success || data.tutorial) {
        setMessage('✅ Заавар бичлэг нэмэгдлээ');
        setFormData({ title: '', description: '' });
        setVideoFile(null);
        setVideoFileName('');
        setShowForm(false);
        fetchTutorials();
      } else {
        setMessage('❌ ' + (data.message || 'Алдаа'));
      }
    } catch (err) {
      console.error('Save алдаа:', err);
      setMessage('❌ Алдаа гарлаа');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Энэ бичлэгийг устгах уу?')) return;

    try {
      const res = await fetch(`https://oyushop-1.onrender.com/api/tutorials/${id}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders()
        }
      });

      if (res.ok) {
        setMessage('✅ Устгагдлаа');
        fetchTutorials();
      } else {
        setMessage('❌ Устгалт амжилтгүй');
      }
    } catch (err) {
      console.error('Delete алдаа:', err);
      setMessage('❌ Алдаа гарлаа');
    }
  };

  return (
    <div className="tutorials-container">
      {isAdmin && (
        <div className="tutorial-form-section">
          <div className="tutorial-form-header">
            <h2>📹 Заавар бичлэг нэмэх</h2>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="toggle-form-btn"
            >
              {showForm ? '▲ Хаах' : '▼ Нээх'}
            </button>
          </div>

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="tutorial-form">
              <div className="form-group">
                <label>Гарчиг *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Жишээ нь: Хүүхдийн нөөрдөгийг хэрхэн ашиглах"
                  required
                />
              </div>

              <div className="form-group">
                <label>Тайлбар</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Заавар бичлэгийн дэлгэрэнгүй тайлбар"
                />
              </div>

              <div className="form-group">
                <label>Видео файл *</label>
                <label className="file-input-label">
                  📹 Видео сонгох
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    required
                  />
                </label>
                {videoFileName && (
                  <div className="file-name">✓ Сонгосон: {videoFileName}</div>
                )}
              </div>

              <div className="form-buttons">
                <button type="submit" className="submit-btn">
                  ⬆️ Илгээх
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ title: '', description: '' });
                    setVideoFile(null);
                    setVideoFileName('');
                  }}
                  className="cancel-btn"
                >
                  ✕ Цуцлах
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="tutorials-header">
        <button 
          onClick={() => window.location.href = '/'} 
          className="back-btn"
          title="Буцах"
        >
          ← Буцах
        </button>
        <h1>📚 Заавар бичлэгүүд</h1>
      </div>

      {loading ? (
        <div className="loading-tutorials">
          <p>Заавар уншиж байна...</p>
        </div>
      ) : tutorials.length === 0 ? (
        <div className="no-tutorials">
          <p>Заавар бичлэг байхгүй</p>
        </div>
      ) : (
        <div className="tutorials-grid">
          {tutorials.map(tutorial => (
            <div key={tutorial._id} className="tutorial-card">
              <div className="tutorial-video-wrapper">
                <video controls preload="metadata" crossOrigin="anonymous">
                  <source src={tutorial.videoUrl} type="video/mp4" />
                  Таны браузер видео ойлгодоггүй
                </video>
              </div>
              <div className="tutorial-info">
                <h3>{tutorial.title}</h3>
                {tutorial.description && <p>{tutorial.description}</p>}
                <div className="tutorial-date">
                  {tutorial.createdAt
                    ? new Date(tutorial.createdAt).toLocaleDateString('mn-MN')
                    : ''}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(tutorial._id)}
                    className="tutorial-delete-btn"
                  >
                    🗑️ Устгах
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Tutorials;
