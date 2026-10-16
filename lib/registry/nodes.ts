/**
 * Single source of truth for every interactive object in the Cognitive Universe.
 * Drives the 3D scene, the accessible HTML rail, panels and deep links (#node-id).
 * URLs are navigation destinations only — never evidence of API connectivity.
 */

export type ToolId =
  | 'OMNISYNAPSE'
  | 'ORBIT'
  | 'NEXUS'
  | 'LAND_IQ'
  | 'FOX_ATLAS'
  | 'LAND_SEARCH'
  | 'PLANNING_RADAR'
  | 'LAND_PASSPORT'
  | 'FOX_GIS'
  | 'OBSERVATORY';

export type IntegrationStatus = 'self' | 'not_configured' | 'link_only' | 'read_only_verified';

export interface FoxTool {
  id: ToolId;
  name: string;
  role: string;
  url: string | null;
  layer: string;
  integration: IntegrationStatus;
}

export const FOX_TOOLS: Record<ToolId, FoxTool> = {
  OMNISYNAPSE: { id: 'OMNISYNAPSE', name: 'OMNISYNAPSE Ω', role: 'Supervisory intelligence, cognitive amplification and decision support', url: '/command', layer: 'Supervision', integration: 'self' },
  ORBIT: { id: 'ORBIT', name: 'FOX ORBIT', role: 'Visual ecosystem dashboard, observability and status', url: 'https://ecosystem.foxintelligence.co.uk/', layer: 'Interface', integration: 'link_only' },
  NEXUS: { id: 'NEXUS', name: 'FOX NEXUS', role: 'Governed orchestration — agents, connectors, approvals, run logs', url: 'https://nexus.foxintelligence.co.uk/', layer: 'Orchestration', integration: 'link_only' },
  LAND_IQ: { id: 'LAND_IQ', name: 'Land IQ', role: 'Site constraints → residual value → horizon scenarios → probability output', url: 'https://landiq.foxintelligence.co.uk/', layer: 'Intelligence', integration: 'link_only' },
  FOX_ATLAS: { id: 'FOX_ATLAS', name: 'FOX Atlas', role: 'Digital Land ID microsites and land storytelling', url: 'https://www.foxatlas.co.uk/', layer: 'Presentation', integration: 'link_only' },
  LAND_SEARCH: { id: 'LAND_SEARCH', name: 'LandSearch', role: 'Land-for-sale listing search against preset filters', url: 'https://land.foxatlas.co.uk/', layer: 'Discovery', integration: 'link_only' },
  PLANNING_RADAR: { id: 'PLANNING_RADAR', name: 'Planning Radar', role: 'Policy, consultation and application monitoring', url: 'https://radar.foxintelligence.co.uk/', layer: 'Monitoring', integration: 'link_only' },
  LAND_PASSPORT: { id: 'LAND_PASSPORT', name: 'Land Passport', role: 'Persistent site identity and digital twin (Derby pilot)', url: 'https://derbypilot.foxintelligence.co.uk/', layer: 'Identity', integration: 'link_only' },
  FOX_GIS: { id: 'FOX_GIS', name: 'FOX GIS', role: 'RustGIS spatial engine behind Land IQ, Land Search and RADAR (buffer, clip, overlay, measure)', url: 'https://gis.foxatlas.co.uk/', layer: 'Engine', integration: 'link_only' },
  OBSERVATORY: { id: 'OBSERVATORY', name: 'Observatory', role: 'Operations, performance, connections and audit', url: null, layer: 'Monitoring', integration: 'not_configured' },
};

export type NodeKind = 'core' | 'gateway' | 'symbol' | 'guardian' | 'altar';

