import React, { useEffect, useRef, useState } from 'react';

function Recorder({ onUploaded }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [fileBlob, setFileBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [useFileCapture, setUseFileCapture] = useState(false);
  const [config, setConfig] = useState({ cloudinaryEnabled: false });

  const pickSupportedMimeType = () => {
    if (typeof window === 'undefined' || !window.MediaRecorder) return null;
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4',
    ];
    for (const t of candidates) {
      try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {}
    }
    return null;
  };
  const mimeType = pickSupportedMimeType();

  useEffect(() => {
    // Load server config for upload strategy
    (async () => {
      try {
        const res = await fetch('https://oyushop-1.onrender.com/api/config');
        const data = await res.json();
        setConfig({ cloudinaryEnabled: !!data.cloudinaryEnabled });
      } catch {}
    })();
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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setUseFileCapture(true);
        return;
      }
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
      if (!window.MediaRecorder || !mimeType) {
        // iOS Safari older versions: fallback to file capture
        setUseFileCapture(true);
      }
    } catch (e) {
      // If camera cannot open, use file capture fallback
      setUseFileCapture(true);
      setError('Камер/микрофон нээхэд алдаа гарлаа');
    }
  };

  const startRecording = () => {
    if (!stream || !window.MediaRecorder || !mimeType) return;
    const mr = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mr;
    setChunks([]);
    setFileBlob(null);
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        setChunks(prev => [...prev, e.data]);
      }
    };
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setFileBlob(blob);
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
    const blobToSend = fileBlob || (chunks.length ? new Blob(chunks, { type: mimeType || 'video/webm' }) : null);
    if (!blobToSend) return;
    setUploading(true);
    try {
      const ext = (mimeType && mimeType.includes('mp4')) ? 'mp4' : 'webm';
      const filename = `recording-${Date.now()}.${ext}`;
      const fd = new FormData();
      fd.append('video', blobToSend, filename);
      const res = await fetch('https://oyushop-1.onrender.com/api/upload/video', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        onUploaded && onUploaded(data.url);
      } else {
        setError('Видео илгээхэд алдаа гарлаа');
      }
    } catch (e) {
      setError('Видео илгээхэд алдаа гарлаа');
    } finally {
      setUploading(false);
    }
  };

  const onFileSelected = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      setError('Видео файл сонгоно уу');
      return;
    }
    setError('');
    setFileBlob(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  return (
    <div className="recorder">
      <div className="recorder-row">
        {!stream && !useFileCapture && (
          <button type="button" onClick={startCamera} className="recorder-btn">📷 Камер асаах</button>
        )}
        {stream && !useFileCapture && (
          <video ref={videoRef} className="recorder-video" muted playsInline autoPlay />
        )}
        {useFileCapture && (
          <label className="recorder-btn">
            📹 Видео сонгох/бичих
            <input type="file" accept="video/*" capture="user" onChange={onFileSelected} style={{ display: 'none' }} />
          </label>
        )}
        {error && <span className="recorder-error">{error}</span>}
      </div>
      {(stream || useFileCapture) && (
        <div className="recorder-controls">
          {!useFileCapture && !recording ? (
            <button type="button" onClick={startRecording} className="recorder-btn">⏺️ Бичлэг эхлүүлэх</button>
          ) : null}
          {!useFileCapture && recording ? (
            <button type="button" onClick={stopRecording} className="recorder-btn stop">⏹️ Дуусгах</button>
          ) : null}
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
