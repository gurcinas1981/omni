/**
 * Cursor explanations — one plain-English source of truth for what every graph, parameter
 * and function on OMNISYNAPSE does. Elements opt in with `data-explain="<key>"`; the command layer
 * is also covered by selector rules so each page needs no extra markup.
 */
import { DEFAULT_WEIGHTS, type ScoreField } from '@/lib/engine/core';

export type ExplainKind = 'Function' | 'Parameter' | 'Graph' | 'Status' | 'Navigation' | 'Sphere' | 'Section' | 'Control';
export interface Explain {
  kind: ExplainKind;
  title: string;
  body: string;
  /** Optional second line: how to use it or what changes it. */
  how?: string;
}

const w = (f: ScoreField) => {
  const v = DEFAULT_WEIGHTS[f];
  return v >= 0 ? `Weight +${v}: a higher score raises the relative ranking.` : `Weight ${v}: a higher score lowers the relative ranking.`;
};

export const EXPLAIN: Record<string, Explain> = {
  /* ── Public ecosphere ── */
  brand: { kind: 'Navigation', title: 'OMNISYNAPSE Ω', body: 'The private supervisory intelligence of the FOX ecosystem. It watches the other FOX platforms, weighs evidence and proposes improvements for your approval.', how: 'Click to return to the ecosphere and clear any selection.' },
  'view-ecosphere': { kind: 'Control', title: 'Ecosphere view', body: 'A 3D orbital map: the Ω core sits in the middle and every category sphere travels on its own tilted orbit, linked to the core by a dashed line.', how: 'Drag to rotate, scroll to zoom, click a sphere to bring it to the centre.' },
  'view-plan': { kind: 'Control', title: 'Plan view', body: 'The same system seen from directly above. Orbits flatten into concentric rings so you can compare the categories at a glance.', how: 'Rotation is locked; scroll to zoom, click a sphere to open it.' },
  reset: { kind: 'Function', title: 'Reset view', body: 'Clears the selected sphere and flies the camera back to the home framing of the current view.', how: 'Shortcut: R' },
  fullscreen: { kind: 'Function', title: 'Fullscreen', body: 'Expands OMNISYNAPSE to fill the screen, which is useful for presenting the ecosphere.', how: 'Press Esc to leave fullscreen.' },
  command: { kind: 'Navigation', title: 'Command layer', body: 'The private owner area: daily brief, approval queue, evidence ledger, decision memory, expert council, FOX systems, governance and audit trail.', how: 'Owner sign-in required; all data is protected by row-level security.' },
  stage: { kind: 'Graph', title: 'The OMNI ecosphere', body: 'Each glowing dotted sphere is one intelligence category carrying its OMNI symbol. Small grey symbols drifting around are the rest of the OMNI Symbol Library; faint glyphs and digits are ambient signal.', how: 'Hover a sphere for its role; click to bring it to the centre. Ideas assigned to a sphere orbit it as moons.' },
  'rail-core': { kind: 'Section', title: 'Core', body: 'The supervisory centre: OMNISYNAPSE itself, the FOX ecosystem gateway and the six-stage intelligence cycle.' },
  'rail-human': { kind: 'Section', title: 'Human domains', body: 'Categories rooted in human insight: consciousness, cosmic thinking, architecture and geometry. Gold spheres in the ecosphere.' },
  'rail-synthetic': { kind: 'Section', title: 'Synthetic domains', body: 'Categories rooted in machine capability: observation, evolution, structured logic and synthesis. Cyan spheres in the ecosphere.' },
  'rail-guardians': { kind: 'Section', title: 'Guardians', body: 'Security & Permissions and Integrity & Audit — the two ringed violet spheres that protect every action OMNISYNAPSE proposes.' },
  'status-integrations': { kind: 'Status', title: 'Live integrations', body: 'How many FOX systems OMNISYNAPSE can actually observe. It is “none verified” until a read-only connection has been tested and recorded — a URL alone never counts as connected.' },
  'status-keys': { kind: 'Function', title: 'Keyboard shortcuts', body: '← → step through the spheres, R resets the view, Esc closes the panel. “Full rendering” means bloom and high-resolution effects are on.' },
  'eco-title': { kind: 'Section', title: 'OMNISYNAPSE · supervisory intelligence', body: 'One mind across the whole FOX ecosystem: it reads evidence, connects categories and recommends — but only you approve.' },
  'eco-motto': { kind: 'Section', title: 'Ideas become moons', body: 'Every proposal is assigned to one sphere. While it waits for your review it orbits as a hollow ring; once you approve it, it becomes a solid gold moon, so a sphere grows as confirmed ideas accumulate.' },
  'panel-prev': { kind: 'Navigation', title: 'Previous sphere', body: 'Moves the focus to the previous category and brings that sphere to the centre.', how: 'Shortcut: ← or [' },
  'panel-next': { kind: 'Navigation', title: 'Next sphere', body: 'Moves the focus to the next category and brings that sphere to the centre.', how: 'Shortcut: → or ]' },
  'panel-close': { kind: 'Function', title: 'Close', body: 'Closes the panel and returns the Ω core to the centre.', how: 'Shortcut: Esc' },
  'panel-symbol': { kind: 'Parameter', title: 'OMNI symbol', body: 'The sign from the OMNI Symbol Library that represents this category everywhere — in the ecosphere, the opener and the command layer.' },
  'panel-ideas': { kind: 'Graph', title: 'Ideas on this sphere', body: 'Proposals assigned to this category. Hollow ring = awaiting your review. Solid gold = approved by you. Rejected or rolled-back ideas are removed.', how: 'Assign an idea to a sphere from the Approval queue.' },
  'panel-tools': { kind: 'Section', title: 'Mapped FOX platforms', body: 'The FOX products this category relates to. The badge states the honest connection status; links open the product but do not mean OMNISYNAPSE is receiving its data.' },
  'panel-cta': { kind: 'Navigation', title: 'Open in the command layer', body: 'Jumps to the private page where this category’s work is managed.', how: 'Owner sign-in required.' },

  /* ── Command layer navigation ── */
  'nav-brief': { kind: 'Navigation', title: 'Daily brief', body: 'Today’s executive summary: at most three ranked upgrades, each backed by trusted evidence. Fewer appear when evidence is thin — nothing is padded.' },
  'nav-approvals': { kind: 'Navigation', title: 'Approval queue', body: 'Every proposal with its score breakdown, evidence and risk tier. You move it through proposed → reviewed → approved; the database rejects anything else.' },
  'nav-evidence': { kind: 'Navigation', title: 'Evidence ledger', body: 'All sources OMNISYNAPSE may reason from, each classified by trust level with a confidence value. Ingest new records here as JSON.' },
  'nav-memory': { kind: 'Navigation', title: 'Memory & decisions', body: 'Persistent institutional memory: decisions you have made, their outcomes, and pinned working context that future recommendations must respect.' },
  'nav-council': { kind: 'Navigation', title: 'Expert council', body: 'The 17 specialist skills grouped into 8 cells. They are instruction sets today; specialist execution starts once workflows are connected.' },
  'nav-systems': { kind: 'Navigation', title: 'FOX systems', body: 'Registry of FOX platforms and their verified connection status, plus the ORBIT telemetry inbox.' },
  'nav-governance': { kind: 'Navigation', title: 'Governance', body: 'Risk tiers R0–R4, the enforced controls and your account settings (including password change).' },
  'nav-audit': { kind: 'Navigation', title: 'Audit trail', body: 'Append-only record of every status change and decision — who, what, when. It cannot be edited or deleted.' },

  /* ── Brief ── */
  'stat-trusted': { kind: 'Parameter', title: 'Trusted evidence records', body: 'Evidence classified verified primary, credible secondary or internal verified. Only these can promote a proposal into the brief.' },
  'stat-awaiting': { kind: 'Parameter', title: 'Proposals awaiting review', body: 'Ideas in “proposed” or “reviewed” status. They orbit their sphere as hollow rings until you decide.' },
  'stat-approved': { kind: 'Parameter', title: 'Human-approved, not dispatched', body: 'Proposals you approved that have not yet been queued for NEXUS. Nothing runs until a verified NEXUS adapter exists.' },
  'stat-systems': { kind: 'Parameter', title: 'Verified FOX connections', body: 'FOX systems with a tested read-only or scoped-write connection, out of all registered systems.' },
  'mode-evidence': { kind: 'Control', title: 'Evidence mode', body: 'Shows only real, sourced records. Demonstration data is hidden.' },
  'mode-demo': { kind: 'Control', title: 'Demo mode', body: 'Includes clearly labelled demonstration records so you can see how the brief, scoring and moons behave.' },
  'card-brief': { kind: 'Section', title: 'Today’s brief', body: 'Generated from your ledger: strategic signal, up to three validated upgrades, risk and the founder decision required. Copy it as markdown below.' },
  'card-cycle': { kind: 'Graph', title: 'Intelligence cycle', body: 'Discover → Analyse → Challenge → Synthesise → Recommend → Learn. Today OMNISYNAPSE performs stages 05–06 over records you ingest; 01–04 move into specialist workflows once connected.' },
  'card-milestone': { kind: 'Section', title: 'Next milestone', body: 'What must be built so recommendations rest on real FOX activity: an ORBIT read-only adapter and the NEXUS authorised task interface. Decision memory is already live.' },
  'btn-review': { kind: 'Navigation', title: 'Review proposals', body: 'Opens the approval queue.' },
  'btn-add-evidence': { kind: 'Navigation', title: 'Add evidence', body: 'Opens the evidence ledger where you can ingest cited sources.' },

  /* ── Approvals ── */
  'assign-sphere': { kind: 'Function', title: 'Assign sphere', body: 'Places this idea on one OMNI category sphere. It then orbits that sphere in the ecosphere — hollow while pending, gold once approved.' },
  'btn-approve': { kind: 'Function', title: 'Approve', body: 'Records your authority for this proposal. Only a human owner can approve, only from “reviewed”, and R4 proposals are blocked outright.' },
  'btn-reject': { kind: 'Function', title: 'Reject', body: 'Closes the proposal with your optional reason. Its moon is removed from the ecosphere.' },
  'btn-reviewed': { kind: 'Function', title: 'Mark reviewed', body: 'Confirms you have read the proposal and its evidence. Approval is only possible after this step.' },
  'btn-queue': { kind: 'Function', title: 'Queue for NEXUS', body: 'Marks an approved proposal ready for dispatch. It is held until a verified NEXUS adapter exists.' },
  'btn-hold': { kind: 'Function', title: 'Hold task proposal', body: 'Creates a bounded NEXUS task (intent, scope, cost cap). It is stored as “held” — nothing executes yet.' },
  'score-bars': { kind: 'Graph', title: 'Score breakdown', body: 'Each bar is one scoring parameter from 0 to 5. Positive parameters add to the relative score; effort, security risk and uncertainty subtract from it.' },
  'rel-score': { kind: 'Parameter', title: 'Relative score', body: 'Weighted sum of the score breakdown. Use it to compare proposals with each other, not as an absolute measure of value.' },
  'demo-filter': { kind: 'Control', title: 'Demo filter', body: '“Include demo” shows labelled demonstration proposals; “Live only” hides them.' },

  /* ── Scoring parameters ── */
  strategic_alignment: { kind: 'Parameter', title: 'Strategic alignment', body: 'How directly the idea serves FOX’s stated strategy and current priorities.', how: w('strategic_alignment') },
  commercial_value: { kind: 'Parameter', title: 'Commercial value', body: 'Expected revenue, saving or market advantage if it works.', how: w('commercial_value') },
  cross_platform_reuse: { kind: 'Parameter', title: 'Cross-platform reuse', body: 'How many FOX platforms could benefit from the same build.', how: w('cross_platform_reuse') },
  technical_feasibility: { kind: 'Parameter', title: 'Technical feasibility', body: 'Confidence it can be built with available tools, data and skills.', how: w('technical_feasibility') },
  cognitive_amplification: { kind: 'Parameter', title: 'Cognitive amplification', body: 'How much it extends your own judgement — better insight, faster decisions — rather than simply automating.', how: w('cognitive_amplification') },
  evidence_strength: { kind: 'Parameter', title: 'Evidence strength', body: 'Quality and independence of the sources behind the idea.', how: w('evidence_strength') },
  implementation_effort: { kind: 'Parameter', title: 'Implementation effort', body: 'Time and resource required to deliver it.', how: w('implementation_effort') },
  security_risk: { kind: 'Parameter', title: 'Security risk', body: 'Exposure the change could create — data, credentials, access or reputation.', how: w('security_risk') },
  uncertainty: { kind: 'Parameter', title: 'Uncertainty', body: 'How much is still unknown or assumed.', how: w('uncertainty') },

  /* ── Statuses & tiers ── */
  'st-proposed': { kind: 'Status', title: 'Proposed', body: 'New idea, not yet reviewed. Next step: Mark reviewed.' },
  'st-reviewed': { kind: 'Status', title: 'Reviewed', body: 'You have read it. It can now be approved or rejected.' },
  'st-approved': { kind: 'Status', title: 'Approved', body: 'Confirmed by you — shown as a gold moon. Can be queued for NEXUS.' },
  'st-rejected': { kind: 'Status', title: 'Rejected', body: 'Closed by you. No longer shown in the ecosphere.' },
  'st-queued': { kind: 'Status', title: 'Queued', body: 'Waiting for NEXUS dispatch.' },
  'st-running': { kind: 'Status', title: 'Running', body: 'Being executed under NEXUS supervision.' },
  'st-verified': { kind: 'Status', title: 'Verified complete', body: 'Delivered and checked against its acceptance criteria.' },
  'st-failed': { kind: 'Status', title: 'Failed', body: 'Execution did not meet its criteria. Review the run log.' },
  'st-rolled': { kind: 'Status', title: 'Rolled back', body: 'The change was reversed to the previous safe state.' },
  R0: { kind: 'Status', title: 'Risk tier R0', body: 'Analysis of supplied or public data, comparisons and drafts. Runs with available context.' },
  R1: { kind: 'Status', title: 'Risk tier R1', body: 'Read-only queries to connected APIs and internal project data. Needs scoped credentials and logging.' },
  R2: { kind: 'Status', title: 'Risk tier R2', body: 'Draft artefacts, test branches and sandbox jobs. Needs an authorised scope with rate and cost limits.' },
  R3: { kind: 'Status', title: 'Risk tier R3', body: 'Production deploys, spend, critical writes, external messages, credential changes. Needs your specific recorded approval each time.' },
  R4: { kind: 'Status', title: 'Risk tier R4', body: 'Out of bounds (for example invasive neural interfaces or sensitive neurodata). Not available in this service and blocked by the database.' },
  demo: { kind: 'Status', title: 'Demo record', body: 'Illustrative data for showing how the system behaves. Never enters a normal brief.' },
  untrusted: { kind: 'Status', title: 'No trusted source', body: 'None of this proposal’s evidence is verified primary, credible secondary or internal verified, so it cannot enter the brief.' },
  sphere: { kind: 'Status', title: 'Assigned sphere', body: 'The OMNI category this idea orbits in the ecosphere.' },
  unconnected: { kind: 'Status', title: 'Unconnected', body: 'No verified connection exists yet. OMNISYNAPSE does not read data from this system.' },
  'memory-live': { kind: 'Status', title: 'Memory live', body: 'The decision ledger and working context are stored in the database and used by recommendations now.' },
  'badge-link': { kind: 'Status', title: 'Link only · not connected', body: 'A destination link exists, but OMNISYNAPSE receives no data from this platform.' },
  'badge-none': { kind: 'Status', title: 'Not configured', body: 'No destination or connection has been set up for this platform yet.' },
  'badge-self': { kind: 'Status', title: 'This service', body: 'OMNISYNAPSE itself.' },
  'badge-verified': { kind: 'Status', title: 'Read-only · verified', body: 'A tested read-only connection is live and logged.' },

  /* ── Evidence classes ── */
  verified_primary: { kind: 'Parameter', title: 'Verified primary', body: 'Original, authoritative source (official document, dataset, statute). Trusted.' },
  credible_secondary: { kind: 'Parameter', title: 'Credible secondary', body: 'Reputable reporting on a primary source. Trusted.' },
  internal_verified: { kind: 'Parameter', title: 'Internal verified', body: 'FOX’s own checked records. Trusted.' },
  unverified: { kind: 'Parameter', title: 'Unverified', body: 'Not yet checked. Cannot promote a proposal.' },
  hypothesis: { kind: 'Parameter', title: 'Hypothesis', body: 'A reasoned assumption to be tested. Cannot promote a proposal.' },
  speculative: { kind: 'Parameter', title: 'Speculative', body: 'An idea without support. Cannot promote a proposal.' },
  confidence: { kind: 'Parameter', title: 'Confidence', body: 'How sure the source assessment is, from 0 to 100%. Recorded per evidence record.' },

  /* ── Page sections ── */
  'h-ingest': { kind: 'Function', title: 'Ingest records', body: 'Paste a JSON payload of evidence or recommendations (schema in the agent pack). Each record is validated; bad URLs, duplicate IDs and pre-approved statuses are rejected.' },
  'h-ledger': { kind: 'Section', title: 'Evidence ledger', body: 'Every source OMNISYNAPSE may cite, with its classification and confidence.' },
  'h-decisions': { kind: 'Section', title: 'Decision ledger', body: 'Decisions you have recorded, with rationale and later outcomes, so the system learns from what actually happened.' },
  'h-record-decision': { kind: 'Function', title: 'Record a decision', body: 'Saves a decision with its context and expected outcome. Add the real outcome later to close the learning loop.' },
  'h-context': { kind: 'Section', title: 'Working context', body: 'Notes OMNISYNAPSE must take into account. Pinned notes always apply.' },
  'h-registry': { kind: 'Section', title: 'Registry', body: 'All FOX platforms with their honest connection status.' },
  'h-orbit': { kind: 'Section', title: 'ORBIT telemetry inbox', body: 'Where ORBIT monitoring events will land once the read-only adapter is connected.' },
  'h-tiers': { kind: 'Section', title: 'Risk tiers', body: 'R0 analysis → R4 prohibited. The higher the tier, the stronger the approval required.' },
  'h-controls': { kind: 'Section', title: 'Enforced controls', body: 'Rules applied by the database itself, not just the interface — they hold even if the app is bypassed.' },
  'h-hierarchy': { kind: 'Section', title: 'Hierarchy', body: 'Who decides: you (Visionary Innovator) above OMNISYNAPSE, which supervises the specialist council.' },
  'h-nexus': { kind: 'Section', title: 'NEXUS task proposals', body: 'Bounded tasks derived from approved proposals. They stay held until a verified NEXUS adapter exists.' },
  'h-watch': { kind: 'Section', title: 'Watch sources', body: 'Sources OMNISYNAPSE is asked to monitor once research workflows are connected.' },
  'h-account': { kind: 'Function', title: 'Account', body: 'Change your password and see your sign-in details.' },
  'h-functions': { kind: 'Section', title: 'Supervisory functions', body: 'What OMNISYNAPSE is responsible for across the ecosystem.' },
  'sign-out': { kind: 'Function', title: 'Sign out', body: 'Ends your owner session on this device.' },
};