export interface SceneNode {
  id: string;
  label: string;
  kind: NodeKind;
  domain: string;
  description: string;
  tools: ToolId[];
  /** Private command route this node opens (requires authentication). */
  command?: { href: string; label: string };
  side?: 'left' | 'right';
  /** Position on the astrolabe ring (radians, 0 = right, counter-clockwise). */
  angle?: number;
  accent: string;
  motif?: 'meditator' | 'galaxy' | 'pyramid' | 'flower' | 'eye' | 'scarab' | 'mandala' | 'triangle';
  hotkey?: string;
  /** The OMNI Symbol Library sign that represents this category (lib/registry/symbols.ts). */
  symbol: string;
}

const deg = (d: number) => (d * Math.PI) / 180;

export const NODES: SceneNode[] = [
  {
    id: 'omnisynapse',
    symbol: 'omega',
    label: 'OMNISYNAPSE Ω',
    kind: 'core',
    domain: 'Central supervisory intelligence',
    description:
      'The dual mind: organic human insight on the left, synthetic reasoning on the right, bridged by a single conduit. OMNISYNAPSE ranks above ORBIT and NEXUS as an advisor — it recommends, the Visionary Innovator decides.',
    tools: ['OMNISYNAPSE'],
    command: { href: '/command', label: 'Enter command layer' },
    accent: '#C8A96A',
    hotkey: 'o',
  },
  {
    id: 'fox',
    symbol: 'fox',
    label: 'FOX Intelligence Ecosystem',
    kind: 'gateway',
    domain: 'Identity and the full FOX tool landscape',
    description: 'The FOX insignia is the gateway to every registered platform. Each link is a destination; live telemetry appears only once ORBIT is connected and verified.',
    tools: ['ORBIT', 'NEXUS', 'LAND_IQ', 'LAND_SEARCH', 'PLANNING_RADAR', 'LAND_PASSPORT', 'FOX_ATLAS', 'OBSERVATORY'],
    command: { href: '/command/systems', label: 'Open systems registry' },
    accent: '#F2B45C',
    hotkey: 'f',
  },
  // Left hemisphere of the astrolabe — human, cosmic, built, geometric
  { id: 'human-consciousness', symbol: 'human-mind', label: 'Human Consciousness', kind: 'symbol', side: 'left', angle: deg(140), motif: 'meditator', accent: '#F7F6F1',
    domain: 'Human insight, intuition and the founder’s working context',
    description: 'The cognitive amplifier: working-context recall, “why did we decide that?”, scenario comparison and decision logs — augmenting judgement, never replacing it.',
    tools: ['OMNISYNAPSE'], command: { href: '/command/memory', label: 'Open working memory' } },
  { id: 'galaxy', symbol: 'galaxy', label: 'Cosmic Intelligence', kind: 'symbol', side: 'left', angle: deg(165), motif: 'galaxy', accent: '#9FD8FF',
    domain: 'Discovery, scale and emergent complexity',
    description: 'The ecosystem as a navigable universe. ORBIT maps every FOX system; OMNISYNAPSE reads its signals once a read-only adapter is authorised.',
    tools: ['ORBIT'], command: { href: '/command/systems', label: 'View ecosystem status' } },
  { id: 'pyramid', symbol: 'step-pyramid', label: 'Architecture & Creation', kind: 'symbol', side: 'left', angle: deg(192), motif: 'pyramid', accent: '#E9C98A',
    domain: 'Architecture, construction and the built environment',
    description: 'From land to building: persistent site identity and digital twins that update when policy, site or scenario changes.',
    tools: ['LAND_PASSPORT', 'FOX_ATLAS'] },
  { id: 'sacred-geometry', symbol: 'sacred-geometry', label: 'Geometry & Geospatial', kind: 'symbol', side: 'left', angle: deg(218), motif: 'flower', accent: '#BFE9F5',
    domain: 'Spatial mathematics, topology and pattern logic',
    description: 'Geospatial intelligence in British National Grid (EPSG:27700) — constraints, coverage, provenance and uncertainty behind every site output.',
    tools: ['LAND_IQ'] },
  // Right hemisphere — perception, renewal, logic, synthesis
  { id: 'eye', symbol: 'eye-of-horus', label: 'Observation & Awareness', kind: 'symbol', side: 'right', angle: deg(40), motif: 'eye', accent: '#C8A96A',
    domain: 'Monitoring, perception and change detection',
    description: 'Observed telemetry only — ORBIT health, deployments, spend and failures. Missing events are never reported as “all systems healthy”.',
    tools: ['OBSERVATORY', 'PLANNING_RADAR'], command: { href: '/command/systems', label: 'Open observatory' } },
  { id: 'scarab', symbol: 'scarab', label: 'Evolution & Transformation', kind: 'symbol', side: 'right', angle: deg(15), motif: 'scarab', accent: '#D9B36C',
    domain: 'Renewal, learning loops and workflow improvement',
    description: 'Evolution controller: self-improvement is proposed, tested, approved and reversible — dispatched only through NEXUS under explicit human authority.',
    tools: ['NEXUS'], command: { href: '/command/approvals', label: 'Open approval queue' } },
  { id: 'logic-mandala', symbol: 'tech-matrix', label: 'Structured Logic', kind: 'symbol', side: 'right', angle: deg(-12), motif: 'mandala', accent: '#E3C27E',
    domain: 'Logic, classification and analytical workflows',
    description: 'Evidence classes, transparent 0–5 scoring and typed connectome edges (SUPPORTS, CONTRADICTS, DEPENDS_ON…) keep reasoning inspectable.',
    tools: ['LAND_SEARCH'], command: { href: '/command/evidence', label: 'Open evidence ledger' } },
  { id: 'synthesis', symbol: 'triangle', label: 'Synthesis & Decision', kind: 'symbol', side: 'right', angle: deg(-38), motif: 'triangle', accent: '#B99CFF',
    domain: 'Decision support and synthesised intelligence',
    description: 'The daily brief: three ranked FOX upgrades, one emerging niche, one risk and one explicit founder decision — sourced, or not shown at all.',
    tools: ['LAND_IQ', 'OMNISYNAPSE'], command: { href: '/command', label: 'Open today’s brief' } },
  // Guardians
  { id: 'guardian-security', symbol: 'anubis', label: 'Security & Permissions', kind: 'guardian', side: 'left', accent: '#C8A96A',
    domain: 'Authentication, authorisation and privilege boundaries',
    description: 'Owner-only access enforced in the database (row-level security), not just the interface. Risk tiers R0–R4; R3 needs a recorded human approval per action; R4 is unavailable.',
    tools: ['NEXUS'], command: { href: '/command/governance', label: 'Open governance' } },
  { id: 'guardian-integrity', symbol: 'hieroglyphic-code', label: 'Integrity & Audit', kind: 'guardian', side: 'right', accent: '#C8A96A',
    domain: 'Provenance, validation and audit trail',
    description: 'Every ingest, transition and decision writes to an append-only audit ledger. Sources must be dated, linked and classified.',
    tools: ['OBSERVATORY'], command: { href: '/command/audit', label: 'Open audit ledger' } },
  // Altar
  { id: 'altar', symbol: 'energy-platform', label: 'Intelligence Cycle', kind: 'altar', accent: '#35D9F5',
    domain: 'Discover · Analyse · Challenge · Synthesise · Recommend · Learn',
    description: 'The six-stage cycle every council discipline follows. Signal-driven: light checks daily, deep specialist work only when something material changes.',
    tools: ['OMNISYNAPSE'], command: { href: '/command/council', label: 'Open expert council' } },
];

export const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, SceneNode>;

export const INTELLIGENCE_CYCLE = [
  { n: '01', name: 'Discover', text: 'Collect credible signals and sources' },
  { n: '02', name: 'Analyse', text: 'Evaluate applicability to FOX' },
  { n: '03', name: 'Challenge', text: 'Search for flaws and alternatives' },
  { n: '04', name: 'Synthesise', text: 'Connect findings across categories' },
  { n: '05', name: 'Recommend', text: 'Rank actions, cost and expected impact' },
  { n: '06', name: 'Learn', text: 'Record verified results and lessons' },
] as const;
