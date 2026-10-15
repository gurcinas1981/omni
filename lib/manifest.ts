/**
 * OMNISYNAPSE's fox.ecosystem.component.v1 record (reference: fox-planning-radar lib/manifest.js).
 * Served at /.well-known/fox-component.json (rewrite → /api/manifest). Public, so: static facts only —
 * no secrets, no live data, and no self-reported connection status (those are owner-only and evidence-based).
 */
export const APP_VERSION = '1.1.0';

export const COMPONENT = {
  schema: 'fox.ecosystem.component.v1',
  id: 'fox.omnisynapse',
  name: 'OMNISYNAPSE Ω',
  type: 'web-application',
  role: 'Supervisory intelligence (cognitive evolution engine)',
  strategicPurpose:
    'Persistent memory, evidence-based recommendations and approval-gated evolution proposals for the FOX ecosystem. Reads ORBIT telemetry; proposes bounded work to NEXUS only with owner approval.',
  ecosystem: 'FOX Intelligence',
  owner: 'FOX Design Intelligence Ltd',
  maintainer: 'Tomas Gurcinas',
  repository: { provider: 'github', name: 'gurcinas1981/omni', productionBranch: 'main' },
  hosting: { provider: 'vercel', team: 'foxatlas', project: 'omni', region: 'lhr1' },
  urls: { production: 'https://omni.foxintelligence.co.uk/' },
  backend: { database: 'supabase', project: 'fox-omnisynapse (eu-west-2)', access: 'row-level security as the signed-in owner; no service-role key in the app' },
  envVarNames: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'ORBIT_READ_TOKEN', 'ORBIT_OBSERVABILITY_URL', 'NEXUS_PROPOSALS_URL', 'NEXUS_PROPOSALS_SECRET'],
  interfaces: {
    health: { method: 'GET', path: '/api/health', auth: 'none' },
    manifest: { method: 'GET', path: '/.well-known/fox-component.json', auth: 'none' },
    orbitRead: { direction: 'outbound', target: 'fox.orbit', path: '/api/observability', auth: 'read-only bearer', schema: 'fox.observability.snapshot.v1' },
    nexusProposals: { direction: 'outbound', target: 'fox.nexus', auth: 'bearer + HMAC-SHA256 X-Fox-Signature', schema: 'fox.omni.task_proposal.v1', note: 'held until the NEXUS receiver exists' },
  },
  capabilities: [
    { id: 'memory.evidence', description: 'Evidence, recommendations and decisions with provenance' },
    { id: 'evolution.proposals', description: 'Approval-gated improvement proposals; never deploys autonomously' },
    { id: 'orbit.read', description: 'Read-only ORBIT telemetry adapter' },
  ],
  consumers: ['fox.orbit'],
  documentation: ['https://github.com/gurcinas1981/omni/blob/main/ARCHITECTURE.md'],
  rollback: 'Vercel instant rollback to the previous production deployment; git revert on main.',
  version: APP_VERSION,
} as const;
