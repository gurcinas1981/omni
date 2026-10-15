// Converts a font (woff/ttf/otf) into a three.js typeface JSON (facetype.js format) for extruded 3D wordmarks.
// usage: node scripts/font-to-typeface.mjs <in.woff> <out.json> [chars]
import { readFileSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';
const [, , src, out, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ·-.Ω'] = process.argv;
const buf = readFileSync(src);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const scale = 1000 / font.unitsPerEm;
const r = (v) => Math.round(v * scale);
const glyphs = {};
for (const ch of new Set(chars)) {
  const g = font.charToGlyph(ch);
  if (!g || (g.index === 0 && ch !== ' ')) continue;
  const o = (g.path.commands || [])
    .map((c) => {
      switch (c.type) {
        case 'M': return `m ${r(c.x)} ${r(c.y)}`;
        case 'L': return `l ${r(c.x)} ${r(c.y)}`;
        case 'Q': return `q ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)}`;
        case 'C': return `b ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)}`;
        default: return '';
      }
    })
    .filter(Boolean)
    .join(' ');
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o };
}
const json = {
  glyphs,
  familyName: font.names.fontFamily?.en || 'Font',
  ascender: r(font.ascender),
  descender: r(font.descender),
  underlinePosition: r(font.tables.post?.underlinePosition ?? -100),
  underlineThickness: r(font.tables.post?.underlineThickness ?? 50),
  boundingBox: { yMin: r(font.tables.head.yMin), xMin: r(font.tables.head.xMin), yMax: r(font.tables.head.yMax), xMax: r(font.tables.head.xMax) },
  resolution: 1000,
  original_font_information: { license: 'SIL Open Font License 1.1 (Michroma by Vernon Adams)' },
};
writeFileSync(out, JSON.stringify(json));
console.log(`${Object.keys(glyphs).length} glyphs → ${out}`);
