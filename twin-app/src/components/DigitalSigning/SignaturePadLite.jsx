import React, { useEffect, useMemo, useRef, useState } from 'react';

const TYPED_STYLES = [
  { label: 'Script', fontFamily: '"Brush Script MT", "Segoe Script", cursive', fontStyle: 'normal' },
  { label: 'Serif Italic', fontFamily: '"Times New Roman", serif', fontStyle: 'italic' },
  { label: 'Classic', fontFamily: 'Georgia, serif', fontStyle: 'italic' },
];

function useCanvasSetup(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2.6;
    context.strokeStyle = '#10283f';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);
  }, [canvasRef]);
}

export default function SignaturePadLite({ onSignature, disabled = false }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [mode, setMode] = useState('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [hasDrawing, setHasDrawing] = useState(false);

  useCanvasSetup(canvasRef);

  const typedPreview = useMemo(() => typedName.trim(), [typedName]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event.changedTouches?.[0] || event;
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    };
  };

  const beginStroke = (event) => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;

    drawingRef.current = true;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    setHasDrawing(true);
  };

  const moveStroke = (event) => {
    if (!drawingRef.current || mode !== 'draw') return;
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;

    const context = canvas.getContext('2d');
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const endStroke = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);
    setHasDrawing(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setUploadedImage(loadEvent.target?.result || null);
    };
    reader.readAsDataURL(file);
  };

  const getSignatureData = () => {
    if (mode === 'draw') {
      if (!hasDrawing || !canvasRef.current) return null;
      return {
        type: 'draw',
        data: canvasRef.current.toDataURL('image/png'),
        typed_name: null,
        font_style: null,
      };
    }

    if (mode === 'typed') {
      if (!typedPreview) return null;
      return {
        type: 'typed',
        data: null,
        typed_name: typedPreview,
        font_style: String(selectedStyle),
      };
    }

    if (mode === 'upload') {
      if (!uploadedImage) return null;
      return {
        type: 'upload',
        data: uploadedImage,
        typed_name: null,
        font_style: null,
      };
    }

    return null;
  };

  const handleConfirm = () => {
    const signature = getSignatureData();
    if (!signature) return;
    onSignature(signature);
  };

  return (
    <div className="signing-signature-pad">
      <div className="signing-tabs">
        {['draw', 'typed', 'upload'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`signing-tab ${mode === tab ? 'active' : ''}`}
            onClick={() => setMode(tab)}
          >
            {tab === 'draw' ? 'Draw' : tab === 'typed' ? 'Type' : 'Upload'}
          </button>
        ))}
      </div>

      {mode === 'draw' && (
        <div className="signing-signature-mode">
          <div className="signing-canvas-wrap">
            <canvas
              ref={canvasRef}
              className="signing-canvas"
              onMouseDown={beginStroke}
              onMouseMove={moveStroke}
              onMouseUp={endStroke}
              onMouseLeave={endStroke}
              onTouchStart={beginStroke}
              onTouchMove={moveStroke}
              onTouchEnd={endStroke}
            />
          </div>
          <div className="signing-signature-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearCanvas}>
              Clear
            </button>
            <span className="signing-help-text">Draw your signature with a mouse, stylus, or touch.</span>
          </div>
        </div>
      )}

      {mode === 'typed' && (
        <div className="signing-signature-mode">
          <label className="form-label">Typed signature</label>
          <input
            className="input-field"
            placeholder="Type your legal name..."
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
          />

          {typedPreview && (
            <div className="signing-typed-grid">
              {TYPED_STYLES.map((style, index) => (
                <button
                  key={style.label}
                  type="button"
                  className={`signing-typed-option ${selectedStyle === index ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(index)}
                >
                  <span
                    className="signing-typed-preview"
                    style={{ fontFamily: style.fontFamily, fontStyle: style.fontStyle }}
                  >
                    {typedPreview}
                  </span>
                  <span className="signing-typed-label">{style.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'upload' && (
        <div className="signing-signature-mode">
          {!uploadedImage ? (
            <label className="signing-upload-box">
              <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
              <span className="signing-upload-icon">Upload</span>
              <strong>Upload a signature image</strong>
              <span>PNG with transparent background is recommended.</span>
            </label>
          ) : (
            <div className="signing-upload-preview">
              <img src={uploadedImage} alt="Uploaded signature" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUploadedImage(null)}>
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      <div className="signing-signature-footer">
        <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={disabled}>
          Confirm Signature
        </button>
      </div>
    </div>
  );
}
