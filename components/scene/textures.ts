'use client';
import * as THREE from 'three';
import type { SceneNode } from '@/lib/registry/nodes';
import { SYMBOL_ATLAS, SYMBOL_BY_ID } from '@/lib/registry/symbols';

/**
 * Procedural, original artwork drawn on canvas — no third-party assets.
 * Motifs are artistic inspirations; no historical translations are implied.
 */

const GOLD = '#E8C987';
const GOLD_D = '#B48A45';

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  return { c, g };
}

function glowStroke(g: CanvasRenderingContext2D, color: string, width: number, blur = 14) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.shadowColor = color;
  g.shadowBlur = blur;
  g.lineCap = 'round';
  g.lineJoin = 'round';
}

function drawMeditator(g: CanvasRenderingContext2D, s: number, col: string) {
  const cx = s / 2;
  g.fillStyle = col;
  g.shadowColor = '#9BE7FF';
  g.shadowBlur = 24;
  g.beginPath();
  g.arc(cx, s * 0.25, s * 0.07, 0, Math.PI * 2);
  g.fill();
  g.beginPath(); // torso
  g.moveTo(cx - s * 0.07, s * 0.33);
  g.quadraticCurveTo(cx - s * 0.14, s * 0.5, cx - s * 0.09, s * 0.6);
  g.lineTo(cx + s * 0.09, s * 0.6);
  g.quadraticCurveTo(cx + s * 0.14, s * 0.5, cx + s * 0.07, s * 0.33);
  g.closePath();
  g.fill();
  g.beginPath(); // crossed legs
  g.ellipse(cx, s * 0.66, s * 0.26, s * 0.07, 0, 0, Math.PI * 2);
  g.fill();
  glowStroke(g, col, s * 0.035, 18); // arms resting on knees
  g.beginPath();
  g.moveTo(cx - s * 0.08, s * 0.37);
  g.quadraticCurveTo(cx - s * 0.2, s * 0.5, cx - s * 0.2, s * 0.62);
  g.moveTo(cx + s * 0.08, s * 0.37);
  g.quadraticCurveTo(cx + s * 0.2, s * 0.5, cx + s * 0.2, s * 0.62);
  g.stroke();
  // chakra points
  for (let i = 0; i < 6; i++) {
    g.fillStyle = ['#ffffff', '#9BE7FF', '#C8A96A', '#B99CFF', '#ffffff', '#F2B45C'][i];
    g.beginPath();
    g.arc(cx, s * (0.25 + i * 0.065), s * 0.012, 0, Math.PI * 2);
    g.fill();
  }
}

function drawGalaxy(g: CanvasRenderingContext2D, s: number) {
  const cx = s / 2;
  g.shadowBlur = 8;
  for (let arm = 0; arm < 3; arm++) {
    for (let i = 0; i < 520; i++) {
      const t = i / 520;
      const a = arm * ((Math.PI * 2) / 3) + t * Math.PI * 3.2;
      const r = s * 0.03 + t * s * 0.38;
      const jitter = (Math.random() - 0.5) * s * 0.05 * t;
      const x = cx + Math.cos(a) * r + jitter;
      const y = cx + Math.sin(a) * r * 0.82 + jitter;
      const b = 1 - t * 0.7;
      g.fillStyle = `rgba(${200 + 55 * b},${225 + 30 * b},255,${0.25 + b * 0.6})`;
      g.shadowColor = '#7FC8FF';
      g.beginPath();
      g.arc(x, y, s * (0.004 + Math.random() * 0.006), 0, Math.PI * 2);
      g.fill();
    }
  }
  const rg = g.createRadialGradient(cx, cx, 0, cx, cx, s * 0.12);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(1, 'rgba(120,190,255,0)');
  g.fillStyle = rg;
  g.beginPath();
  g.arc(cx, cx, s * 0.12, 0, Math.PI * 2);
  g.fill();
}

