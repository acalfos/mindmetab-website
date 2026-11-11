"""Render an outreach email for sending via the Gmail API.

python3 tools/outreach_render.py <name> "<greeting>" [--preview]
Prints minified HTML with {{logo}}->cid:att0 and {{photo}}->cid:att1
(attach images/logo.jpeg then images/email-elizabeth.jpg as inline attachments, in that order).
--preview uses local file paths instead, for screenshots.
"""
import re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
name, greeting = sys.argv[1], sys.argv[2]
prev = "--preview" in sys.argv
t = (ROOT / f"content/outreach/approved/{name}.html").read_text()
b = re.search(r"<body[^>]*>(.*)</body>", t, re.S).group(1)
b = b.replace("{{greeting}}", greeting)
b = b.replace("{{logo}}", f"file://{ROOT}/images/logo.jpeg" if prev else "cid:att0")
b = b.replace("{{photo}}", f"file://{ROOT}/images/email-elizabeth.jpg" if prev else "cid:att1")
b = re.sub(r">\s+<", "><", b); b = re.sub(r"\s+", " ", b).strip()
print(b)
