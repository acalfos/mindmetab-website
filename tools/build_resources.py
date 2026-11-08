#!/usr/bin/env python3
"""Builds the Resources section from content/articles.json.

For each article that is not marked "legacy", renders resources/<slug>.html
from tools/article_template.html and content/articles/<slug>.html.
Then rebuilds resources/index.html, the homepage "latest 3" block, and the sitemap.

Run from the repo root:  python3 tools/build_resources.py
"""
import html, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://mindmetab.com/"
INTAKE = "https://patientportal.advancedmd.com/163633/onlineintake"
SERVICES = {
    "psychiatric-evaluation": ("psychiatric-evaluation.html", "Psychiatric Evaluation"),
    "medication-management": ("medication-management.html", "Medication Management"),
    "adhd": ("adhd-evaluation-washington.html", "ADHD Evaluation for Teens and Adults"),
    "stimulant": ("stimulant-medication-management-washington.html", "ADHD Medication Management"),
    "telehealth": ("telehealth-psychiatry-washington.html", "Telehealth Psychiatry in Washington"),
    "lakewood": ("lakewood-psychiatric-care.html", "In-Person Care in Lakewood"),
    "insurance": ("insurance.html", "Insurance We Accept"),
    "depression": ("depression-treatment-washington.html", "Depression Treatment"),
    "anxiety": ("anxiety-treatment-washington.html", "Anxiety and Panic Treatment"),
    "bipolar": ("bipolar-disorder-treatment-washington.html", "Bipolar Disorder Treatment"),
    "ptsd": ("ptsd-treatment-washington.html", "PTSD Treatment"),
    "ocd": ("ocd-treatment-washington.html", "OCD Treatment"),
    "insomnia": ("insomnia-treatment-washington.html", "Insomnia and Sleep Treatment"),
    "schizophrenia": ("schizophrenia-treatment-washington.html", "Schizophrenia and Psychosis Care"),
    "dementia": ("dementia-behavioral-care-washington.html", "Dementia Behavioral Care"),
}
MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

def nice_date(d):
    y, m, day = d.split("-")
    return f"{MONTHS[int(m)-1]} {int(day)}, {y}"

def fail(msg):
    print("ERROR:", msg); sys.exit(1)

def check_text(slug, text):
    plain = html.unescape(re.sub(r"<[^>]+>", " ", text))
    if re.search(r"[—–]", plain): fail(f"{slug}: contains a long dash. Rewrite the sentence.")
    for bad in ["delve", "in today's fast-paced", "it's important to note", "it is important to note", "game-changer", "unlock", "navigating the complex"]:
        if bad in plain.lower(): fail(f"{slug}: contains banned phrase '{bad}'")
    if re.search(r"\bwe (offer|provide) (individual |talk )?therapy\b", plain, re.I): fail(f"{slug}: claims therapy. We don't provide therapy.")

