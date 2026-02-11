import React, { useState, useEffect } from 'react';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState({
    apiKey: '',
    baseUrl: '',
    modelId: 'gemini-1.5-flash'
  });

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customModelId, setCustomModelId] = useState('');
  const defaultModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'seedream4'];

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('gemini_api_key') || '';
      const savedUrl = localStorage.getItem('gemini_base_url') || '';
      const savedId = localStorage.getItem('gemini_model_id') || 'gemini-1.5-flash';
      setConfig({ apiKey: savedKey, baseUrl: savedUrl, modelId: savedId });

      if (!defaultModels.includes(savedId)) {
        setShowCustomInput(true);
        setCustomModelId(savedId);
      } else {
        setShowCustomInput(false);
        setCustomModelId('');
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    const cleanKey = config.apiKey.replace(/[^\x20-\x7E]/g, "").trim();
    const cleanUrl = config.baseUrl.replace(/[^\x20-\x7E]/g, "").trim();
    const finalModelId = showCustomInput ? customModelId.trim() : config.modelId;

    localStorage.setItem('gemini_api_key', cleanKey);
    localStorage.setItem('gemini_base_url', cleanUrl);
    localStorage.setItem('gemini_model_id', finalModelId);
    
    // 【核心修复】保存后仅执行关闭，不执行 reload，彻底解决灰屏问题
    onClose(); 
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
    }} onClick={onClose}>
      <div 
        style={{
          backgroundColor: '#111', padding: '40px', borderRadius: '24px',
          width: '450px', border: '1px solid #333',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: '30px', borderLeft: '4px solid #fff', paddingLeft: '15px' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 900, margin: 0, letterSpacing: '2px' }}>ENGINE SETUP</h2>
          <p style={{ color: '#666', fontSize: '10px', marginTop: '5px', fontWeight: 'bold' }}>配置保存后将立即生效</p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#888', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>API KEY</label>
          <input 
            type="password" value={config.apiKey}
            onChange={e => setConfig({...config, apiKey: e.target.value})}
            style={{ width: '100%', padding: '12px', backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#888', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>BASE URL</label>
          <input 
            type="text" value={config.baseUrl}
            onChange={e => setConfig({...config, baseUrl: e.target.value})}
            style={{ width: '100%', padding: '12px', backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#888', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>SELECT MODEL</label>
          <select 
            value={showCustomInput ? 'custom' : config.modelId}
            onChange={e => {
              if (e.target.value === 'custom') setShowCustomInput(true);
              else { setShowCustomInput(false); setConfig({...config, modelId: e.target.value}); }
            }}
            style={{ width: '100%', padding: '12px', backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
          >
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="seedream4">Seedream 4</option>
            <option value="custom">── 手动输入自定义 ID ──</option>
          </select>
        </div>

        {showCustomInput && (
          <div style={{ marginBottom: '30px' }}>
            <label style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>ENTER CUSTOM MODEL ID</label>
            <input 
              type="text" value={customModelId}
              onChange={e => setCustomModelId(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px', color: '#00ffcc' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={handleSave} style={{ flex: 1, padding: '14px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>SAVE CONFIG</button>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', backgroundColor: 'transparent', color: '#fff', border: '1px solid #333', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
};