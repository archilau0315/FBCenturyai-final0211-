
import { PresetCategory, PresetItem } from './types';

export const SYSTEM_INSTRUCTION = `
# 方标世纪AI 建筑创意辅助平台：首席建筑师系统指令

## 一、 角色与身份设定
你是 方标世纪AI 的首席建筑师 (Chief Architect)，代表天津方标世纪规划建筑设计有限公司。你拥有深厚的建筑理论功底、卓越的材料感知力以及严谨的结构逻辑。你的回复应体现 professional、前瞻且具有人文关怀的建筑师素养。

## 二、 核心行为协议
1. **PROTOCOL: LOGIC FIRST**. 优先考虑空间逻辑与结构合理性。
2. **STRICT CONSTRAINT**: 在生成图像提示词的 "english" 字段中，严禁出现中文。所有生成逻辑必须使用高端专业的建筑学英语（如 El Croquis / ArchDaily 标准）。
3. **核心关注**: 材质表达 (Materiality)、结构逻辑 (Structural Logic) 以及建筑光影 (Architectural Lighting)。
4. **设计标准**: 遵循国际一流建筑媒体（如 El Croquis, ArchDaily, Detail）的视觉化与描述标准。

## 三、 场域感知协议 (GROUNDING PROTOCOL)
1. **CONTEXTUAL AWARENESS**: 当用户输入涉及具体地理位置、地标或特定城市时，你必须启动场域感知。
2. **SEARCH TASK**: 检索该地的气候特征（风向、光照）、城市容积率约束（FAR/Plot Ratio）、周边建筑文脉（Vernacular Context）。
3. **OUTPUT INTEGRATION**: 将上述检索到的场域数据深度嵌入生成的 "english" 提示词中。例如，如果是沿海地区，应加入抗盐雾材质描述；如果是历史街区，应加入文脉衔接逻辑。
4. **SCENERY MATCHING**: 自动匹配符合该地域特征的植被、光影与周边配景（Surroundings）。

## 四- [STRICT UI PRESERVATION MODE]
1. 你严禁修改现有的 CSS 样式类名、布局结构 and 颜色方案。
2. 除非我明确要求改变外观，否则所有的修改必须仅限于逻辑功能（Logic）或后端配置（Backend/Packaging）。
3. 如果需要添加新功能，必须复用现有的 UI 组件，不得重新生成 UI 代码。
4. 在生成代码时，如果涉及到打包 EXE 的逻辑，请以独立的脚本或指令形式给出，不要重写我的前端视图文件。
`;

export interface EngineModel {
  id: string;
  endpointId?: string; // 物理模型 ID / 推理终端 ID
  name: string;
  version: string;
  capabilities: ('Logic' | 'Visual' | 'Speed' | 'Pro' | 'Remote')[];
  description: string;
  latency: 'Low' | 'Mid' | 'High';
  baseUrl?: string;
  customApiKey?: string;
}

export const ENGINE_MODELS: EngineModel[] = [
  { 
    id: 'gemini-3-pro-preview', 
    endpointId: 'gemini-3-pro-preview',
    name: 'gemini-3-pro-preview', 
    version: 'v1.0.2 (Pro)', 
    capabilities: ['Logic', 'Pro'],
    description: 'Google 官方原生逻辑核心，处理复杂建筑规范与空间演变。系统默认首选引擎。',
    latency: 'Mid'
  },
  { 
    id: 'gemini-3-flash-preview', 
    endpointId: 'gemini-3-flash-preview',
    name: 'gemini-3-flash-preview', 
    version: 'v1.5.8 (Arch)', 
    capabilities: ['Speed', 'Visual'],
    description: 'Google 官方原生高速推理引擎，提供极速的建筑语义分析。Pro 缺失时的自动替代方案。',
    latency: 'Low'
  },
  { 
    id: 'gemini-2.5-flash-image', 
    endpointId: 'gemini-2.5-flash-image',
    name: 'gemini-2.5-flash-image', 
    version: 'v6.1 (Aesth)', 
    capabilities: ['Visual', 'Pro'],
    description: 'Google 官方原生图像合成引擎，竞赛级光影与材质细节。',
    latency: 'High'
  },
  { 
    id: 'seedream-4-architect', 
    name: 'SeeDream-4-Architect', 
    version: 'v4.0.2 (Remote)', 
    capabilities: ['Visual', 'Remote'],
    description: '[预留节点] 国内主流建筑垂直领域模型，擅长中式人居与本土材质表现。',
    latency: 'Mid'
  },
  { 
    id: 'wanxiang-2-professional', 
    name: 'Wanxiang-2-Professional', 
    version: 'v2.1.0 (Remote)', 
    capabilities: ['Visual', 'Remote'],
    description: '[预留节点] 阿里通义万相架构版，提供大规模城市尺度渲染能力。',
    latency: 'Mid'
  },
  { 
    id: 'hunyuan-v3-design', 
    name: 'Hunyuan-V3-Design', 
    version: 'v3.5.0 (Remote)', 
    capabilities: ['Visual', 'Remote'],
    description: '[预留节点] 腾讯混元设计专用节点，针对室内空间逻辑进行了深度优化。',
    latency: 'Mid'
  }
];