def main():
    articles = json.loads((ROOT / "content/articles.json").read_text())
    articles.sort(key=lambda a: a["date"], reverse=True)
    tpl = (ROOT / "tools/article_template.html").read_text()
    by_slug = {a["slug"]: a for a in articles}

    for a in articles:
        if a.get("legacy"): continue
        body = (ROOT / "content/articles" / f"{a['slug']}.html").read_text()
        check_text(a["slug"], a["title"] + " " + a["description"] + " " + body + " " + a.get("gbp_post", ""))
        gp = a.get("gbp_post", "")
        if gp and (len(gp) > 600 or re.search(r"\(?\d{3}\)?[ .-]?\d{3}[ .-]\d{4}", gp)): fail(f"{a['slug']}: gbp_post too long or contains a phone number")
        url = f"{BASE}resources/{a['slug']}.html"
        svc = [SERVICES[s] for s in a["services"]]
        primary_href, primary_name = svc[0]
        schema = {"@context": "https://schema.org", "@type": "Article", "headline": a["title"], "description": a["description"],
                  "url": url, "mainEntityOfPage": url, "datePublished": a["date"], "dateModified": a.get("updated", a["date"]),
                  "image": BASE + "images/elizabeth-calfos.jpg",
                  "author": {"@type": "Organization", "name": "Mind & Metabolism Editorial Team", "url": BASE},
                  "publisher": {"@type": "Organization", "name": "Mind & Metabolism", "logo": {"@type": "ImageObject", "url": BASE + "images/logo.jpeg"}}}
        if a.get("reviewed_by"):
            schema["reviewedBy"] = {"@type": "Person", "name": a["reviewed_by"]}
        byline = f"Published by Mind &amp; Metabolism Editorial Team · {nice_date(a['date'])} · {a.get('read_minutes', 4)} min read"
        if a.get("reviewed_by"):
            byline += f" · Reviewed by {html.escape(a['reviewed_by'])}"
        # related: same tag first, then newest
        others = [o for o in articles if o["slug"] != a["slug"]]
        others.sort(key=lambda o: (o.get("tag") != a.get("tag"), o["date"]), reverse=False)
        others = sorted(others, key=lambda o: o.get("tag") != a.get("tag"))[:2]
        rel = "\n".join(f'''      <a href="{o['slug']}.html" class="related-card">
        <div class="related-card-tag">{html.escape(o['tag'])}</div>
        <h4>{html.escape(o['title'])}</h4>
        <p>{html.escape(o['summary'])}</p>
      </a>''' for o in others)
        svc_links = " · ".join(f'<a href="/{h}">{n}</a>' for h, n in svc)
        art = f'''<article>
  <div class="article-meta">
    <div class="article-tag">{html.escape(a['tag'])}</div>
    <h1>{html.escape(a['title'])}</h1>
    <p>{byline}</p>
  </div>

{body.strip()}

  <div class="callout"><p>If you or someone you love is in crisis, call or text 988 to reach the Suicide and Crisis Lifeline, or call 911. Mind &amp; Metabolism is an outpatient practice and can't provide emergency care.</p></div>

  <div class="related-articles">
    <h3>Related services</h3>
    <p style="margin-bottom:24px;font-size:15px;">{svc_links}</p>
    <h3>More from our resources</h3>
    <div class="related-grid">
{rel}
    </div>
    <p style="margin-top:20px;font-size:15px;"><a href="/resources/">See all articles</a></p>
  </div>

  <div class="article-cta">
    <h3>Ready to talk with someone?</h3>
    <p>Our board-certified psychiatric providers see teens and adults across Washington State by telehealth, with limited in-person visits in Lakewood. Most major insurance accepted.</p>
    <a href="{INTAKE}" target="_blank" rel="noopener" class="btn-white">Book Now</a>
    <p style="margin:16px 0 0;font-size:14px;"><a href="/{primary_href}" style="color:#fff;">{primary_name}</a> · <a href="tel:2535255536" style="color:#fff;">Call (253) 525-5536</a></p>
  </div>
</article>'''
        page = (tpl.replace("{{TITLE}}", html.escape(a["title"])).replace("{{DESC}}", html.escape(a["description"]))
                   .replace("{{URL}}", url).replace("{{SCHEMA}}", json.dumps(schema)).replace("{{ARTICLE}}", art))
        (ROOT / "resources" / f"{a['slug']}.html").write_text(page)

    # ---------- resources hub ----------
    hub_tpl = tpl
    cards = "\n".join(f'''    <a href="{a['slug']}.html" class="related-card" style="margin-bottom:16px;display:block;">
      <div class="related-card-tag">{html.escape(a['tag'])} · {nice_date(a['date'])}</div>
      <h4>{html.escape(a['title'])}</h4>
      <p>{html.escape(a['summary'])}</p>
    </a>''' for a in articles)
    hub_art = f'''<article>
  <div class="article-meta">
    <div class="article-tag">Resources</div>
    <h1>Mental Health Resources for Washington Patients</h1>
    <p>Plain-language guides from Mind &amp; Metabolism. New articles every week.</p>
  </div>
  <p>Practical answers to the questions patients ask us most, from getting an ADHD evaluation to what happens at a first psychiatric visit. Each guide links to the care we offer if you're ready for next steps.</p>
  <div style="margin-top:32px;">
{cards}
  </div>
  <div class="article-cta">
    <h3>Have a question we haven't covered?</h3>
    <p>Call us or book a visit. Telehealth anywhere in Washington State.</p>
    <a href="{INTAKE}" target="_blank" rel="noopener" class="btn-white">Book Now</a>
  </div>
</article>'''
    hub_url = BASE + "resources/"
    hub_schema = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Mental Health Resources", "url": hub_url}
    hub = (hub_tpl.replace("{{TITLE}}", "Mental Health Resources for Washington Patients")
           .replace("{{DESC}}", "Plain-language guides on ADHD, anxiety, depression, and psychiatric care in Washington State from Mind &amp; Metabolism.")
           .replace("{{URL}}", hub_url).replace("{{SCHEMA}}", json.dumps(hub_schema)).replace("{{ARTICLE}}", hub_art))
    hub = hub.replace('<meta property="og:type" content="article" />', '<meta property="og:type" content="website" />')
    (ROOT / "resources/index.html").write_text(hub)

    # ---------- homepage latest 3 ----------
    idx = ROOT / "index.html"; t = idx.read_text()
    latest = articles[:3]
    cards = "\n".join(f'''      <a href="resources/{a['slug']}.html" style="display:block;background:var(--cream);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;text-decoration:none;transition:box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
        <div style="font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--green);margin-bottom:12px;">{html.escape(a['tag'])}</div>
        <h3 style="font-size:19px;margin-bottom:10px;color:var(--text);">{html.escape(a['title'])}</h3>
        <p style="font-size:14px;margin:0;">{html.escape(a['summary'])}</p>
      </a>''' for a in latest)
    block = f'''<!-- RESOURCES:START (generated by tools/build_resources.py) -->
    <div class="resources-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">
{cards}
    </div>
    <p style="text-align:center;margin-top:32px;"><a href="resources/" class="btn btn-outline">See all articles</a></p>
    <!-- RESOURCES:END -->'''
    if "<!-- RESOURCES:START" in t:
        t = re.sub(r"<!-- RESOURCES:START.*?<!-- RESOURCES:END -->", lambda m: block, t, count=1, flags=re.S)
    else:
        t, n = re.subn(r'<div class="resources-grid".*?</div>\s*(?=</div>\s*</section>)', lambda m: block + "\n  ", t, count=1, flags=re.S)
        if n != 1: fail("homepage resources block not found")
    idx.write_text(t)

    # ---------- RSS feed (Zapier posts new items to Google Business Profile) ----------
    from email.utils import format_datetime
    from datetime import datetime, timezone
    items = []
    for a in [x for x in articles if not x.get("legacy")][:20]:
        link = f"{BASE}resources/{a['slug']}.html"
        d = datetime.strptime(a["date"], "%Y-%m-%d").replace(hour=18, tzinfo=timezone.utc)
        text = a.get("gbp_post") or a["summary"]
        items.append(f"""  <item>
    <title>{html.escape(a['title'])}</title>
    <link>{link}</link>
    <guid isPermaLink="true">{link}</guid>
    <pubDate>{format_datetime(d)}</pubDate>
    <description>{html.escape(text)}</description>
  </item>""")
    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Mind &amp; Metabolism Resources</title>
  <link>{BASE}resources/</link>
  <description>New articles from Mind &amp; Metabolism, a psychiatric practice serving Washington State.</description>
{chr(10).join(items)}
</channel>
</rss>
"""
    (ROOT / "resources/feed.xml").write_text(rss)

    # ---------- sitemap ----------
    sm = ROOT / "sitemap.xml"; s = sm.read_text()
    want = ["resources/"] + [f"resources/{a['slug']}.html" for a in articles]
    for u in want:
        loc = f"<loc>{BASE}{u}</loc>"
        if loc not in s:
            s = s.replace("</urlset>", f"  <url>{loc}<lastmod>{articles[0]['date']}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n</urlset>")
    sm.write_text(s)
    print(f"Built {sum(1 for a in articles if not a.get('legacy'))} articles, hub with {len(articles)}, homepage latest: {[a['slug'] for a in latest]}")

if __name__ == "__main__":
    main()
