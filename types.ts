
export enum MasterStyle {
  ZAHA = '扎哈·哈迪德 (Zaha Hadid)',
  ANDO = '安藤忠雄 (Tadao Ando)',
  OMA = 'OMA (Rem Koolhaas)',
  KUMA = '隈研吾 (Kengo Kuma)',
  CORBUSIER = '勒·柯布西耶 (Le Corbusier)',
  BRUTALISM = '粗野主义 (Brutalism)',
  ARTDECO = '装饰艺术 (Art Deco)',
  SUSTAINABLE = '可持续设计 (Sustainable)',
  BIG = 'BIG (Bjarke Ingel)',
  GEHRY = '弗兰克·盖里 (Frank Gehry)'
}

export type PresetCategory = 'Master' | 'Style' | 'Climate' | 'Material' | 'Camera' | 'Quality';

export interface PresetItem {
  id: string;
  label: string;
  prompt: string;
}

export interface InpaintAnnotation {
  id: string;
  text: string;
  points: { x: number; y: number }[];
  type: 'rect' | 'poly';
  mode: 'add' | 'sub';
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ArchitecturePrompt {
  chinese: string;
  english: string;
  metadata: {
    material: string;
    perspective: string;
    lighting: string;
  };
  sources?: GroundingSource[];
}

export interface GenerationResult {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
  metadata?: {
    material: string;
    perspective: string;
    lighting: string;
  };
}

export interface DeviceStatus {
  verified: boolean;
  deviceId: string;
  hardwareFingerprint: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  type: 'text' | 'generation';
  content: string | GenerationResult;
  timestamp: number;
  refs?: { name: string; data: string; type: string; ratio?: string }[];
  sources?: GroundingSource[];
}
