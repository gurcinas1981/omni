"""SQLite-backed local ingestion and deterministic decision reporting.

No external calls, side-effecting connector invocations or automatic approvals.
"""
from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
import json
import sqlite3
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

KINDS = {"evidence", "recommendation", "decision"}
CLASSIFICATIONS = {"verified_primary", "credible_secondary", "internal_verified", "unverified", "hypothesis", "speculative"}
SCORE_FIELDS = {"strategic_alignment", "commercial_value", "cross_platform_reuse", "technical_feasibility", "cognitive_amplification", "evidence_strength", "implementation_effort", "security_risk", "uncertainty"}
DEFAULT_SCORING = {"strategic_alignment":5, "commercial_value":4, "cross_platform_reuse":4, "technical_feasibility":3, "cognitive_amplification":3, "evidence_strength":5, "implementation_effort":-2, "security_risk":-4, "uncertainty":-3}


def now_utc():
    return datetime.now(timezone.utc).isoformat()


def ensure_db(db_path):
    db_path = Path(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db_path)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, received_at TEXT NOT NULL, PRIMARY KEY(kind,id))")
    con.execute("CREATE TABLE IF NOT EXISTS audit (audit_id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, operation TEXT NOT NULL, record_kind TEXT NOT NULL, record_id TEXT NOT NULL)")
    con.commit()
    return con


def is_valid_http_url(s):
    if not isinstance(s, str):
        return False
    try:
        parts = urlsplit(s)
        return parts.scheme in {"http", "https"} and bool(parts.hostname) and not parts.username and not parts.password
    except ValueError:
        return False


def validate_record(kind, obj):
    if kind not in KINDS:
        raise ValueError(f"Unsupported record kind {kind!r}")
    if not isinstance(obj, dict) or not isinstance(obj.get("id"), str) or not obj["id"].strip():
        raise ValueError("Every record requires a non-empty string id")
    if len(obj["id"]) > 128:
        raise ValueError("Record id too long")
    if kind == "evidence":
        for key in ("title", "summary", "source_url", "observed_at", "classification", "project_id"):
            if not isinstance(obj.get(key), str) or not obj[key].strip():
                raise ValueError(f"Evidence requires string field: {key}")
        if not is_valid_http_url(obj["source_url"]):
            raise ValueError("Evidence requires valid http(s) source_url without embedded credentials")
        if obj["classification"] not in CLASSIFICATIONS:
            raise ValueError("Unknown evidence classification")
        value = obj.get("confidence", 0)
        if type(value) not in (int, float) or not (0 <= value <= 1):
            raise ValueError("Evidence confidence must be 0..1")
    if kind == "recommendation":
        for key in ("title", "summary", "cognitive_benefit", "estimated_effort"):
            if not isinstance(obj.get(key), str) or not obj[key].strip():
                raise ValueError(f"Recommendation requires field: {key}")
        if not isinstance(obj.get("evidence_ids"), list) or not all(isinstance(s,str) for s in obj["evidence_ids"]):
            raise ValueError("Recommendation evidence_ids must be an array of strings")
        if not isinstance(obj.get("impacted_systems"), list):
            raise ValueError("Recommendation impacted_systems must be array")
        scores = obj.get("scores")
        if not isinstance(scores, dict) or not scores or set(scores) - SCORE_FIELDS:
            raise ValueError("Recommendation scores must use allowed named score fields")
        for k,v in scores.items():
            if type(v) not in (int,float) or not 0 <= v <= 5:
                raise ValueError(f"Invalid {k} score (expected 0..5)")
        price = obj.get("cost_gbp")
        if price is not None and (type(price) not in (int,float) or price < 0):
            raise ValueError("cost_gbp must be null or >= 0")
        if obj.get("status") not in {"proposed", "reviewed", "approved", "rejected", "queued", "completed", "failed"}:
            raise ValueError("Invalid recommendation status")
    if kind == "decision":
        if "approved_by_human" not in obj or type(obj["approved_by_human"]) is not bool:
            raise ValueError("Decision approved_by_human must be explicitly boolean")
        if "hypothesis" not in obj or "decision" not in obj:
            raise ValueError("Decision requires hypothesis and decision")
    return obj


def import_json(con, path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, dict) or data.get("kind") not in KINDS or not isinstance(data.get("records"), list):
        raise ValueError("Input must be {'kind': 'evidence|recommendation|decision', 'records': [..]}")
    kind = data["kind"]
    rows = [validate_record(kind, row) for row in data["records"]]
    with con:
        for row in rows:
            # Upsert conservatively to support later corrections, with an audit record.
            con.execute("INSERT INTO records(kind,id,payload,received_at) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload, received_at=excluded.received_at", (kind,row["id"],json.dumps(row,ensure_ascii=False),now_utc()))
            con.execute("INSERT INTO audit(at,operation,record_kind,record_id) VALUES(?,?,?,?)", (now_utc(),"import_or_update",kind,row["id"]))
    return len(rows)