function drawPyramid(g: CanvasRenderingContext2D, s: number) {
  const steps = 6;
  const base = s * 0.66;
  const top = s * 0.12;
  const bottomY = s * 0.74;
  const h = s * 0.48;
  for (let i = 0; i < steps; i++) {
    const w = base - ((base - top) * i) / steps;
    const y = bottomY - (h / steps) * (i + 1);
    const grad = g.createLinearGradient(0, y, 0, y + h / steps);
    grad.addColorStop(0, '#F6E2B0');
    grad.addColorStop(1, GOLD_D);
    g.fillStyle = grad;
    g.shadowColor = '#F2B45C';
    g.shadowBlur = 16;
    g.fillRect(s / 2 - w / 2, y, w, h / steps - s * 0.008);
  }
  g.fillStyle = '#FFF4D6';
  g.fillRect(s / 2 - s * 0.03, bottomY - h - s * 0.05, s * 0.06, s * 0.05);
  // stair
  g.fillStyle = 'rgba(80,55,20,0.55)';
  g.beginPath();
  g.moveTo(s / 2 - s * 0.05, bottomY);
  g.lineTo(s / 2 - s * 0.02, bottomY - h);
  g.lineTo(s / 2 + s * 0.02, bottomY - h);
  g.lineTo(s / 2 + s * 0.05, bottomY);
  g.fill();
}

