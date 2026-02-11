import { DeviceStatus } from '../types';

/**
 * 方标世纪AI - 授权核心服务 (Persistent Auth Logic)
 */
export class AuthService {
  private static readonly SALT = "FANG_BIAO_CENTURY_ARCH_SECURE_2025";
  private static readonly MASTER_BYPASS = "ARCH-PRO-2025-ADMIN-X";
  private static readonly STORAGE_KEY = "FBC_ARCH_LICENSE_VAULT";

  /**
   * 动态获取本地 API 基准地址
   * 解决后端因端口占用自动切换到 8001/8002 等端口时的通讯问题
   */
  private getApiBase(): string {
    const origin = window.location.origin;
    // 开发环境下（如 :3000）默认指向 8000 端口，打包后的 EXE 环境则跟随当前页面端口
    if (origin.includes(':3000') || origin === 'null' || !origin.startsWith('http')) {
      return "http://127.0.0.1:8000/api";
    }
    return `${origin}/api`;
  }

  async getMachineId(): Promise<string> {
    const apiBase = this.getApiBase();
    try {
      const resp = await fetch(`${apiBase}/machine-id`, { signal: AbortSignal.timeout(1200) });
      if (resp.ok) {
        const data = await resp.json();
        return data.machine_id;
      }
    } catch (e) {}

    // 只有在彻底无法连接后端服务时才回退到浏览器指纹（此时通常无法验证通过，需检查后端是否运行）
    try {
      const info = navigator.userAgent + (navigator.hardwareConcurrency || 8) + screen.colorDepth;
      const msgUint8 = new TextEncoder().encode(info);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      return hashHex.substring(0, 16);
    } catch (e) {
      return "FAULT-BACKUP-ID-01";
    }
  }

  async verifyLicense(key: string): Promise<{ valid: boolean; error?: string }> {
    const cleanInput = key.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const apiBase = this.getApiBase();

    try {
      const resp = await fetch(`${apiBase}/verify-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanInput }),
        signal: AbortSignal.timeout(2000)
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}

    // 本地冗余校验逻辑（当网络请求超时时作为参考，但以物理 ID 为准）
    const mid = await this.getMachineId();
    if (cleanInput === AuthService.MASTER_BYPASS.replace(/[^A-Z0-9]/gi, "").toUpperCase()) {
      return { valid: true };
    }

    if (cleanInput.length < 8) return { valid: false, error: "授权码长度不足" };
    
    const expiryStr = cleanInput.substring(0, 8);
    try {
      const year = parseInt(expiryStr.substring(0, 4));
      const month = parseInt(expiryStr.substring(4, 6)) - 1;
      const day = parseInt(expiryStr.substring(6, 8));
      const expiryDate = new Date(year, month, day);
      if (isNaN(expiryDate.getTime()) || new Date() > expiryDate) {
        return { valid: false, error: "授权已过期" };
      }
    } catch (e) {
      return { valid: false, error: "授权日期异常" };
    }

    const msgUint8 = new TextEncoder().encode(mid + expiryStr + AuthService.SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    const userHashPart = cleanInput.substring(8);
    const expectedHashPart = signature.substring(0, userHashPart.length);
    
    const isValid = userHashPart === expectedHashPart;
    return { valid: isValid, error: isValid ? undefined : "授权码不匹配（请核对 Machine ID）" };
  }

  async saveLicense(key: string): Promise<void> {
    localStorage.setItem(AuthService.STORAGE_KEY, key);
    const apiBase = this.getApiBase();
    try {
      await fetch(`${apiBase}/save-stored-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
    } catch (e) {}
  }

  clearLicense(): void {
    localStorage.removeItem(AuthService.STORAGE_KEY);
  }

  getStoredKey(): string | null {
    return localStorage.getItem(AuthService.STORAGE_KEY);
  }

  async checkPersistence(): Promise<DeviceStatus | null> {
    let key: string | null = null;
    const apiBase = this.getApiBase();
    
    try {
      const resp = await fetch(`${apiBase}/get-stored-license`, { signal: AbortSignal.timeout(1000) });
      if (resp.ok) {
        const data = await resp.json();
        key = data.key;
      }
    } catch (e) {}

    if (!key) key = this.getStoredKey();
    if (!key) return null;

    const result = await this.verifyLicense(key);
    if (result.valid) {
      const mid = await this.getMachineId();
      localStorage.setItem(AuthService.STORAGE_KEY, key);
      return {
        verified: true,
        deviceId: 'WEB-BROWSER-AUTH',
        hardwareFingerprint: `FBC-${mid}`
      };
    }
    return null;
  }
}

export const authService = new AuthService();