const STATUS_KEY: Record<string, string> = {
  proposed: 'st-proposed', reviewed: 'st-reviewed', approved: 'st-approved', rejected: 'st-rejected', queued: 'st-queued',
  running: 'st-running', 'verified complete': 'st-verified', verified_complete: 'st-verified', failed: 'st-failed', 'rolled back': 'st-rolled', rolled_back: 'st-rolled',
};
const H2_KEY: [RegExp, string][] = [
  [/^ingest/i, 'h-ingest'], [/^ledger/i, 'h-ledger'], [/^decision ledger/i, 'h-decisions'], [/^record a decision/i, 'h-record-decision'],
  [/^working context/i, 'h-context'], [/^registry/i, 'h-registry'], [/^orbit telemetry/i, 'h-orbit'], [/^risk tiers/i, 'h-tiers'],
  [/^enforced controls/i, 'h-controls'], [/^hierarchy/i, 'h-hierarchy'], [/^nexus task/i, 'h-nexus'], [/^watch sources/i, 'h-watch'],
  [/^account/i, 'h-account'], [/supervisory functions/i, 'h-functions'], [/^today/i, 'card-brief'], [/^intelligence cycle/i, 'card-cycle'], [/^next milestone/i, 'card-milestone'],
];
const BTN_KEY: [RegExp, string][] = [
  [/^approve$/i, 'btn-approve'], [/^reject$/i, 'btn-reject'], [/^mark reviewed/i, 'btn-reviewed'], [/^queue for nexus/i, 'btn-queue'],
  [/^hold task/i, 'btn-hold'], [/^assign sphere/i, 'assign-sphere'], [/^review proposals/i, 'btn-review'], [/^add evidence/i, 'btn-add-evidence'],
  [/^sign out/i, 'sign-out'], [/^evidence mode/i, 'mode-evidence'], [/^demo mode/i, 'mode-demo'], [/^include demo|^live only/i, 'demo-filter'],
];
const NAV_KEY: Record<string, string> = {
  '/command': 'nav-brief', '/command/approvals': 'nav-approvals', '/command/evidence': 'nav-evidence', '/command/memory': 'nav-memory',
  '/command/council': 'nav-council', '/command/systems': 'nav-systems', '/command/governance': 'nav-governance', '/command/audit': 'nav-audit',
};

