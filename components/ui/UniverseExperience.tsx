'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FOX_TOOLS, INTELLIGENCE_CYCLE, NODES, NODE_BY_ID, type FoxTool } from '@/lib/registry/nodes';
import { getState, selectNode, setState, skipIntro, useUniverse, hoverNode } from '@/components/scene/store';
import { FoxMark, OmegaMark } from './Marks';
import { shouldPlayOpener } from './openerGate';
import SymbolIcon from './SymbolIcon';
import { SYMBOL_BY_ID } from '@/lib/registry/symbols';
import { useIdeas } from '@/lib/ideas';

const Ecosphere = dynamic(() => import('@/components/scene/Ecosphere'), { ssr: false });
type View = 'ecosphere' | 'plan';
const OmniOpener = dynamic(() => import('./OmniOpener'), { ssr: false });

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
  const [opener, setOpener] = useState(false);
  const view = useUniverse((s) => s.viewMode);
  const setView = (v: View) => setState({ viewMode: v });
  const selected = useUniverse((s) => s.selected);
  const hovered = useUniverse((s) => s.hovered);
  const introDone = useUniverse((s) => s.introDone);
  const reducedMotion = useUniverse((s) => s.reducedMotion);
  const lowPower = useUniverse((s) => s.lowPower);
  const panelRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const ideas = useIdeas();
  const theme = useUniverse((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggleTheme = () => {
    const next = getState().theme === 'dark' ? 'light' : 'dark';
    setState({ theme: next });
    try {
      localStorage.setItem('omni-theme', next);
    } catch {}
  };

  useEffect(() => {
    setWebgl(hasWebGL());
    try {
      const qt = new URLSearchParams(window.location.search).get('theme') ?? localStorage.getItem('omni-theme');
      if (qt === 'light' || qt === 'dark') setState({ theme: qt });
    } catch {}
    try {
      const qv = new URLSearchParams(window.location.search).get('view');
      if (qv === 'plan' || qv === 'ecosphere') setState({ viewMode: qv });
      else if (localStorage.getItem('omni-view') === 'plan') setState({ viewMode: 'plan' });
    } catch {}
    if (shouldPlayOpener()) {
      setOpener(true);
      setState({ openerActive: true });
    }
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
      else if (e.key === 't' || e.key === 'T') toggleTheme();
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
      {opener && (
        <OmniOpener
          onDone={() => {
            setOpener(false);
            setState({ openerActive: false });
          }}
        />
      )}
      <div className="stage" aria-hidden={webgl === false}>
        {webgl === true && <Ecosphere />}
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
          <button className="chip theme-chip" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Theme (T)">
            <span className={theme === 'dark' ? 'on' : ''}>Dark</span>
            <span className={theme === 'light' ? 'on' : ''}>Light</span>
          </button>
          <button className="chip hide-sm" onClick={toggleFullscreen} title="Fullscreen">
            Fullscreen
          </button>
          <Link href="/command" className="chip chip-gold">
            Command ⟶
          </Link>
        </nav>
      </header>

      {/* View switch — ORBIT style */}
      <div className="viewswitch" role="group" aria-label="Layout">
        {(['ecosphere', 'plan'] as View[]).map((v) => (
          <button
            key={v}
            className={view === v ? 'on' : ''}
            aria-pressed={view === v}
            onClick={() => {
              selectNode(null);
              setView(v);
              try {
                localStorage.setItem('omni-view', v);
              } catch {}
            }}
          >
            {v === 'ecosphere' ? 'Ecosphere' : 'Plan'}
          </button>
        ))}
        <span className="vs-hint hide-sm">{selected ? 'Esc · back to the Ω' : 'Select a globe to bring it to the centre'}</span>
      </div>

      {!node && (
        <>
          <h1 className="eco-title">
            OMNISYNAPSE
            <small>Ω · SUPERVISORY INTELLIGENCE</small>
          </h1>
          <p className="eco-motto">Every idea finds its sphere. Confirmed ideas multiply into moons.</p>
        </>
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
                    <SymbolIcon id={n.symbol} size={18} color={n.accent} />
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
          <div className="panel-top">
            <button className="panel-arrow" onClick={() => cycle(-1)} aria-label="Previous sphere (←)">
              ←<span>Prev</span>
            </button>
            <button className="panel-arrow" onClick={() => cycle(1)} aria-label="Next sphere (→)">
              <span>Next</span>→
            </button>
            <button className="panel-close" onClick={() => selectNode(null)} aria-label="Close panel (Escape)">
              ×
            </button>
          </div>
          <p className="panel-kicker">{node.kind === 'symbol' ? `${node.side === 'left' ? 'Human' : 'Synthetic'} domain` : node.kind}</p>
          <div className="panel-head">
            <span className="panel-sym">
              <SymbolIcon id={node.symbol} size={46} color={node.accent} />
            </span>
            <div>
              <h2 id="panel-title">{node.label}</h2>
              <p className="panel-symname">
                Symbol · {SYMBOL_BY_ID[node.symbol]?.name} — {SYMBOL_BY_ID[node.symbol]?.meaning.toLowerCase()}
              </p>
            </div>
          </div>
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
          <section className="ideas" aria-label="Ideas on this sphere">
            <h4>Ideas on this sphere</h4>
            {!ideas.signedIn ? (
              <p className="hint">
                <Link href="/login">Sign in</Link> to see ideas assigned here. Pending ideas orbit as hollow rings; once you confirm them they become gold moons.
              </p>
            ) : (ideas.bySphere[node.id] ?? []).length === 0 ? (
              <p className="hint">No ideas assigned yet. Assign one from <Link href="/command/approvals">Approvals</Link>.</p>
            ) : (
              <ul>
                {(ideas.bySphere[node.id] ?? []).map((i) => (
                  <li key={i.id}>
                    <span className={`dot ${i.state}`} aria-hidden />
                    <span>
                      {i.title} <small className="muted">· {i.state === 'confirmed' ? 'confirmed' : 'awaiting your review'}</small>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
        </aside>
      )}

      <footer className="statusline">
        <span>
          <i className="led led-off" /> Live integrations: none verified · ORBIT &amp; NEXUS unconnected
        </span>
        <span className="hide-sm">
          {lowPower ? 'Low-power rendering' : 'Full rendering'} · ← → browse · R reset · T theme · Esc close
        </span>
      </footer>
    </div>
  );
}
