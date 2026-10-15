/**
 * OMNI Symbol Library — "Ancient wisdom × future intelligence".
 * Sprites live in /public/symbols/omni-symbols.png: an 8 × 4 atlas of 256px white-on-transparent tiles,
 * cut from agent-pack/environment/omni-symbol-library.png in this exact order (row-major).
 * Meanings are the library's own artistic labels, not verified historical translations.
 */
export interface OmniSymbol {
  id: string;
  name: string;
  meaning: string;
  col: number;
  row: number;
}

const GRID: [string, string, string][][] = [
  [['brain', 'Brain', 'Human intelligence'], ['omega', 'Omega', 'OMNI'], ['fox', 'Fox', 'Logo'], ['eye-of-horus', 'Eye of Horus', 'Protection / insight'], ['ankh', 'Ankh', 'Life / immortality'], ['scarab', 'Scarab', 'Transformation'], ['horus-isis', 'Horus / Isis', 'Divine power'], ['sun-god', 'Sun god', 'Energy / renewal']],
  [['pyramid', 'Pyramid', 'Foundation'], ['galaxy', 'Galaxy / spiral', 'Universe'], ['atom', 'Atom', 'Science'], ['tech-matrix', 'Tech matrix', 'Technology'], ['triangle', 'Triangle / illumination', 'Consciousness'], ['tree-of-life', 'Tree of life', 'Connection'], ['human-mind', 'Human mind', 'Consciousness'], ['orbital-system', 'Orbital system', 'Integration']],
  [['earth', 'Earth', 'Planet / home'], ['orbit', 'Orbit', 'Harmony'], ['light-beam', 'Light beam', 'Energy / awakening'], ['star', 'Star', 'Guidance'], ['circuit', 'Circuit', 'Technology / AI'], ['dna', 'DNA', 'Evolution'], ['binary-code', 'Binary code', 'Data / knowledge'], ['step-pyramid', 'Step pyramid', 'Ascension']],
  [['anubis', 'Anubis', 'Guardian'], ['obelisk', 'Obelisk', 'Power / transmission'], ['futuristic-city', 'Futuristic city', 'Progress'], ['portal', 'Portal', 'New realms'], ['energy-platform', 'Energy platform', 'Transformation'], ['hieroglyphic-code', 'Hieroglyphic code', 'Ancient knowledge'], ['infinity', 'Infinity', 'Eternity'], ['sacred-geometry', 'Sacred geometry', 'Universal order']],
];

export const SYMBOL_ATLAS = { src: '/symbols/omni-symbols.png', cols: 8, rows: 4 };

export const OMNI_SYMBOLS: OmniSymbol[] = GRID.flatMap((r, row) => r.map(([id, name, meaning], col) => ({ id, name, meaning, col, row })));

/** Everything that orbits — the Ω and the FOX are the centre, not satellites. */
export const ORBITING_SYMBOLS = OMNI_SYMBOLS.filter((s) => s.id !== 'omega' && s.id !== 'fox');

export const SYMBOL_BY_ID: Record<string, OmniSymbol> = Object.fromEntries(OMNI_SYMBOLS.map((s) => [s.id, s]));
