import React, { useEffect, useRef, useState } from 'react';

function Recorder({ onUploaded }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [previewUrl, stream]);

  const startCamera = async () => {
    setError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
    } catch (e) {
      setError('Камер/микрофон нээхэд алдаа гарлаа');
    }
  };

  const startRecording = () => {
    if (!stream) return;
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    setChunks([]);
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        setChunks(prev => [...prev, e.data]);
      }
    };
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    };
    mr.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadVideo = async () => {
    if (!chunks.length) return;
    setUploading(true);
    try {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const fd = new FormData();
      fd.append('video', blob, `recording-${Date.now()}.webm`);
      const res = await fetch('https://oyushop.onrender.com/api/upload/video', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.success && data.url) {
        onUploaded && onUploaded(data.url);
      }
    } catch (e) {
      setError('Видео илгээхэд алдаа гарлаа');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="recorder">
      <div className="recorder-row">
        {!stream ? (
          <button type="button" onClick={startCamera} className="recorder-btn">📷 Камер асаах</button>
        ) : (
          <video ref={videoRef} className="recorder-video" muted playsInline />
        )}
        {error && <span className="recorder-error">{error}</span>}
      </div>
      {stream && (
        <div className="recorder-controls">
          {!recording ? (
            <button type="button" onClick={startRecording} className="recorder-btn">⏺️ Бичлэг эхлүүлэх</button>
          ) : (
            <button type="button" onClick={stopRecording} className="recorder-btn stop">⏹️ Дуусгах</button>
          )}
          {previewUrl && (
            <>
              <video src={previewUrl} controls className="recorder-preview" />
              <button type="button" onClick={uploadVideo} className="recorder-btn" disabled={uploading}>
                {uploading ? 'Илгээж байна...' : '⬆️ Сервер рүү илгээх'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Recorder;