export const PRESETS: Record<string, PresetItem[]> = {
  Master: [
    { id: 'zaha', label: '扎哈 Zaha Hadid', prompt: 'Designed by Zaha Hadid, parametric fluidity, curved dynamic forms.' },
    { id: 'ando', label: '安藤 Ando', prompt: 'Designed by Tadao Ando, minimalist concrete, zen light and shadow.' },
    { id: 'oma', label: 'OMA', prompt: 'Designed by OMA Rem Koolhaas, structural deconstruction, bold geometric logic.' },
    { id: 'kuma', label: '隈研吾 Kengo Kuma', prompt: 'Designed by Kengo Kuma, wooden lattice, material transparency.' },
    { id: 'big', label: 'BIG', prompt: 'Designed by Bjarke Ingels Group, hedonistic sustainability, geometric playfulness.' },
    { id: 'sanaa', label: 'SANAA', prompt: 'Designed by SANAA, ethereal lightness, thin structures.' },
    { id: 'zumthor', label: '卒姆托 Zumthor', prompt: 'Designed by Peter Zumthor, atmospheric materiality, tectonic honesty.' },
    { id: 'herzog', label: 'Herzog & de Meuron', prompt: 'Designed by Herzog & de Meuron, innovative facade textures.' },
    { id: 'mvrdv', label: 'MVRDV', prompt: 'Designed by MVRDV, colorful modularity, vertical urbanism.' },
    { id: 'foster', label: 'Foster + Partners', prompt: 'Designed by Foster + Partners, high-tech elegance.' },
    { id: 'mayer', label: 'J.Mayer H', prompt: 'Designed by J.Mayer H, organic sculptural forms.' },
    { id: 'libeskind', label: 'Daniel Libeskind', prompt: 'Designed by Daniel Libeskind, jagged edges, traumatic memory.' }
  ],
  Style: [
    { id: 'intl', label: '国际主义 Int\'l Style', prompt: 'International Style architecture, functionalism, steel and glass.' },
    { id: 'brut', label: '粗野主义 Brutalism', prompt: 'Brutalist architecture, raw exposed concrete, monolithic massive forms.' },
    { id: 'modern', label: '现代主义 Modernism', prompt: 'Modernist principles, pilotis, open plan, free facade.' },
    { id: 'post', label: '后现代 Post-Modern', prompt: 'Post-modernism, historical reference, irony, bold color.' },
    { id: 'decon', label: '解构主义 Decon', prompt: 'Deconstructivist style, fragmented volumes, non-rectilinear shapes.' },
    { id: 'hitech', label: '高技派 High-Tech', prompt: 'High-tech architecture, exposed structural elements.' },
    { id: 'param', label: '参数化 Parametric', prompt: 'Parametricism, fluid algorithmic geometry, digital tectonics.' },
    { id: 'metab', label: '新陈代谢 Metabolism', prompt: 'Japanese Metabolism, modular growth, megastructures.' },
    { id: 'minimal', label: '极简主义 Minimalist', prompt: 'Minimalist architecture, reduction of form, essential spaces.' },
    { id: 'vernac', label: '本土主义 Critical Reg', prompt: 'Critical Regionalism, local craft, contextual materiality.' },
    { id: 'organic', label: '有机建筑 Organic', prompt: 'Organic architecture, harmony between habitation and natural world.' },
    { id: 'future', label: '未来主义 Futurist', prompt: 'Neo-futurism, sleek curves, kinetic motion.' }
  ],
  Climate: [
    { id: 'dawn', label: '黎明 Dawn', prompt: 'Dawn light, soft blue atmosphere, cool shadows.' },
    { id: 'sunset', label: '黄金时段 Sunset', prompt: 'Golden hour, warm orange glow, long dramatic shadows.' },
    { id: 'mist', label: '晨雾 Mist', prompt: 'Misty fog, diffused Tyndall effect, ethereal morning.' },
    { id: 'snow', label: '积雪 Snow', prompt: 'Winter snow, crystalline air, cold blue tones.' },
    { id: 'rain', label: '雨夜 Rain', prompt: 'Rainy night, neon reflections, wet pavement.' },
    { id: 'snow_storm', label: '雪暴 Snowstorm', prompt: 'Intense snow fall, whiteout conditions, obscured horizons.' },
    { id: 'desert', label: '干旱 Desert', prompt: 'Arid sunlight, harsh shadows, yellow dust.' },
    { id: 'tropical', label: '热带 Tropical', prompt: 'Lush greenery, humid zenith light, deep greens.' },
    { id: 'moon', label: '月光 Moonlight', prompt: 'Deep night, cold silvery light, mysterious atmosphere.' },
    { id: 'sand', label: '沙尘 Sandstorm', prompt: 'Sepia atmosphere, particles in air, blurred horizons.' },
    { id: 'over', label: '阴天 Overcast', prompt: 'Flat neutral light, soft shadows, overcast sky.' },
    { id: 'autumn', label: '秋景 Autumn', prompt: 'Orange leaves, crisp lighting, warm highlights.' }
  ],
  Material: [
    { id: 'concrete', label: '混凝土 Concrete', prompt: 'Exposed raw concrete, brutalist texture, formwork marks.' },
    { id: 'wood', label: '木材 Wood', prompt: 'Natural timber cladding, warm wood grain, sustainable lattice.' },
    { id: 'glass', label: '玻璃 Glass', prompt: 'High-transparency glass curtain wall, reflective surfaces.' },
    { id: 'steel', label: '钢材 Steel', prompt: 'Industrial steel structure, matte black metal finish.' },
    { id: 'stone', label: '石材 Stone', prompt: 'Rough-hewn stone masonry, heavy monolithic texture.' },
    { id: 'brick', label: '砖石 Brick', prompt: 'Red clay brickwork, parametric brick patterns.' },
    { id: 'corten', label: '耐候钢 Corten', prompt: 'Weathered Corten steel, rusted orange patina.' },
    { id: 'bamboo', label: '竹材 Bamboo', prompt: 'Sustainable bamboo structure, organic weaving.' },
    { id: 'alum', label: '铝板 Aluminum', prompt: 'Anodized aluminum panels, metallic sheen.' },
    { id: 'carbon', label: '碳纤维 Carbon', prompt: 'Carbon fiber composite, high-tech lightweight structure.' },
    { id: 'rammed', label: '夯土 Rammed Earth', prompt: 'Traditional rammed earth walls, layered sedimentary texture.' },
    { id: 'terra', label: '陶土 Terracotta', prompt: 'Glazed terracotta fins, earthy tones.' }
  ],
  Camera: [
    { id: 'eye', label: '人视 Eye-level', prompt: 'Eye-level street view perspective.' },
    { id: 'drone', label: '无人机 Drone', prompt: 'Aerial drone shot, bird eye view.' },
    { id: 'wide', label: '广角 Wide', prompt: 'Ultra-wide angle lens distortion.' },
    { id: 'ortho', label: '轴测 Ortho', prompt: 'Axonometric drawing aesthetic.' },
    { id: 'tilt', label: '移轴 Tilt', prompt: 'Tilt-shift miniature effect.' },
    { id: 'macro', label: '节点 Macro', prompt: 'Macro focus on material joints.' },
    { id: 'tele', label: '长焦 Tele', prompt: 'Telephoto flattened compression.' },
    { id: 'worm', label: '仰视 Worm-eye', prompt: 'Extreme low angle towering view.' },
    { id: 'interior', label: '室内 Interior', prompt: 'Interior deep space perspective.' },
    { id: 'iso', label: '等轴 Iso', prompt: 'Isometric technical diagram.' },
    { id: 'side', label: '立面 Elevation', prompt: 'Flat elevation view, orthographic.' },
    { id: 'section', label: '剖面 Section', prompt: 'Architectural section perspective.' }
  ],
  Quality: [
    { id: 'render', label: '渲染 Render', prompt: 'V-Ray style realistic render.' },
    { id: 'photo', label: '摄影 Photo', prompt: 'Professional architectural photography.' },
    { id: 'model', label: '模型 Model', prompt: 'Physical scale model, white card.' },
    { id: 'sketch', label: '手绘 Sketch', prompt: 'Master architectural hand sketch.' },
    { id: 'blueprint', label: '蓝图 Blueprint', prompt: 'Blueprint technical drawing.' },
    { id: 'unreal', label: '虚幻5 Unreal', prompt: 'Unreal Engine 5 realtime visualization.' },
    { id: 'octane', label: 'Octane', prompt: 'Octane render, photorealistic lighting.' },
    { id: 'concept', label: '概念 Concept', prompt: 'Digital conceptual some painting.' },
    { id: 'mag', label: '杂志 Magazine', prompt: 'El Croquis magazine aesthetic.' },
    { id: 'night', label: '夜景 Night', prompt: 'Long exposure architectural night view.' },
    { id: 'lofi', label: '胶片 Film', prompt: '35mm film grain aesthetic.' },
    { id: 'charcoal', label: '素描 Charcoal', prompt: 'Rough charcoal architectural study.' }
  ]
};

export const ALLOWED_DEVICE_LIST = ['WEB-BROWSER-AUTH'];