def all_records(con, kind):
    return [json.loads(r[0]) for r in con.execute("SELECT payload FROM records WHERE kind=?",(kind,))]


def load_scoring(config_path=None):
    if not config_path:
        return DEFAULT_SCORING
    data = json.loads(Path(config_path).read_text(encoding="utf-8"))
    weights = data.get("weights",{})
    if not set(weights) <= SCORE_FIELDS or any(type(v) not in (int,float) for v in weights.values()):
        raise ValueError("Invalid scoring weights config")
    return {**DEFAULT_SCORING,**weights}


def score_recommendation(row, weights=None):
    weights = weights or DEFAULT_SCORING
    return sum(weights.get(key,0) * row.get("scores",{}).get(key,0) for key in SCORE_FIELDS)


def eligible_recommendations(con, include_demo=False):
    evidence={row['id']:row for row in all_records(con,"evidence")}
    result=[]
    for rec in all_records(con,"recommendation"):
        if rec.get('demo',False) and not include_demo:
            continue
        if rec.get('status') in {'rejected','failed'}:
            continue
        ids=rec.get('evidence_ids',[])
        sources=[]
        for rid in ids:
            ev=evidence.get(rid)
            if ev is not None and (not ev.get('demo') or include_demo) and ev.get('classification') in {'verified_primary','credible_secondary','internal_verified'}:
                sources.append(ev)
        # A proposal with no actually ingested, reasonably trusted source cannot be promoted.
        if not sources:
            continue
        result.append((rec,sources))
    return result


def build_brief(con, include_demo=False, scoring=None, config=None):
    """Data-driven report: no made-up news, statuses, cognitive improvements or integration claims."""
    uk_date=datetime.now(ZoneInfo('Europe/London')).strftime('%d %B %Y')
    rows=eligible_recommendations(con,include_demo=include_demo)
    weights=load_scoring(scoring)
    rows.sort(key=lambda item:score_recommendation(item[0],weights),reverse=True)
    rows=rows[:3]
    descriptor='DEMONSTRATION — DO NOT TREAT AS LIVE INTELLIGENCE' if include_demo else 'EVIDENCE-BASED LOCAL PROTOTYPE — NO LIVE SYSTEM ACCESS'
    report=[f'# OMNISYNAPSE Ω — FOX DAILY EXECUTIVE INTELLIGENCE',f'**Date (UK):** {uk_date}  ',f'**Mode:** {descriptor}  ',f'**Source scope:** Locally ingested evidence only; no external research or FOX system access occurred.','']
    if config:
        data=json.loads(Path(config).read_text(encoding='utf-8'))
        missing=[s.get('name','?') for s in data.get('systems',[]) if not s.get('connected',False)]
        if missing:
            report.append('**Unconnected/unverified FOX systems:** '+', '.join(missing)+'.')
            report.append('')
    if not rows:
        report += ['**Strategic signal:** No current actionable proposal supported by ingested verified evidence. Connect authorised sources or import cited recommendations before drawing operational conclusions.','','**Top upgrades:** None validated in this local prototype.','','**New horizon:** Not assessed without current research.','**Risk:** Missing integrations and unverified sources can create false confidence.','**Founder decision:** Approve scoped read-only connections and a pilot evidence ingestion plan before any automation.','**What changed:** No verified update supplied.']
        return '\n'.join(report)+'\n'
    report += ['**Strategic signal:** The following ranked candidate improvements come from locally ingested records; verify evidence currency and implementation scope before acting.','','## Top FOX upgrades']
    for index,(rec,evidences) in enumerate(rows,1):
        points=score_recommendation(rec,weights)
        evidence_links='; '.join(f'[{x["title"]}]({x["source_url"]}) ({x.get("published_at") or "date unknown"})' for x in evidences[:3])
        money=f'£{rec["cost_gbp"]:,.0f} indicative' if rec.get('cost_gbp') is not None else 'cost unverified'
        report.append(f'{index}. **{rec["title"]}** — {rec["summary"]} FOX impact: {", ".join(rec.get("impacted_systems",[]))}. Cognitive benefit: {rec.get("cognitive_benefit")}. Effort: {rec.get("estimated_effort")}; {money}; relative score {points:.0f}. Sources: {evidence_links}.')
    report += ['','**New horizon:** Further research required; no new niche may be inferred solely from these records.','**Key risk:** Conflicting source information, permissions or stale integration status must be verified before deployment.','**Founder decision:** Choose one top-ranked proposal for bounded validation and authorise only scoped read-only discovery first.','**What changed:** Relative rankings reflect imported local records, not a verified comparison against yesterday’s FOX activity.']
    return '\n'.join(report)+'\n'
