#!/usr/bin/env python3
"""Read-only FOX ecosystem discovery audit. Python stdlib only."""
import json, os, pathlib, datetime, urllib.request, urllib.error
OWNER = os.getenv("FOX_OWNER", "gurcinas1981")
TOKEN = os.getenv("GH_TOKEN") or os.getenv("GH_FALLBACK_TOKEN", "")
NAMES = ["omni", "nexus", "fox-orbit", "landiq", "landsearch", "land-passport",
         "fox-planning-radar", "radar", "FOX-ATLAS", "vantage", "AURORA",
         "foxintelligence-site", "fox-intelligence-web"]
OUTPUT = pathlib.Path(__file__).parent / "output"
OUTPUT.mkdir(exist_ok=True)
def get(path):
    req = urllib.request.Request("https://api.github.com/" + path,
        headers={"Accept":"application/vnd.github+json",
                 "Authorization":"Bearer " + TOKEN,
                 "User-Agent":"fox-autonomous-engineer/1.0",
                 "X-GitHub-Api-Version":"2022-11-28"})
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return json.load(response), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"  # never persist token or API body
    except Exception as e:
        return None, type(e).__name__
def main():
    rows=[]
    for name in NAMES:
        base=f"repos/{OWNER}/{name}"
        info,err=get(base)
        if err:
            rows.append({"repository":name,"status":"unverified","error":err})
            continue
        branch=info.get("default_branch","main")
        tree,tree_err=get(base+"/git/trees/"+branch+"?recursive=1")
        paths=[v["path"] for v in tree.get("tree",[]) if v.get("type")=="blob"] if tree else []
        workflows=[p for p in paths if p.startswith(".github/workflows/")]
        tests=[p for p in paths if p.startswith(("tests/","test/","__tests__/")) or p.endswith((".test.ts",".spec.ts",".test.js",".spec.js","_test.py"))]
        manifests=[p for p in paths if p in ("package.json","pyproject.toml","requirements.txt","pnpm-lock.yaml","Dockerfile","vercel.json","supabase/config.toml")]
        tree_truncated=bool(tree and tree.get("truncated"))
        incomplete=bool(tree_err or tree_truncated)
        risks=[]
        if not incomplete and not workflows: risks.append("No GitHub workflow detected")
        if not incomplete and not tests: risks.append("No conventional test files detected")
        if not incomplete and not manifests: risks.append("No recognised root manifest detected")
        rows.append({"repository":name,"status":"partial" if incomplete else "audited",
          "private":info.get("private"),"archived":info.get("archived"),
          "default_branch":branch,"updated_at":info.get("updated_at"),
          "workflows":workflows[:50],"test_file_count":len(tests),
          "manifests":manifests,"risk_indicators":risks,
          "tree_error":tree_err,"tree_truncated":tree_truncated})
    incomplete_count=sum(r["status"] != "audited" for r in rows)
    result={"complete":incomplete_count == 0,"incomplete_repository_count":incomplete_count,
            "generated_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "mode":"READ_ONLY","scope":f"{OWNER} named FOX repositories",
            "limitations":["Heuristic discovery, not proof of code quality or deployment health",
               "Private repositories require FOX_AUDIT_TOKEN with read-only Contents/Metadata permissions",
               "No GitHub secret values, code contents, or environment variables are collected",
               "No Vercel/Supabase runtime validation in v1"],
            "repositories":rows}
    (OUTPUT/"report.json").write_text(json.dumps(result,indent=2)+"\n")
    lines=["# FOX Engineering Audit", "",f"Generated: {result['generated_utc']}",
           f"Coverage: {'COMPLETE' if result['complete'] else 'INCOMPLETE'} ({incomplete_count} incomplete repositories)","",
           "Read-only heuristic inventory. Missing files do not prove missing capabilities.","",
           "| Repository | Status | Tests | Workflows | Access / coverage errors | Indicators |",
           "|---|---|---:|---:|---|---|"]
    for r in rows:
        lines.append("| "+ " | ".join([r["repository"],r["status"],
         str(r.get("test_file_count","?")),str(len(r["workflows"])) if "workflows" in r else "?",
         "; ".join(filter(None,[r.get("error"),r.get("tree_error"),
                    "Repository tree truncated" if r.get("tree_truncated") else None])) or "None",
         "; ".join(r.get("risk_indicators",[])) or ("Not assessed: incomplete coverage" if r["status"] != "audited" else "None detected")]) +" |")
    lines+=["","## Boundaries",*["- "+x for x in result["limitations"]]]
    (OUTPUT/"report.md").write_text("\n".join(lines)+"\n")
    print(f"FOX audit coverage: {len(rows)-incomplete_count}/{len(rows)} repositories complete; read-only")
    return 1 if incomplete_count else 0
if __name__=="__main__": raise SystemExit(main())
