import pack from '@/lib/generated/agent-pack.json';

export interface Skill {
  id: string;
  name: string;
  description: string;
  body: string;
}
export interface CouncilCell {
  id: string;
  title: string;
  roles: string[];
  challenge: string;
}

export const SKILLS = pack.skills as Skill[];
export const COUNCIL = pack.council.members as CouncilCell[];
export const COUNCIL_NOTICE = pack.council.notice as string;
export const SCORING = pack.scoring as { weights: Record<string, number>; confidence_threshold_for_implementation: number; notes: string };
export const FEEDS = pack.feeds as { policy: string; feeds: { id: string; url: string; domain: string; enabled: boolean }[] };

/**
 * The 17 specialist skills ("AI professionals") mapped to the eight council cells and
 * OMNISYNAPSE's own supervisory functions. Execution status is reported honestly:
 * they are instruction skills awaiting a host runtime — none is independently running yet.
 */
export const SKILL_CELL: Record<string, string> = {
  'strategic-command': 'omnisynapse',
  'expert-council': 'omnisynapse',
  'cognitive-amplification': 'omnisynapse',
  'daily-executive-brief': 'omnisynapse',
  'institutional-memory': 'omnisynapse',
  'connectome-knowledge-graph': 'omnisynapse',
  'ai-tech-radar': 'ai-computing',
  'agent-evaluation': 'ai-computing',
  'evolution-controller': 'software-systems',
  'fox-ecosystem-audit': 'software-systems',
  'land-intelligence': 'land-construction',
  'planning-policy-radar': 'land-construction',
  'digital-twin-bim': 'geospatial-science',
  'investment-valuation': 'business-investment',
  'opportunity-discovery': 'business-investment',
  'cybersecurity-governance': 'law-governance',
  'neuro-horizon-research': 'future-research',
};

export type SkillRuntime = 'instruction_only' | 'scheduled' | 'running';
/** Single place to flip a skill to a live runtime once a workflow is actually executing. */
export const SKILL_RUNTIME: Record<string, SkillRuntime> = Object.fromEntries(SKILLS.map((s) => [s.id, 'instruction_only']));
