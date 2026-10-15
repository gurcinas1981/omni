// Builds /public/brand/fox-original.svg from the ORBIT four-shard FOX geometry (lib/brand/fox.ts):
// two ears + two cheeks, each faceted to a raised apex and shaded by a fixed key light.
import { writeFileSync } from 'node:fs';
const EAR = [[-0.97, 1.24], [-0.13, 0.21], [-0.97, -0.21]], EAR_APEX = [-0.62, 0.42];
const CHEEK = [[-0.87, -0.27], [-0.34, -0.13], [-0.16, -0.42], [-0.05, -1.34]], CHEEK_APEX = [-0.36, -0.42];
const mirror = (a) => a.map(([x, y]) => [-x, y]).reverse();
const shards = [
  [EAR, EAR_APEX, 0.42], [mirror(EAR), [-EAR_APEX[0], EAR_APEX[1]], 0.42],
  [CHEEK, CHEEK_APEX, 0.36], [mirror(CHEEK), [-CHEEK_APEX[0], CHEEK_APEX[1]], 0.36],
];
const L = (() => { const v = [-0.45, 0.6, 0.66]; const n = Math.hypot(...v); return v.map((x) => x / n); })();
const lerp = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
const DARK = [122, 82, 34], MID = [214, 172, 96], HI = [255, 238, 186];
const S = 100;
let polys = '';
for (const [pts, apex, d] of shards) {
  for (let i = 0; i < pts.length; i++) {
    const p = [...pts[i], 0], q = [...pts[(i + 1) % pts.length], 0], a = [...apex, d];
    const u = q.map((x, k) => x - p[k]), v = a.map((x, k) => x - p[k]);
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = Math.hypot(...n); n = n.map((x) => x / m); if (n[2] < 0) n = n.map((x) => -x);
    const lit = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
    const c = lit < 0.55 ? lerp(DARK, MID, lit / 0.55) : lerp(MID, HI, (lit - 0.55) / 0.45);
    const pt = (z) => `${(z[0] * S).toFixed(1)},${(-z[1] * S).toFixed(1)}`;
    polys += `<polygon points="${pt(p)} ${pt(q)} ${pt(a)}" fill="rgb(${c.join(',')})"/>`;
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-104 -130 208 268" role="img" aria-label="FOX Intelligence"><g stroke="#fff3cf" stroke-width="1.2" stroke-linejoin="round" stroke-opacity=".55">${polys}</g></svg>\n`;
writeFileSync(new URL('../public/brand/fox-original.svg', import.meta.url), svg);
console.log('written', svg.length);
