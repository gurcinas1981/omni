/** Minimal, safe markdown renderer for briefs (bold, links, headings, ordered lists). No HTML injection. */
import { Fragment } from 'react';

function inline(text: string, key: string) {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${key}-b${i++}`}>{m[1]}</strong>);
    else out.push(
      <a key={`${key}-a${i++}`} href={m[3]} target="_blank" rel="noopener noreferrer">
        {m[2]}
      </a>,
    );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ source }: { source: string }) {
  const lines = source.split('\n');
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ol key={`ol${blocks.length}`}>
          {list.map((l, i) => (
            <li key={i}>{inline(l, `li${blocks.length}-${i}`)}</li>
          ))}
        </ol>,
      );
      list = [];
    }
  };
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const li = line.match(/^\d+\.\s+(.*)$/);
    if (li) return void list.push(li[1]);
    flush();
    if (!line.trim()) return;
    if (line.startsWith('## ')) blocks.push(<h2 key={idx}>{line.slice(3)}</h2>);
    else if (line.startsWith('# ')) blocks.push(<h1 key={idx}>{line.slice(2)}</h1>);
    else blocks.push(<p key={idx}>{inline(line, `p${idx}`)}</p>);
  });
  flush();
  return <div className="brief">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
