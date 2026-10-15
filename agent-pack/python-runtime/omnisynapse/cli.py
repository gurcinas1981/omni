"""Run `python -m omnisynapse.cli --help` from the runtime folder."""
import argparse
import json
from pathlib import Path
import sys
from .core import ensure_db, import_json, build_brief, all_records, now_utc

ROOT=Path(__file__).resolve().parents[2]
DEFAULT_DB=ROOT/'runtime'/'omnisynapse.db'
DEFAULT_CONFIG=ROOT/'config'/'fox_ecosystem.json'
DEFAULT_SCORING=ROOT/'config'/'scoring.json'

def main(argv=None):
    p=argparse.ArgumentParser(prog='OMNISYNAPSE Ω',description='Evidence-first offline FOX strategic intelligence starter')
    sub=p.add_subparsers(dest='command',required=True)
    status=sub.add_parser('status',help='List configured systems and database counts (no connectivity probe)');status.add_argument('--db',default=str(DEFAULT_DB));status.add_argument('--config',default=str(DEFAULT_CONFIG))
    imp=sub.add_parser('ingest',help='Import local evidence/recommendation/decision JSON');imp.add_argument('file');imp.add_argument('--db',default=str(DEFAULT_DB))
    brief=sub.add_parser('brief',help='Build a locally sourced markdown briefing');brief.add_argument('--db',default=str(DEFAULT_DB));brief.add_argument('--config',default=str(DEFAULT_CONFIG));brief.add_argument('--scoring',default=str(DEFAULT_SCORING));brief.add_argument('--out');brief.add_argument('--include-demo',action='store_true',help='Include clearly marked example records')
    scan=sub.add_parser('scan-feeds',help='Read only manually enabled public RSS/Atom sources (requires permission + network)');scan.add_argument('--allow-network',action='store_true',help='Explicit opt-in to source fetch');scan.add_argument('--feeds',default=str(ROOT/'config'/'source_feeds.json'));scan.add_argument('--db',default=str(DEFAULT_DB))
    args=p.parse_args(argv)
    try:
        if args.command=='status':
            cfg=json.loads(Path(args.config).read_text(encoding='utf-8'))
            with ensure_db(args.db) as con:
                print('OMNISYNAPSE Ω · configured integration registry (NOT a connectivity audit)')
                for s in cfg['systems']:
                    print(f"- {s['name']}: {'CONNECTED (configured)' if s.get('connected') else 'UNCONNECTED / UNVERIFIED'} · {s['reference_url']}")
                for kind in ('evidence','recommendation','decision'):
                    print(f'{kind}: {len(all_records(con,kind))} local records')
        elif args.command=='ingest':
            with ensure_db(args.db) as con:
                n=import_json(con,args.file)
                print(f'Ingested or updated {n} validated local records. This does not independently verify their contents.')
        elif args.command=='brief':
            with ensure_db(args.db) as con:
                report=build_brief(con,args.include_demo,args.scoring,args.config)
            if args.out:
                Path(args.out).write_text(report,encoding='utf-8')
                print(f'Wrote {args.out}')
            else:
                print(report)
        elif args.command=='scan-feeds':
            if not args.allow_network:
                raise ValueError('Network disabled by default. Pass --allow-network and enable specific config feeds after reviewing their terms.')
            from .feeds import scan_enabled
            observations,issues=scan_enabled(args.feeds)
            if observations:
                # All are UNVERIFIED observations even when derived from official feeds.
                temp={'kind':'evidence','records':observations}
                import tempfile
                with tempfile.TemporaryDirectory() as td:
                    path=Path(td)/'feed_import.json';path.write_text(json.dumps(temp),encoding='utf-8')
                    with ensure_db(args.db) as con:import_json(con,path)
            print(f'Observed {len(observations)} items from operator-enabled feeds; classification remains unverified.')
            for issue in issues:print('SOURCE WARNING:',issue)
    except (ValueError,OSError,KeyError,json.JSONDecodeError) as exc:
        print(f'ERROR: {exc}',file=sys.stderr);return 2
    return 0

if __name__=='__main__':raise SystemExit(main())
