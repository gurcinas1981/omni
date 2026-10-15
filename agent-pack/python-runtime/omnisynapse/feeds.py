"""Optional operator-initiated public RSS/Atom observation-only collector.

Use only explicitly enabled sources. Observations are unverified and never automatically
become evaluated recommendations. No login, brute-force or arbitrary page scraping.
"""
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import json
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

from .core import is_valid_http_url, now_utc, validate_record

MAX_BYTES=1_000_000
ATOM='{http://www.w3.org/2005/Atom}'

def clean(text):
    return ' '.join((text or '').split())[:1200]

def scan_enabled(config_path, max_per_feed=8):
    config=json.loads(Path(config_path).read_text(encoding='utf-8'))
    results=[];problems=[]
    for feed in config.get('feeds',[]):
        if not feed.get('enabled'):
            continue
        url=feed['url']
        if not is_valid_http_url(url):
            problems.append(f'Invalid feed URL: {feed.get("id")}');continue
        try:
            req=Request(url,headers={'User-Agent':'FOX-OMNISYNAPSE/1.0 (operator-initiated RSS reader)','Accept':'application/rss+xml,application/atom+xml,application/xml,text/xml'})
            # Fetch only whitelisted configured URLs; no redirect following to private networks in a production deployment.
            with urlopen(req,timeout=10) as resp:
                if resp.geturl()!=url and urlsplit(resp.geturl()).hostname!=urlsplit(url).hostname:
                    raise ValueError('Cross-host redirect denied')
                raw=resp.read(MAX_BYTES+1)
                if len(raw)>MAX_BYTES: raise ValueError('Feed too large')
            doc=ET.fromstring(raw)
            rss=doc.findall('.//item')
            if rss:
                entries=[]
                for x in rss[:max_per_feed]:
                    entries.append((x.findtext('title'),x.findtext('link'),x.findtext('description'),x.findtext('pubDate')))
            else:
                entries=[]
                for x in doc.findall(f'.//{ATOM}entry')[:max_per_feed]:
                    link=x.find(f'{ATOM}link')
                    entries.append((x.findtext(f'{ATOM}title'),link.get('href') if link is not None else None,x.findtext(f'{ATOM}summary') or x.findtext(f'{ATOM}content'),x.findtext(f'{ATOM}updated') or x.findtext(f'{ATOM}published')))
            for title,link,summary,published in entries:
                if not is_valid_http_url(link):continue
                # Identifier based on link avoids unstable ordering and duplicate ingestion.
                import hashlib
                ev={'id':'feed_'+hashlib.sha256(link.encode()).hexdigest()[:20], 'title':clean(title) or '(untitled)','summary':clean(summary) or 'RSS/Atom feed observation; content not independently verified.', 'source_url':link,'published_at':published,'observed_at':now_utc(),'classification':'unverified','project_id':feed.get('domain','research'),'confidence':0.35,'demo':False}
                results.append(validate_record('evidence',ev))
        except Exception as exc:
            problems.append(f'{feed.get("id","feed")}: {type(exc).__name__} ({str(exc)[:140]})')
    return results,problems