function drawFlower(g: CanvasRenderingContext2D, s: number) {
  const cx = s / 2;
  const r = s * 0.12;
  glowStroke(g, '#DDF6FF', s * 0.008, 12);
  const pts: [number, number][] = [[0, 0]];
  for (let i = 0; i < 6; i++) pts.push([Math.cos((i * Math.PI) / 3) * r, Math.sin((i * Math.PI) / 3) * r]);
  for (let i = 0; i < 6; i++) pts.push([Math.cos((i * Math.PI) / 3) * r * 2, Math.sin((i * Math.PI) / 3) * r * 2]);
  for (let i = 0; i < 6; i++) pts.push([Math.cos((i * Math.PI) / 3 + Math.PI / 6) * r * 1.732, Math.sin((i * Math.PI) / 3 + Math.PI / 6) * r * 1.732]);
  for (const [x, y] of pts) {
    g.beginPath();
    g.arc(cx + x, cx + y, r, 0, Math.PI * 2);
    g.stroke();
  }
  glowStroke(g, GOLD, s * 0.012, 16);
  g.beginPath();
  g.arc(cx, cx, r * 3, 0, Math.PI * 2);
  g.stroke();
  // star of two triangles
  glowStroke(g, '#ffffff', s * 0.006, 10);
  for (const rot of [0, Math.PI]) {
    g.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = rot - Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const x = cx + Math.cos(a) * r * 2.6;
      const y = cx + Math.sin(a) * r * 2.6;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
}

function drawEye(g: CanvasRenderingContext2D, s: number) {
  const cx = s / 2;
  const cy = s * 0.45;
  glowStroke(g, GOLD, s * 0.04, 20);
  g.beginPath(); // brow
  g.moveTo(s * 0.18, s * 0.3);
  g.quadraticCurveTo(cx, s * 0.2, s * 0.84, s * 0.3);
  g.stroke();
  g.beginPath(); // almond
  g.moveTo(s * 0.2, cy);
  g.quadraticCurveTo(cx, s * 0.27, s * 0.82, cy);
  g.quadraticCurveTo(cx, s * 0.6, s * 0.2, cy);
  g.stroke();
  g.fillStyle = GOLD;
  g.beginPath();
  g.arc(cx + s * 0.02, cy, s * 0.075, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#FFF6DA';
  g.beginPath();
  g.arc(cx + s * 0.04, cy - s * 0.02, s * 0.022, 0, Math.PI * 2);
  g.fill();
  glowStroke(g, GOLD, s * 0.035, 18);
  g.beginPath(); // tear line
  g.moveTo(s * 0.4, s * 0.53);
  g.lineTo(s * 0.38, s * 0.76);
  g.stroke();
  g.beginPath(); // spiral tail
  g.moveTo(s * 0.5, s * 0.54);
  g.quadraticCurveTo(s * 0.56, s * 0.66, s * 0.66, s * 0.72);
  g.arc(s * 0.7, s * 0.67, s * 0.05, Math.PI * 0.75, Math.PI * 2.4);
  g.stroke();
}

function drawScarab(g: CanvasRenderingContext2D, s: number) {
  const cx = s / 2;
  g.fillStyle = GOLD;
  g.shadowColor = '#F2B45C';
  g.shadowBlur = 16;
  g.beginPath();
  g.ellipse(cx, s * 0.55, s * 0.15, s * 0.2, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(cx, s * 0.31, s * 0.1, s * 0.06, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath(); // head
  g.ellipse(cx, s * 0.22, s * 0.06, s * 0.04, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#4b3510';
  g.lineWidth = s * 0.01;
  g.shadowBlur = 0;
  g.beginPath();
  g.moveTo(cx, s * 0.37);
  g.lineTo(cx, s * 0.75);
  g.stroke();
  glowStroke(g, GOLD, s * 0.022, 12);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y = s * (0.36 + i * 0.12);
      g.beginPath();
      g.moveTo(cx + side * s * 0.12, y);
      g.lineTo(cx + side * s * 0.26, y - s * 0.04 + i * s * 0.03);
      g.lineTo(cx + side * s * 0.3, y + s * 0.04 + i * s * 0.02);
      g.stroke();
    }
    g.beginPath(); // antenna/sun claws
    g.moveTo(cx + side * s * 0.04, s * 0.19);
    g.quadraticCurveTo(cx + side * s * 0.14, s * 0.1, cx + side * s * 0.08, s * 0.06);
    g.stroke();
  }
  glowStroke(g, '#FFF2C8', s * 0.012, 18); // sun disc
  g.beginPath();
  g.arc(cx, s * 0.1, s * 0.05, 0, Math.PI * 2);
  g.stroke();
}

function drawMandala(g: CanvasRenderingContext2D, s: number) {
  const cx = s / 2;
  for (let i = 0; i < 6; i++) {
    const r = s * (0.36 - i * 0.055);
    glowStroke(g, i % 2 ? GOLD_D : GOLD, s * 0.016, 12);
    g.save();
    g.translate(cx, cx);
    g.rotate(i % 2 ? Math.PI / 4 : 0);
    g.strokeRect(-r, -r, r * 2, r * 2);
    g.restore();
  }
  // stepped cross
  g.fillStyle = '#F6E2B0';
  g.shadowColor = '#F2B45C';
  g.shadowBlur = 14;
  const u = s * 0.035;
  const cells = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, -1], [1, -1], [-1, 1]];
  for (const [x, y] of cells) g.fillRect(cx + x * u - u / 2, cx + y * u - u / 2, u * 0.9, u * 0.9);
}

function drawTriangle(g: CanvasRenderingContext2D, s: number) {
  const cx = s / 2;
  for (const [r, col, w] of [[0.36, GOLD, 0.03], [0.24, '#D9C7FF', 0.014], [0.14, '#B99CFF', 0.01]] as const) {
    glowStroke(g, col, s * w, 16);
    g.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const x = cx + Math.cos(a) * s * r;
      const y = cx * 1.1 + Math.sin(a) * s * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  const rg = g.createRadialGradient(cx, cx * 1.1, 0, cx, cx * 1.1, s * 0.12);
  rg.addColorStop(0, '#FFFFFF');
  rg.addColorStop(0.3, '#E2B8FF');
  rg.addColorStop(1, 'rgba(156,107,255,0)');
  g.fillStyle = rg;
  g.beginPath();
  g.arc(cx, cx * 1.1, s * 0.12, 0, Math.PI * 2);
  g.fill();
}

export function motifTexture(motif: NonNullable<SceneNode['motif']>) {
  const s = 512;
  const { c, g } = canvas(s, s);
  // dark glass disc with subtle radial
  const bg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  bg.addColorStop(0, 'rgba(18,40,64,0.95)');
  bg.addColorStop(0.75, 'rgba(6,14,26,0.95)');
  bg.addColorStop(1, 'rgba(6,14,26,0)');
  g.fillStyle = bg;
  g.beginPath();
  g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  g.fill();
  // fine tick ring
  g.strokeStyle = 'rgba(120,200,255,0.35)';
  g.lineWidth = 2;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r1 = s * 0.455;
    const r2 = s * (i % 6 === 0 ? 0.425 : 0.44);
    g.beginPath();
    g.moveTo(s / 2 + Math.cos(a) * r1, s / 2 + Math.sin(a) * r1);
    g.lineTo(s / 2 + Math.cos(a) * r2, s / 2 + Math.sin(a) * r2);
    g.stroke();
  }
  g.save();
  switch (motif) {
    case 'meditator': drawMeditator(g, s, '#E9FAFF'); break;
    case 'galaxy': drawGalaxy(g, s); break;
    case 'pyramid': drawPyramid(g, s); break;
    case 'flower': drawFlower(g, s); break;
    case 'eye': drawEye(g, s); break;
    case 'scarab': drawScarab(g, s); break;
    case 'mandala': drawMandala(g, s); break;
    case 'triangle': drawTriangle(g, s); break;
  }
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Carved obsidian pillar face with gold reliefs. Returns colour + emissive maps. */
export function columnTextures(side: 'left' | 'right') {
  const w = 512;
  const h = 2048;
  const { c, g } = canvas(w, h);
  const em = canvas(w, h);
  // stone
  g.fillStyle = '#0d1117';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    const v = 14 + Math.random() * 18;
    g.fillStyle = `rgba(${v},${v + 2},${v + 6},0.5)`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  em.g.fillStyle = '#000';
  em.g.fillRect(0, 0, w, h);
  const both = (fn: (k: CanvasRenderingContext2D, isEm: boolean) => void) => {
    fn(g, false);
    fn(em.g, true);
  };
  const gold = (k: CanvasRenderingContext2D, isEm: boolean, a = 1) => {
    k.fillStyle = isEm ? `rgba(200,150,70,${0.55 * a})` : GOLD;
    k.strokeStyle = isEm ? `rgba(200,150,70,${0.55 * a})` : GOLD;
  };
  // borders
  both((k, e) => {
    gold(k, e, 0.7);
    k.lineWidth = 10;
    k.strokeRect(22, 22, w - 44, h - 44);
    k.lineWidth = 3;
    k.strokeRect(44, 44, w - 88, h - 88);
  });
  // glyph band helper (abstract, non-linguistic marks)
  const glyphBand = (y: number, rows: number) =>
    both((k, e) => {
      gold(k, e, 0.5);
      k.lineWidth = 3;
      for (let r = 0; r < rows; r++)
        for (let col = 0; col < 7; col++) {
          const x = 78 + col * 52;
          const yy = y + r * 54;
          const seed = Math.sin((col + 1) * 12.9898 + (r + 1) * 78.233 + (side === 'left' ? 0 : 3)) * 43758.5453;
          const kind = Math.floor((seed - Math.floor(seed)) * 6);
          k.beginPath();
          if (kind === 0) k.arc(x + 14, yy + 18, 10, 0, Math.PI * 2);
          else if (kind === 1) { k.moveTo(x, yy + 30); k.lineTo(x + 14, yy + 4); k.lineTo(x + 28, yy + 30); }
          else if (kind === 2) { k.moveTo(x + 14, yy); k.lineTo(x + 14, yy + 34); k.moveTo(x + 2, yy + 12); k.lineTo(x + 26, yy + 12); }
          else if (kind === 3) { k.moveTo(x, yy + 8); k.quadraticCurveTo(x + 28, yy + 8, x + 14, yy + 32); }
          else if (kind === 4) k.rect(x + 4, yy + 6, 20, 24);
          else { k.moveTo(x, yy + 18); k.lineTo(x + 28, yy + 18); k.moveTo(x + 6, yy + 6); k.lineTo(x + 22, yy + 30); }
          k.stroke();
        }
    });
  const panel = (y: number, ph: number, draw: (k: CanvasRenderingContext2D, e: boolean) => void) =>
    both((k, e) => {
      gold(k, e, 0.8);
      k.lineWidth = 4;
      k.strokeRect(64, y, w - 128, ph);
      k.save();
      k.translate(w / 2, y + ph / 2);
      draw(k, e);
      k.restore();
    });
  if (side === 'left') {
    panel(90, 330, (k, e) => { // eye
      gold(k, e);
      k.lineWidth = 14;
      k.beginPath(); k.moveTo(-130, -70); k.quadraticCurveTo(0, -120, 130, -70); k.stroke();
      k.beginPath(); k.moveTo(-130, -10); k.quadraticCurveTo(0, -90, 130, -10); k.quadraticCurveTo(0, 50, -130, -10); k.stroke();
      k.beginPath(); k.arc(5, -15, 30, 0, Math.PI * 2); k.fill();
      k.beginPath(); k.moveTo(-40, 25); k.lineTo(-50, 110); k.moveTo(20, 28); k.quadraticCurveTo(50, 90, 90, 100); k.stroke();
    });
    panel(470, 380, (k, e) => { // ankh
      gold(k, e);
      k.lineWidth = 26;
      k.beginPath(); k.ellipse(0, -100, 48, 66, 0, 0, Math.PI * 2); k.stroke();
      k.fillRect(-13, -34, 26, 200);
      k.fillRect(-100, -30, 200, 26);
    });
    panel(900, 360, (k, e) => { // winged falcon
      gold(k, e);
      for (const sd of [-1, 1])
        for (let f = 0; f < 6; f++) {
          k.beginPath();
          k.moveTo(sd * 20, -30 + f * 4);
          k.quadraticCurveTo(sd * (90 + f * 6), -100 + f * 22, sd * (170 - f * 10), -40 + f * 26);
          k.lineTo(sd * (150 - f * 12), -24 + f * 26);
          k.quadraticCurveTo(sd * 80, -50 + f * 18, sd * 20, -10 + f * 6);
          k.fill();
        }
      k.beginPath(); k.ellipse(0, 0, 28, 70, 0, 0, Math.PI * 2); k.fill();
      k.beginPath(); k.arc(0, -86, 24, 0, Math.PI * 2); k.fill();
      k.beginPath(); k.moveTo(-26, 60); k.lineTo(0, 140); k.lineTo(26, 60); k.fill();
    });
    glyphBand(1310, 11);
  } else {
    panel(90, 360, (k, e) => { // sun face
      gold(k, e);
      k.lineWidth = 8;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        k.beginPath(); k.moveTo(Math.cos(a) * 95, Math.sin(a) * 95); k.lineTo(Math.cos(a) * 150, Math.sin(a) * 150); k.stroke();
      }
      k.beginPath(); k.arc(0, 0, 92, 0, Math.PI * 2); k.stroke();
      k.beginPath(); k.arc(0, 0, 70, 0, Math.PI * 2); k.stroke();
      k.fillRect(-36, -26, 22, 10); k.fillRect(14, -26, 22, 10);
      k.fillRect(-6, -10, 12, 30); k.fillRect(-28, 34, 56, 10);
    });
    panel(500, 360, (k, e) => { // stepped temple
      gold(k, e);
      for (let i = 0; i < 6; i++) k.fillRect(-150 + i * 22, 130 - i * 38, 300 - i * 44, 30);
      k.fillRect(-28, -120, 56, 48);
      k.fillStyle = e ? '#000' : '#0d1117';
      k.fillRect(-14, -12, 28, 142);
    });
    panel(910, 360, (k, e) => { // calendar disc
      gold(k, e);
      k.lineWidth = 6;
      for (const r of [150, 118, 86, 52]) { k.beginPath(); k.arc(0, 0, r, 0, Math.PI * 2); k.stroke(); }
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        k.save(); k.rotate(a); k.strokeRect(-9, -146, 18, 24); k.restore();
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        k.beginPath(); k.moveTo(Math.cos(a) * 52, Math.sin(a) * 52); k.lineTo(Math.cos(a) * 86, Math.sin(a) * 86); k.stroke();
      }
      k.beginPath(); k.arc(0, 0, 26, 0, Math.PI * 2); k.fill();
    });
    glyphBand(1330, 11);
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const emissiveMap = new THREE.CanvasTexture(em.c);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

/** Soft round sprite for particles. */
export function dotTexture() {
  const { c, g } = canvas(64, 64);
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.25, 'rgba(255,255,255,0.7)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  return t;
}

/* ───────── OMNI Symbol Library medallion faces ───────── */
let atlasImg: Promise<HTMLImageElement> | null = null;
function loadAtlas() {
  if (!atlasImg)
    atlasImg = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = SYMBOL_ATLAS.src;
    });
  return atlasImg;
}

