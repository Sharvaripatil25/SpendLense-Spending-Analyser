import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadCSV, loadSample } from '../utils/api';
import { useData } from '../App';
import './Upload.css';

export default function Upload() {
  const { setData } = useData();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');

  async function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setError('Please upload a CSV file.'); return; }
    setLoading(true); setError('');
    setLoadMsg('Sending to Python backend…');
    try {
      setLoadMsg('pandas is parsing your CSV…');
      const result = await uploadCSV(file);
      setLoadMsg('Running scipy anomaly detection…');
      await new Promise(r => setTimeout(r, 300));
      setData({ ...result, fileName: file.name });
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function handleSample() {
    setLoading(true); setError('');
    setLoadMsg('Generating sample data in Python…');
    try {
      const result = await loadSample();
      setData({ ...result, fileName: 'sample_data.csv' });
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="upload-page">
      <div className="upload-bg-shape" />
      <div className="upload-bg-shape2" />
      <div className="upload-center">
        <div className="upload-header fade-up">
          <div className="brand">
            <span className="brand-icon">◈</span>
            <span className="brand-name">SpendLens</span>
          </div>
          <h1 className="upload-title">Understand where your <em>money goes</em></h1>
          <p className="upload-sub">Upload your bank statement CSV — analysed instantly with pandas, numpy &amp; scipy.</p>
        </div>

        <div
          className={`dropzone ${dragging ? 'dragging' : ''} fade-up`}
          style={{ animationDelay: '0.1s' }}
          onClick={() => !loading && fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          {loading
            ? <div className="upload-loading">
                <div className="spinner" />
                <p className="load-msg">{loadMsg}</p>
                <p className="load-sub">Flask · pandas running on port 8000</p>
              </div>
            : <>
                <div className="drop-icon">⬆</div>
                <p className="drop-primary">Drop your CSV here</p>
                <p className="drop-secondary">or click to browse files</p>
                {error && <p className="drop-error">⚠ {error}</p>}
              </>}
        </div>

        <div className="upload-divider fade-up" style={{ animationDelay: '0.2s' }}><span>or try a demo</span></div>

        <button className="sample-btn fade-up" style={{ animationDelay: '0.25s' }} onClick={handleSample} disabled={loading}>
          Load sample bank statement →
        </button>

        

        <div className="format-guide fade-up" style={{ animationDelay: '0.35s' }}>
          <p className="format-title">CSV Format — Auto Detected</p>
          <div className="format-cols">
            <div><strong style={{color:'var(--text)'}}>Required columns</strong><br />Date, Description / Narration, Debit / Credit / Amount</div>
            <div><strong style={{color:'var(--text)'}}>Supported banks</strong><br />SBI, HDFC, ICICI, Axis, Kotak, PhonePe, GPay, Paytm</div>
          </div>
        </div>
      </div>
    </div>
  );
}
