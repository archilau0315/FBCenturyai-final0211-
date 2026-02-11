
import React, { useState, useCallback, useRef, useEffect } from 'react';
import HardwareLock from './components/HardwareLock';
import { SettingsModal } from './components/SettingsModal';
import { 
  ArchitecturePrompt, 
  GenerationResult, 
  DeviceStatus,
  PresetItem,
  ChatMessage,
  GroundingSource
} from './types';
import { GeminiService } from './services/geminiService';
import { authService } from './services/authService';
import { PRESETS, ENGINE_MODELS as DEFAULT_MODELS, EngineModel } from './constants';
import './App.css';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const FormattedText: React.FC<{ text: string; theme: 'white' | 'professional'; isUser?: boolean }> = ({ text, theme, isUser }) => {
  if (!text) return null;
  const isDark = theme === 'professional';
  const textColor = isUser ? 'text-black font-medium' : (isDark ? 'text-neutral-300' : 'text-neutral-800');
  
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return (
    <div className={`whitespace-pre-wrap font-sans leading-relaxed tracking-wide ${textColor}`}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const useDarkStyle = isUser ? false : isDark;
          return (
            <strong key={i} className={`font-black px-1 rounded mx-0.5 ${
              useDarkStyle ? 'text-white bg-white/10' : 'text-black bg-black/5'
            }`}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          const useDarkStyle = isUser ? false : isDark;
          return (
            <strong key={i} className={`font-bold mx-0.5 border-b ${
              useDarkStyle ? 'text-white border-white/30' : 'text-black border-black/20'
            }`}>
              {part.slice(1, -1)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [logo, setLogo] = useState<string | null>(() => {
    return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
      ? 'http://127.0.0.1:8000/api/logo' 
      : 'logo.png';
  });
  const [theme, setTheme] = useState<'white' | 'professional'>('professional');
  const [showModelModal, setShowModelModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPresetPanel, setShowPresetPanel] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [models, setModels] = useState<EngineModel[]>(() => {
    const saved = localStorage.getItem('FBC_MODELS');
    if (saved) {
      const parsed = JSON.parse(saved) as EngineModel[];
      const merged = [...DEFAULT_MODELS];
      parsed.forEach(p => {
        if (!merged.find(m => m.id === p.id)) merged.push(p);
        else {
          const target = merged.find(m => m.id === p.id);
          if (target) {
            target.name = p.name || target.name;
            target.baseUrl = p.baseUrl;
            target.customApiKey = p.customApiKey;
            target.endpointId = p.endpointId;
          }
        }
      });
      return merged;
    }
    return DEFAULT_MODELS;
  });

  const [activeModelId, setActiveModelId] = useState(() => {
    const pro = models.find(m => m.id.includes('pro'));
    const flash = models.find(m => m.id.includes('flash'));
    const nano = models.find(m => m.id.includes('2.5'));
    return pro?.id || flash?.id || nano?.id || DEFAULT_MODELS[0].id;
  });

  const [editingModel, setEditingModel] = useState<EngineModel | null>(null);
  const [activeTab, setActiveTab] = useState<'prompt' | 'chat'>('prompt');
  
  const [promptInput, setPromptInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [renderFiles, setRenderFiles] = useState<{ name: string; data: string; type: string; ratio?: string }[]>([]);
  const [chatFiles, setChatFiles] = useState<{ name: string; data: string; type: string; ratio?: string }[]>([]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderLockedRatio, setRenderLockedRatio] = useState<string>('1:1');

  const gemini = useRef(new GeminiService());
  const abortControllerRef = useRef<AbortController | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const status = await authService.checkPersistence();
      if (status) setDevice(status);
      setIsInitializing(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem('FBC_MODELS', JSON.stringify(models));
  }, [models]);

  useEffect(() => {
    if (!models.find(m => m.id === activeModelId)) {
      const fallback = models[0]?.id || DEFAULT_MODELS[0].id;
      setActiveModelId(fallback);
    }
  }, [models, activeModelId]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeModel = models.find(m => m.id === activeModelId) || models[0];
  const handleVerify = useCallback((status: DeviceStatus) => setDevice(status), []);

  const handleExportReport = () => {
    if (messages.length === 0) return;
    let md = `# 方标世纪AI 建筑创意实验室方案简报\n\n`;
    md += `**生成时间:** ${new Date().toLocaleString()}\n`;
    md += `**设备 ID:** ${device?.deviceId}\n\n---\n\n`;
    messages.forEach(msg => {
      const role = msg.role === 'user' ? '## 用户请求' : '## AI 首席建筑师建议';
      md += `${role}\n\n${msg.content}\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `FBC-REPORT-${Date.now()}.md`; a.click();
  };

  const calculateRatio = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const r = img.width / img.height;
        if (r > 1.4) resolve('16:9');
        else if (r > 1.1) resolve('4:3');
        else if (r < 0.7) resolve('9:16');
        else if (r < 0.9) resolve('3:4');
        else resolve('1:1');
      };
      img.onerror = () => resolve('1:1');
      img.src = base64;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result;
        if (typeof result === 'string') {
          const newFile = { name: file.name, data: result, type: file.type || 'application/octet-stream' };
          if (activeTab === 'prompt') {
            if (file.type.startsWith('image/')) {
              const detectedRatio = await calculateRatio(result);
              setRenderLockedRatio(detectedRatio);
              setRenderFiles(prev => [...prev, { ...newFile, ratio: detectedRatio }]);
            } else {
              setRenderFiles(prev => [...prev, newFile]);
            }
          } else {
            setChatFiles(prev => [...prev, newFile]);
          }
        }
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const handleSaveImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url; link.download = `FBC-ARCH-${id}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const deleteModel = useCallback((id: string) => {
    if (DEFAULT_MODELS.some(baseModel => baseModel.id === id)) {
      alert("官方核心节点受系统保护。"); return;
    }
    setModels(prev => prev.filter(m => m.id !== id));
    if (editingModel?.id === id) setEditingModel(null);
  }, [editingModel]);

  const addNewModel = () => {
    const newId = `node-${Math.random().toString(36).substr(2, 9)}`;
    const newModel: EngineModel = { id: newId, endpointId: '', name: 'NEW_ENGINE_NODE', version: 'v1.0.0', capabilities: ['Remote'], description: 'Custom engine node.', latency: 'Mid' };
    setModels(prev => [...prev, newModel]); setEditingModel(newModel);
  };

  const saveModelChange = () => {
    if (editingModel) {
      setModels(prev => prev.map(m => m.id === editingModel.id ? editingModel : m));
      setEditingModel(null);
    }
  };

  const executeFlow = async () => {
    if (isProcessing) {
      abortControllerRef.current?.abort();
      setIsProcessing(false);
      return;
    }

    const input = activeTab === 'prompt' ? promptInput : chatInput;
    const currentFiles = activeTab === 'prompt' ? renderFiles : chatFiles;
    if (!input && currentFiles.length === 0) return;
    
    setIsProcessing(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const gApiKey = localStorage.getItem('gemini_api_key');
    const gBaseUrl = localStorage.getItem('gemini_base_url');
    const gModelId = localStorage.getItem('gemini_model_id');

    const modelOptions = {
      apiKey: gApiKey || activeModel.customApiKey,
      baseUrl: gBaseUrl || activeModel.baseUrl,
      modelId: gModelId || activeModel.endpointId || activeModel.id,
      signal
    };

    try {
      const imageRefs = currentFiles.filter(f => f.type.startsWith('image/')).map(f => f.data);
      if (activeTab === 'prompt') {
        let brainModel = activeModel.capabilities.includes('Logic') || activeModel.capabilities.includes('Pro')
          ? activeModel
          : models.find(m => m.capabilities.includes('Logic') || m.capabilities.includes('Pro'));

        const brainOptions = brainModel ? {
          apiKey: gApiKey || brainModel.customApiKey,
          baseUrl: gBaseUrl || brainModel.baseUrl,
          modelId: gModelId || brainModel.endpointId || brainModel.id,
          signal
        } : modelOptions;

        let optimized: ArchitecturePrompt;
        try {
          const brainInput = input || (imageRefs.length > 0 ? "基于此建筑草图深化方案" : "Modern Architecture");
          optimized = await gemini.current.optimizePrompt(brainInput, imageRefs[0] || "", brainOptions);
          
          if (imageRefs.length > 0) {
            optimized.english = `STRICTLY FOLLOW THE GEOMETRY OF THE PROVIDED SKETCH. ${optimized.english}`;
          }
        } catch (err: any) {
          if (err.name === 'AbortError') throw err;
          optimized = { chinese: input, english: "Advanced architectural visualization, professional render style, detailed materiality.", metadata: { material: "Custom", perspective: "Eye-level", lighting: "Natural" } } as any;
        }
        
        const imageUrl = await gemini.current.generateVisual(optimized.english, {
          aspectRatio: renderLockedRatio as any,
          images: imageRefs,
          ...modelOptions,
          modelId: modelOptions.modelId
        });
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant', type: 'generation',
          content: {
            id: Math.random().toString(36).substr(2, 6).toUpperCase(),
            imageUrl,
            prompt: optimized.english, 
            metadata: optimized.metadata,
            timestamp: Date.now()
          },
          timestamp: Date.now()
        }]);
      } else {
        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          type: 'text',
          content: input || (imageRefs.length > 0 ? "[图像参考上传]" : ""),
          refs: [...currentFiles], 
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setChatInput(''); 
        setChatFiles([]); 

        const response = await gemini.current.askArchitect(input, imageRefs, modelOptions);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant', type: 'text', content: response.text, timestamp: Date.now()
        }]);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant', type: 'text', content: `LOGIC_FAULT: ${e.message}`, timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); executeFlow(); }
  };

  if (isInitializing) return <div className="fixed inset-0 bg-black flex items-center justify-center font-mono text-white animate-pulse uppercase tracking-[0.4em]">Synchronizing...</div>;
  if (!device) return <HardwareLock onVerify={handleVerify} />;

  return (
    <div className={`flex h-screen font-sans transition-all duration-500 ${theme === 'professional' ? 'bg-[#050505] text-neutral-300' : 'bg-[#fcfcfc] text-neutral-900'}`}>
      <aside className={`w-80 border-r flex flex-col p-8 space-y-10 shrink-0 z-50 ${theme === 'professional' ? 'bg-[#0a0a0a] border-neutral-900' : 'bg-[#fafafa] border-neutral-100'}`}>
        <div className="space-y-6">
          <div className={`w-[100px] h-[50px] mx-auto flex items-center justify-center cursor-pointer border overflow-hidden rounded ${theme === 'professional' ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-200 border-neutral-300'}`} onClick={() => logoInputRef.current?.click()}>
            {logo ? <img src={logo} onError={() => setLogo(null)} className="w-full h-full object-contain" /> : <span className="text-[10px] text-neutral-500 font-mono font-bold tracking-widest uppercase">Logo</span>}
            <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => setLogo(ev.target?.result as string);
                reader.readAsDataURL(file as Blob);
              }
            }} />
          </div>
          <div className="space-y-1 text-center">
            <h2 className={`text-[14px] font-bold leading-tight tracking-tighter ${theme === 'professional' ? 'text-white' : 'text-neutral-800'}`}>天津方标世纪规划建筑设计有限公司</h2>
            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest opacity-60 font-mono">ARCHITECTS & CONSULTING ENGINEERS</p>
          </div>
          <div className="pt-2 text-center"><h1 className={`text-4xl font-black tracking-tighter ${theme === 'professional' ? 'text-white' : 'text-black'}`}>建筑创意实验室</h1></div>
        </div>
        <div className="space-y-2 text-[11px] text-neutral-500 font-medium uppercase tracking-wider text-center">
          <p>作者 (Author): <span className={theme === 'professional' ? 'text-white' : 'text-black'}>刘珂(Archilau)</span></p>
          <p className="leading-tight opacity-70">CORE SYSTEM V1.7.0</p>
          <button onClick={() => { if(confirm('确定退出授权？')) { authService.clearLicense(); setDevice(null); } }} className="mt-1 text-[8px] font-mono text-neutral-600 hover:text-red-500 transition-colors uppercase tracking-widest border-b border-transparent hover:border-red-500/50">[ Reset License ]</button>
        </div>
        <div className="space-y-4 pt-4 border-t border-neutral-200/30">
          <button onClick={() => setShowModelModal(true)} className={`w-full text-left py-4 px-5 rounded-lg border text-[13px] font-bold transition-all shadow-sm ${theme === 'professional' ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200 hover:border-black'}`}>加载引擎集群 Engine Cluster <span className="float-right opacity-30">→</span></button>
          <button onClick={() => setTheme(prev => prev === 'white' ? 'professional' : 'white')} className={`w-full text-left py-4 px-5 rounded-lg border text-[13px] font-bold flex items-center justify-between shadow-sm ${theme === 'professional' ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200 hover:border-black'}`}>配色切换 Theme Switch <div className={`w-4 h-4 rounded-full border border-neutral-300 ${theme === 'professional' ? 'bg-white' : 'bg-black'}`}></div></button>
        </div>
        <div className="mt-auto pt-6 border-t border-neutral-200/10 space-y-4">
          <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-500 ${theme === 'professional' ? 'bg-neutral-900 border-white/5' : 'bg-neutral-50 border-neutral-100'}`}>
            <div className={`relative w-3 h-3 rounded-full shrink-0 ${isProcessing ? 'bg-amber-500' : 'bg-emerald-500'}`}><div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${isProcessing ? 'bg-amber-400' : 'bg-emerald-400'}`}></div></div>
            <div className="flex flex-col overflow-hidden">
              <span className={`text-[10px] font-black uppercase tracking-widest truncate ${theme === 'professional' ? 'text-white' : 'text-neutral-900'}`}>
                {localStorage.getItem('gemini_model_id') || activeModel.name}
              </span>
              <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter">{isProcessing ? 'SYNTHESIZING...' : 'CORE LOGIC SYNCED'}</span>
            </div>
          </div>
          <div className="text-[9px] text-neutral-400 font-mono uppercase tracking-[0.2em] text-center opacity-40">© 2025 FBC ARCHITECTS</div>
        </div>
      </aside>

      <main className={`flex-grow flex flex-col overflow-hidden relative ${theme === 'professional' ? 'arch-grid-dark' : 'arch-grid'}`}>
        {zoomedImage && <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}><img src={zoomedImage} className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95" /></div>}
        
        <header className="absolute top-8 right-8 z-40 flex gap-4">
          <button onClick={() => setIsSettingsOpen(true)} className="group flex items-center justify-center w-[42px] h-[42px] rounded-full border border-neutral-800 text-neutral-500 transition-all hover:bg-white hover:text-black hover:border-white shadow-xl bg-black/40 backdrop-blur-md" title="配置中心">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
          <button onClick={handleExportReport} className="group flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-800 text-neutral-500 transition-all hover:bg-white hover:text-black hover:border-white shadow-xl bg-black/40 backdrop-blur-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Export Report</span>
          </button>
          <button onClick={() => setMessages([])} className="group p-2.5 rounded-full border border-neutral-800 text-neutral-600 transition-all hover:bg-red-500 hover:text-white bg-black/40 backdrop-blur-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" strokeWidth="1.5"/></svg>
          </button>
        </header>

        <div className="flex-grow overflow-y-auto pt-16 pb-[480px] px-12 space-y-12 scrollbar-hide">
          {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-5 pointer-events-none"><h3 className="text-8xl font-black tracking-[0.6em] uppercase">Artifact</h3><p className="text-[14px] font-bold uppercase tracking-[1em]">Engine Online</p></div>}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-6`}>
              <div className="max-w-[98%] space-y-4 w-full">
                <div className={`text-[9px] font-black uppercase tracking-[0.4em] text-neutral-500 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>{msg.role === 'user' ? 'Input Stream' : 'Synthesis'}</div>
                {msg.type === 'generation' ? (
                  <div className="flex gap-8 h-[500px]">
                    <div className="flex-[2.5] relative border border-white/5 shadow-2xl rounded-2xl overflow-hidden group bg-black/40">
                      <img src={(msg.content as GenerationResult).imageUrl} className="w-full h-full object-contain cursor-zoom-in" onClick={() => setZoomedImage((msg.content as GenerationResult).imageUrl)} />
                      <button onClick={() => handleSaveImage((msg.content as GenerationResult).imageUrl, (msg.content as GenerationResult).id)} className="absolute bottom-6 right-6 p-4 bg-white text-black rounded-full opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                    <div className={`flex-[1.5] p-8 border rounded-2xl flex flex-col ${theme === 'professional' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5"><span className="text-[11px] font-black uppercase tracking-widest text-neutral-500">English Protocol</span></div>
                      <div className="flex-grow overflow-y-auto scrollbar-hide">
                        <div className="text-[13px] font-mono leading-[1.8] italic text-neutral-400 select-all space-y-4">
                          <FormattedText text={(msg.content as GenerationResult).prompt} theme={theme} />
                          
                          {(msg.content as GenerationResult).metadata && (
                            <div className="pt-6 border-t border-white/5 space-y-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Materiality</span>
                                <span className="text-[11px] font-bold text-neutral-200">{(msg.content as GenerationResult).metadata?.material}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Perspective</span>
                                <span className="text-[11px] font-bold text-neutral-200">{(msg.content as GenerationResult).metadata?.perspective}</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Lighting</span>
                                <span className="text-[11px] font-bold text-neutral-200">{(msg.content as GenerationResult).metadata?.lighting}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-8 border shadow-2xl rounded-2xl ${msg.role === 'user' ? 'bg-white text-black border-neutral-200' : (theme === 'professional' ? 'bg-neutral-900 border-neutral-800 text-neutral-200 shadow-[0_0_50px_rgba(255,255,255,0.02)]' : 'bg-white border-neutral-100 text-black')}`}>
                    <FormattedText text={msg.content as string} theme={theme} isUser={msg.role === 'user'} />
                    {msg.refs && msg.refs.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {msg.refs.map((ref, idx) => (
                          <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <img 
                              src={ref.data} 
                              className="w-full h-full object-cover cursor-pointer" 
                              onClick={() => setZoomedImage(ref.data)} 
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollEndRef} />
        </div>
        <div className="absolute bottom-10 left-0 right-0 z-30 pointer-events-none">
          <div className="max-w-[95%] mx-auto px-6 pointer-events-auto">
            <div className="mb-4 flex gap-4 overflow-x-auto scrollbar-hide px-4 py-2 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/5 min-h-[60px] items-center">
              {(activeTab === 'prompt' ? renderFiles : chatFiles).map((f, i) => (
                <div key={i} className={`relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 group`}>
                  <img src={f.data} className="w-full h-full object-cover" />
                  <button onClick={() => activeTab === 'prompt' ? setRenderFiles(prev => prev.filter((_, idx) => idx !== i)) : setChatFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">×</button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 flex items-center justify-center rounded-lg border border-dashed border-neutral-800 text-neutral-700 hover:text-white transition-all">+</button>
              <input type="file" ref={fileInputRef} multiple className="hidden" onChange={handleFileUpload} />
            </div>
            <div className={`relative pt-7 px-8 pb-3 border rounded-[2rem] backdrop-blur-[60px] shadow-2xl transition-all duration-700 ${theme === 'professional' ? 'bg-black/80 border-neutral-800' : 'bg-white/95 border-neutral-200'}`}>
              <div className="absolute top-5 left-8 flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${activeTab === 'prompt' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div><span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">{activeTab} mode</span></div>
              <div className="absolute bottom-[-1px] right-12 translate-y-full flex gap-[1px] z-50">
                <button onClick={() => setActiveTab('prompt')} className={`px-10 py-3 rounded-b-2xl border-x border-b text-[11px] font-black uppercase tracking-[0.4em] transition-all ${activeTab === 'prompt' ? 'bg-white text-black border-white shadow-2xl' : 'bg-neutral-900 text-neutral-600 border-neutral-800 hover:text-white'}`}>01_RENDER</button>
                <button onClick={() => setActiveTab('chat')} className={`px-10 py-3 rounded-b-2xl border-x border-b text-[11px] font-black uppercase tracking-[0.4em] transition-all ${activeTab === 'chat' ? 'bg-white text-black border-white shadow-2xl' : 'bg-neutral-900 text-neutral-600 border-neutral-800 hover:text-white'}`}>02_CHAT</button>
              </div>
              <div className="relative min-h-[100px] flex gap-8">
                <div className="shrink-0 pt-2 relative">
                  {activeTab === 'prompt' && (
                    <><button onClick={() => setShowPresetPanel(!showPresetPanel)} className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl border transition-all ${showPresetPanel ? 'bg-blue-600 text-white border-blue-600' : 'border-neutral-800 text-neutral-500'}`}><div className="text-[10px] font-black uppercase">Preset</div></button>
                      {showPresetPanel && (
                        <div className={`absolute bottom-full left-0 mb-8 w-[900px] backdrop-blur-3xl border rounded-[2.5rem] p-10 z-[60] shadow-2xl ${theme === 'professional' ? 'bg-neutral-950/95 border-white/10' : 'bg-white/95 border-neutral-200'}`}>
                          <button onClick={(e) => { e.stopPropagation(); setShowPresetPanel(false); }} className="absolute top-6 right-8 text-neutral-500 hover:text-white transition-all p-2 rounded-full hover:bg-white/5 group"><svg className="w-5 h-5 opacity-40 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                          <div className="grid grid-cols-6 gap-8">{Object.entries(PRESETS).map(([cat, items]) => (<div key={cat} className="space-y-4"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] border-b pb-2">{cat}</h4><div className="space-y-1 h-[300px] overflow-y-auto scrollbar-hide">{items.map(item => (<button key={item.id} onClick={() => setPromptInput(prev => prev + ' ' + item.prompt)} className="w-full text-left py-2 px-3 rounded-lg text-[11px] font-bold hover:bg-white hover:text-black transition-all truncate">{item.label}</button>))}</div></div>))}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex-grow relative">
                  <textarea value={activeTab === 'prompt' ? promptInput : chatInput} onChange={e => activeTab === 'prompt' ? setPromptInput(e.target.value) : setChatInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={activeTab === 'prompt' ? "输入建筑描述进行渲染合成..." : "咨询建筑逻辑或规范建议..."} className="w-full bg-transparent border-b border-neutral-800 py-4 pr-10 text-[15px] focus:outline-none focus:border-white transition-all h-24 scrollbar-hide resize-none" />
                  {(activeTab === 'prompt' ? promptInput : chatInput) && (
                    <button onClick={() => activeTab === 'prompt' ? setPromptInput('') : setChatInput('')} className="absolute top-2 right-2 p-1.5 rounded-full text-neutral-600 hover:text-white hover:bg-white/5 transition-all group" title="清空输入"><svg className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                  )}
                </div>
                <button onClick={executeFlow} className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all shadow-2xl shrink-0 ${isProcessing ? 'bg-neutral-900 border border-neutral-800' : 'bg-white text-black hover:scale-105'}`}>
                  {isProcessing ? (<div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>) : (<><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="text-[9px] font-black uppercase mt-1 tracking-widest">{activeTab === 'prompt' ? 'Render' : 'Chat'}</span></>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {showModelModal && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-12 backdrop-blur-3xl" onClick={() => setShowModelModal(false)}>
          <div className="w-full max-w-4xl bg-neutral-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-10 border-b border-white/5 flex justify-between items-center"><h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-white">Engine Cluster Management</h2><button onClick={() => setIsEditMode(!isEditMode)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${isEditMode ? 'bg-blue-600 text-white' : 'bg-white/5 text-neutral-500 hover:text-white'}`}>{isEditMode ? '[ Viewing Mode ]' : '[ Edit Cluster ]'}</button></div>
            <div className="flex h-[60vh]">
              <div className="flex-[1.5] border-r border-white/5 p-8 space-y-4 overflow-y-auto scrollbar-hide">
                {models.map((m) => (
                  <div key={m.id} onClick={() => isEditMode ? setEditingModel(m) : setActiveModelId(m.id)} className={`relative p-6 border rounded-2xl transition-all flex flex-col gap-4 cursor-pointer ${activeModelId === m.id && !isEditMode ? 'bg-white border-white text-black' : (editingModel?.id === m.id ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-white/10 border-neutral-900 text-neutral-500')}`}>
                    {isEditMode && !DEFAULT_MODELS.some(baseModel => baseModel.id === m.id) && (
                      <button 
                        type="button"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          e.preventDefault();
                          if(window.confirm(`确定从集群中移除引擎 [${m.name}]？`)) {
                            deleteModel(m.id);
                          }
                        }} 
                        className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center text-2xl font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all z-[80] active:scale-90 cursor-pointer"
                        title="Delete Engine"
                      >
                        ×
                      </button>
                    )}
                    <span className="font-black text-[15px]">{m.name}</span>
                  </div>
                ))}
                {isEditMode && (<button onClick={addNewModel} className="w-full py-6 border border-dashed border-neutral-800 rounded-2xl text-[11px] font-black uppercase tracking-widest text-neutral-700 hover:text-white hover:border-white transition-all">+ Add New Node</button>)}
              </div>
              <div className="flex-[2] bg-neutral-900/30 p-10 overflow-y-auto">
                {editingModel && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2"><label className="text-[9px] font-black uppercase text-neutral-600">Engine Name</label><input value={editingModel.name} onChange={e => setEditingModel({...editingModel, name: e.target.value})} className="w-full bg-white/5 border border-neutral-800 p-4 rounded-xl text-white" /></div>
                      <div className="col-span-2 space-y-2"><label className="text-[9px] font-black uppercase text-neutral-600">API Endpoint URL</label><input value={editingModel.baseUrl || ''} placeholder="https://..." onChange={e => setEditingModel({...editingModel, baseUrl: e.target.value})} className="w-full bg-white/5 border border-neutral-800 p-4 rounded-xl text-white font-mono" /></div>
                      <div className="col-span-2 space-y-2"><label className="text-[9px] font-black uppercase text-neutral-600">Private API Key</label><input type="password" value={editingModel.customApiKey || ''} onChange={e => setEditingModel({...editingModel, customApiKey: e.target.value})} className="w-full bg-white/5 border border-neutral-800 p-4 rounded-xl text-white font-mono" /></div>
                      <div className="col-span-2 space-y-2"><label className="text-[9px] font-black uppercase text-neutral-600">Physical Model ID</label><input value={editingModel.endpointId || ''} onChange={e => setEditingModel({...editingModel, endpointId: e.target.value})} className="w-full bg-white/5 border border-neutral-800 p-4 rounded-xl text-white font-mono" /></div>
                    </div>
                    <button onClick={saveModelChange} className="w-full bg-blue-600 py-5 rounded-xl font-black uppercase text-[11px] tracking-widest text-white shadow-2xl hover:bg-blue-500 transition-all">Apply Changes</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;