/** Dark glass disc with tick ring and the category's library symbol, tinted and glowing. */
export function symbolDiscTexture(symbolId: string, tint: string) {
  const s = 512;
  const { c, g } = canvas(s, s);
  const bg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  bg.addColorStop(0, 'rgba(18,40,64,0.95)');
  bg.addColorStop(0.75, 'rgba(6,14,26,0.95)');
  bg.addColorStop(1, 'rgba(6,14,26,0)');
  g.fillStyle = bg;
  g.beginPath();
  g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(120,200,255,0.35)';
  g.lineWidth = 2;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r1 = s * 0.455;
    const r2 = s * (i % 6 === 0 ? 0.425 : 0.44);
    g.beginPath();
    g.moveTo(s / 2 + Math.cos(a) * r1, s / 2 + Math.sin(a) * r1);
    g.lineTo(s / 2 + Math.cos(a) * r2, s / 2 + Math.sin(a) * r2);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sym = SYMBOL_BY_ID[symbolId];
  if (sym)
    loadAtlas()
      .then((img) => {
        const cell = img.width / SYMBOL_ATLAS.cols;
        const tmp = canvas(256, 256);
        tmp.g.drawImage(img, sym.col * cell, sym.row * cell, cell, cell, 0, 0, 256, 256);
        tmp.g.globalCompositeOperation = 'source-in';
        tmp.g.fillStyle = tint;
        tmp.g.fillRect(0, 0, 256, 256);
        g.save();
        g.shadowColor = tint;
        g.shadowBlur = 22;
        const d = s * 0.62;
        g.drawImage(tmp.c, (s - d) / 2, (s - d) / 2, d, d);
        g.restore();
        tex.needsUpdate = true;
      })
      .catch(() => {});
  return tex;
}
