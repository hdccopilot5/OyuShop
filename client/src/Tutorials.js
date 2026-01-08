import React, { useEffect, useState } from 'react';

function Tutorials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://oyushop.onrender.com/api/tutorials');
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{padding: 20}}>Ачаалж байна...</div>;

  return (
    <div style={{maxWidth: 1000, margin: '0 auto', padding: 20}}>
      <h2>🎬 Заавар бичлэг</h2>
      {items.length === 0 ? (
        <p>Одоогоор заавар бичлэг байхгүй байна.</p>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 16}}>
          {items.map((t) => (
            <div key={t._id} style={{background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}}>
              <h3 style={{margin: '0 0 8px'}}>{t.title}</h3>
              {t.description && <p style={{marginTop: 0, color: '#555'}}>{t.description}</p>}
              <video src={t.videoUrl} controls style={{width: '100%', borderRadius: 8, background: '#000'}} />
              <small style={{color: '#777'}}>Нэмэгдсэн: {new Date(t.createdAt).toLocaleString('mn-MN')}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Tutorials;
