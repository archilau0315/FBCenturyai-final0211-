
import React, { useState, useEffect } from 'react';
import { DeviceStatus } from '../types';
import { authService } from '../services/authService';

interface HardwareLockProps {
  onVerify: (status: DeviceStatus) => void;
}

const HardwareLock: React.FC<HardwareLockProps> = ({ onVerify }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [machineId, setMachineId] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const initMachineId = async () => {
      const mid = await authService.getMachineId();
      setMachineId(mid);
    };
    initMachineId();
  }, []);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), msg]);

  const handleHandshake = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const result = await authService.verifyLicense(licenseKey);
    if (!result.valid) {
      setError(result.error || "授权验证失败，请核对 Machine ID 或有效期");
      return;
    }

    setIsVerifying(true);
    setLogs([]);

    const workflow = [
      `初始化硬件链路 [${machineId}]...`,
      "访问权限校验通过 [TIME_LOCK_VERIFIED]...",
      "加载方标世纪 2025 建筑核心...",
      "同步 AI 推理集群协议..."
    ];

    for (const step of workflow) {
      addLog(step);
      await new Promise(r => setTimeout(r, 500));
    }
    
    // 成功后保存到本地
    authService.saveLicense(licenseKey);

    onVerify({
      verified: true,
      deviceId: 'WEB-BROWSER-AUTH',
      hardwareFingerprint: `FBC-${machineId}`
    });
    
    setIsVerifying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-light tracking-[0.2em] text-white">方标世纪 <span className="font-bold">AI</span></h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Architectural Creative Platform / Core Auth</p>
        </div>

        {!isVerifying && !error && (
          <form onSubmit={handleHandshake} className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-4 text-left">
              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                   <label className="text-[9px] text-neutral-500 uppercase tracking-widest">Machine ID</label>
                   <span className="text-[8px] text-neutral-600 font-mono cursor-pointer hover:text-white transition-colors" onClick={() => {navigator.clipboard.writeText(machineId); alert('Machine ID 已复制');}}>[ COPY ]</span>
                </div>
                <div className="w-full bg-neutral-900/50 border border-neutral-800 p-4 text-xs text-neutral-400 font-mono select-all">
                  {machineId || "GENERATING..."}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                   <label className="text-[9px] text-neutral-500 uppercase tracking-widest">License Key</label>
                   <span className="text-[8px] text-neutral-600 font-mono cursor-pointer hover:text-white transition-colors" onClick={() => setShowKey(!showKey)}>
                     {showKey ? '[ HIDE ]' : '[ SHOW ]'}
                   </span>
                </div>
                <input 
                  type={showKey ? "text" : "password"} 
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="YYYYMMDD-XXXX-XXXX"
                  className="w-full bg-neutral-900 border border-neutral-800 p-4 text-sm text-white focus:outline-none focus:border-white transition-colors font-mono uppercase"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-white text-black py-4 text-xs font-bold uppercase tracking-[0.3em] hover:bg-neutral-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              Execute Handshake
            </button>
          </form>
        )}

        {isVerifying && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="w-full h-[140px] bg-neutral-900/50 border border-neutral-800 p-4 rounded-lg flex flex-col items-start gap-1.5 font-mono text-[9px] text-emerald-500/80 uppercase">
              {logs.map((log, i) => (
                <div key={i} className="animate-in slide-in-from-left-2">{" > "} {log}</div>
              ))}
            </div>
            <div className="w-full h-0.5 bg-neutral-800 overflow-hidden relative">
              <div className="h-full bg-white animate-progress"></div>
            </div>
            <p className="text-[9px] text-neutral-500 uppercase tracking-widest animate-pulse">Synchronizing Architectural Kernels...</p>
          </div>
        )}

        {error && (
          <div className="p-6 border border-red-900/50 bg-red-950/20 text-red-500 animate-in zoom-in-95">
            <p className="text-sm font-medium">{error}</p>
            <div className="mt-4 pt-4 border-t border-red-900/30 font-mono text-[9px] text-left opacity-60">
              ERR_CODE: LICENSE_IDENT_FAIL<br/>
              SYSTEM_STATUS: ACCESS_DENIED<br/>
              ADMIN_REQUIRED: 刘珂(Archilau)
            </div>
            <button onClick={() => {setError(null); setLicenseKey('');}} className="mt-6 text-[9px] underline uppercase tracking-widest text-neutral-500 hover:text-white">Retry Handshake</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HardwareLock;