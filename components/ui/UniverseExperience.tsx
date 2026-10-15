'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FOX_TOOLS, INTELLIGENCE_CYCLE, NODES, NODE_BY_ID, type FoxTool } from '@/lib/registry/nodes';
import { getState, selectNode, setState, skipIntro, useUniverse, hoverNode } from '@/components/scene/store';
import { FoxMark, OmegaMark } from './Marks';

const Universe = dynamic(() => import('@/components/scene/Universe'), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const STATUS_LABEL: Record<FoxTool['integration'], string> = {
  self: 'This service',
  link_only: 'Link only · not connected',
  not_configured: 'Not configured',
  read_only_verified: 'Read-only · verified',
};

function ToolRow({ tool }: { tool: FoxTool }) {
  const external = tool.url?.startsWith('http');
  return (
    <li className="tool">
      <div className="tool-head">
        <span className="tool-name">{tool.name}</span>
        <span className={`badge badge-${tool.integration}`}>{STATUS_LABEL[tool.integration]}</span>
      </div>
      <p className="tool-role">{tool.role}</p>
      {tool.url ? (
        external ? (
          <a className="tool-link" href={tool.url} target="_blank" rel="noopener noreferrer">
            Open {new URL(tool.url).hostname} ↗
          </a>
        ) : (
          <Link className="tool-link" href={tool.url}>
            Open command layer →
          </Link>
        )
      ) : (
        <span className="tool-link muted">No destination configured</span>
      )}
    </li>
  );
}

export default function UniverseExperience() {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const selected = useUniverse((s) => s.selected);
  const hovered = useUniverse((s) => s.hovered);
  const introDone = useUniverse((s) => s.introDone);
  const reducedMotion = useUniverse((s) => s.reducedMotion);
  const lowPower = useUniverse((s) => s.lowPower);
  const panelRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setWebgl(hasWebGL());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('omni-motion');
    } catch {}
    const reduce = stored ? stored === 'reduced' : mq.matches;
    setState({ reducedMotion: reduce });
    if (reduce) skipIntro();
    const hash = window.location.hash.slice(1);
    if (hash && NODE_BY_ID[hash]) {
      skipIntro();
      selectNode(hash);
    }
  }, []);

  const node = selected ? NODE_BY_ID[selected] : null;
  const hoverNodeData = hovered && hovered !== selected ? NODE_BY_ID[hovered] : null;

  useEffect(() => {
    if (node) panelRef.current?.focus({ preventScroll: true });
  }, [node]);

  const cycle = useCallback((dir: 1 | -1) => {
    const idx = NODES.findIndex((n) => n.id === getState().selected);
    const next = NODES[(idx + dir + NODES.length) % NODES.length];
    if (!getState().introDone) skipIntro();
    selectNode(next.id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') selectNode(null);
      else if (e.key === 'r' || e.key === 'R') selectNode(null);
      else if (e.key === 'ArrowRight' || e.key === ']') cycle(1);
      else if (e.key === 'ArrowLeft' || e.key === '[') cycle(-1);
      else if (e.key === 'm' || e.key === 'M') toggleMotion();
      else if (e.key === ' ' && !getState().introDone) {
        e.preventDefault();
        skipIntro();
      } else {
        const hk = NODES.find((n) => n.hotkey === e.key.toLowerCase());
        if (hk && !e.metaKey && !e.ctrlKey) selectNode(hk.id);
      }
    };
    const onMove = (e: PointerEvent) => setTip({ x: e.clientX, y: e.clientY });
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointermove', onMove);
    };
  }, [cycle]);

  const toggleMotion = () => {
    const next = !getState().reducedMotion;
    setState({ reducedMotion: next });
    try {
      localStorage.setItem('omni-motion', next ? 'reduced' : 'full');
    } catch {}
    if (next) skipIntro();
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const groups = useMemo(
    () => [
      { title: 'Core', items: NODES.filter((n) => n.kind === 'core' || n.kind === 'gateway' || n.kind === 'altar') },
      { title: 'Human domains', items: NODES.filter((n) => n.kind === 'symbol' && n.side === 'left') },
      { title: 'Synthetic domains', items: NODES.filter((n) => n.kind === 'symbol' && n.side === 'right') },
      { title: 'Guardians', items: NODES.filter((n) => n.kind === 'guardian') },
    ],
    [],
  );

  return (
    <div className="universe">
      <div className="stage" aria-hidden={webgl === false}>
        {webgl === true && <Universe />}
        {webgl === false && (
          <div className="poster" role="img" aria-label="OMNISYNAPSE temple — static view (WebGL unavailable)" />
        )}
      </div>

      {/* Top bar */}
      <header className="topbar">
        <Link href="/" className="brand" aria-label="OMNISYNAPSE home" onClick={() => selectNode(null)}>
          <OmegaMark size={34} />
          <span className="brand-text">
            <span className="brand-name">OMNISYNAPSE</span>
            <span className="brand-sub">
              <FoxMark size={12} /> FOX Intelligence · supervisory layer
            </span>
          </span>
        </Link>
        <nav className="top-actions" aria-label="View controls">
          <button className="chip" onClick={() => selectNode(null)} title="Reset view (R)">
            Reset
          </button>
          <button className="chip" onClick={toggleMotion} aria-pressed={reducedMotion} title="Reduce motion (M)">
            {reducedMotion ? 'Motion: reduced' : 'Motion: full'}
          </button>
          <button className="chip hide-sm" onClick={toggleFullscreen} title="Fullscreen">
            Fullscreen
          </button>
          <Link href="/command" className="chip chip-gold">
            Command ⟶
          </Link>
        </nav>
      </header>

      {/* Intro title + skip */}
      {!introDone && (
        <div className="intro" role="status">
          <p className="intro-motto">One Mind. Infinite Connections. Continuous Evolution.</p>
          <button className="chip" onClick={skipIntro}>
            Skip intro
          </button>
        </div>
      )}
      {introDone && !node && (
        <div className="hero" aria-hidden="true">
          <p className="hero-title">
            OMNISYNAPSE <span>Ω</span>
          </p>
          <p>The supervisory mind of the FOX ecosystem — select any symbol to explore.</p>
        </div>
      )}

      {/* Accessible navigation rail */}
      <nav className="rail" aria-label="Cognitive universe navigation">
        {groups.map((g) => (
          <div key={g.title} className="rail-group">
            <p className="rail-title">{g.title}</p>
            <ul>
              {g.items.map((n) => (
                <li key={n.id}>
                  <button
                    className={`rail-item ${selected === n.id ? 'on' : ''}`}
                    aria-current={selected === n.id}
                    onClick={() => {
                      if (!getState().introDone) skipIntro();
                      selectNode(n.id);
                    }}
                    onMouseEnter={() => hoverNode(n.id)}
                    onMouseLeave={() => hoverNode(null)}
                    onFocus={() => hoverNode(n.id)}
                    onBlur={() => hoverNode(null)}
                  >
                    <span className="dot" style={{ background: n.accent }} />
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Hover tooltip */}
      {hoverNodeData && tip && (
        <div className="tooltip" style={{ left: tip.x + 16, top: tip.y + 12 }} role="presentation">
          <strong>{hoverNodeData.label}</strong>
          <span>{hoverNodeData.domain}</span>
        </div>
      )}

      {/* Info panel */}
      {node && (
        <aside className="panel" ref={panelRef} tabIndex={-1} aria-labelledby="panel-title">
          <button className="panel-close" onClick={() => selectNode(null)} aria-label="Close panel (Escape)">
            ×
          </button>
          <p className="panel-kicker">{node.kind === 'symbol' ? `${node.side === 'left' ? 'Human' : 'Synthetic'} domain` : node.kind}</p>
          <h2 id="panel-title">{node.label}</h2>
          <p className="panel-domain">{node.domain}</p>
          <p className="panel-desc">{node.description}</p>
          {node.kind === 'altar' && (
            <ol className="cycle">
              {INTELLIGENCE_CYCLE.map((c) => (
                <li key={c.n}>
                  <span>{c.n}</span>
                  <strong>{c.name}</strong>
                  <em>{c.text}</em>
                </li>
              ))}
            </ol>
          )}
          {node.command && (
            <Link className="cta" href={node.command.href}>
              {node.command.label} <span aria-hidden>⟶</span>
              <small>Owner sign-in required</small>
            </Link>
          )}
          <h3 className="panel-sub">Mapped FOX platforms</h3>
          <ul className="tools">
            {node.tools.map((t) => (
              <ToolRow key={t} tool={FOX_TOOLS[t]} />
            ))}
          </ul>
          <div className="panel-nav">
            <button className="chip" onClick={() => cycle(-1)}>
              ← Previous
            </button>
            <button className="chip" onClick={() => cycle(1)}>
              Next →
            </button>
          </div>
        </aside>
      )}

      <footer className="statusline">
        <span>
          <i className="led led-off" /> Live integrations: none verified · ORBIT &amp; NEXUS unconnected
        </span>
        <span className="hide-sm">
          {lowPower ? 'Low-power rendering' : 'Full rendering'} · ← → browse · R reset · M motion · Esc close
        </span>
      </footer>
    </div>
  );
}
