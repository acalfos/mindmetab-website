"""Build the Google Apps Script that sends provider outreach from info@mindmetab.com.

Why: the Gmail connector rewrites every link into an unsigned google.com/url?q=... wrapper,
so recipients hit Google's "Redirect Notice" page. Mail sent by Apps Script (GmailApp) keeps links as written.

Run: python3 tools/build_apps_script.py  ->  content/outreach/apps-script/Code.gs
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "content/outreach/approved"
OUT = ROOT / "content/outreach/apps-script/Code.gs"
TEMPLATE = ROOT / "tools/apps_script_template.gs"


def body(name):
    t = (SRC / f"{name}.html").read_text()
    b = re.search(r"<body[^>]*>(.*)</body>", t, re.S).group(1)
    b = b.replace("{{logo}}", "cid:logo").replace("{{photo}}", "cid:photo")
    b = re.sub(r">\s+<", "><", b)
    return re.sub(r"\s+", " ", b).strip()


subjects = dict(l.split(": ", 1) for l in (ROOT / "content/outreach/subjects.txt").read_text().splitlines() if ": " in l)
templates = {n: {"subject": subjects[n], "html": body(n)} for n in ["referral-email", "followup-1", "followup-2", "thank-you"]}
for n, t in templates.items():
    assert "refer.html" not in t["html"] and "google.com/url" not in t["html"], n
    assert "{{greeting}}" in t["html"], n
code = TEMPLATE.read_text().replace("/*__TEMPLATES__*/", "var TEMPLATES = " + json.dumps(templates, indent=1) + ";")
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(code)
print(f"wrote {OUT} ({len(code):,} chars)")