const txt = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

/** Selector rules for markup that has no explicit `data-explain`. Returns an entry key or null. */
export function ruleFor(el: Element): string | null {
  const t = txt(el);
  if (el.matches('.side a.nav')) return NAV_KEY[el.getAttribute('href') ?? ''] ?? null;
  if (el.matches('.badge-link_only')) return 'badge-link';
  if (el.matches('.badge-not_configured')) return 'badge-none';
  if (el.matches('.badge-self')) return 'badge-self';
  if (el.matches('.badge-read_only_verified')) return 'badge-verified';
  if (el.matches('.pill')) {
    const k = t.toLowerCase();
    if (STATUS_KEY[k]) return STATUS_KEY[k];
    if (/^R[0-4]$/.test(t)) return t;
    if (k === 'demo') return 'demo';
    if (k.startsWith('no trusted source')) return 'untrusted';
    if (k.startsWith('◯')) return 'sphere';
    if (k.includes('unconnected')) return 'unconnected';
    if (k.includes('memory live')) return 'memory-live';
    return null;
  }
  if (el.matches('.score-bars > div > span.muted')) return t.replace(/ /g, '_');
  if (el.matches('.score-bars')) return 'score-bars';
  if (el.matches('.card h2, section h2')) return H2_KEY.find(([r]) => r.test(t))?.[1] ?? null;
  if (el.matches('button, a.btn, a.chip, .btn')) return BTN_KEY.find(([r]) => r.test(t))?.[1] ?? null;
  if (el.matches('select[name="sphere_id"]')) return 'assign-sphere';
  if (el.matches('span.muted') && /^\((verified primary|credible secondary|internal verified|unverified|hypothesis|speculative)/.test(t)) {
    return t.slice(1).split(',')[0].trim().replace(/ /g, '_');
  }
  if (el.matches('.small.muted') && /^relative score/i.test(t)) return 'rel-score';
  return null;
}
