"""Build the provider outreach emails (intro, follow-up 1, follow-up 2, thank-you).

Writes content/outreach/<name>.html. Placeholders: {{greeting}} (e.g. "Hi Sarah,"), {{logo}} and {{photo}}.
When sending through the Gmail API, images must be inline attachments:
{{logo}} -> cid:att0 (images/logo.jpeg), {{photo}} -> cid:att1 (images/email-elizabeth.jpg).
Colors use bgcolor attributes because the Gmail API strips CSS backgrounds.
Run: python3 tools/build_outreach_emails.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "content/outreach"
UTM = "utm_source=referral_email&amp;utm_medium=email"
REFER = "https://mindmetab.com/refer.html"
GREEN, GREEN2, GOLD, INK, BODY = "#37725f", "#37725f", "#f2b544", "#1f2a27", "#33403c"

SUBJECTS = {
    "referral-email": "Psychiatric referrals for your patients: first visit usually within 1 to 2 days",
    "followup-1": "Quick follow-up: psychiatric referrals in Washington",
    "followup-2": "Keeping our referral link handy for you",
    "thank-you": "Thank you for your referral",
}


def wrap(inner: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mind &amp; Metabolism</title></head>
<body style="margin:0;padding:0;background:#f3efe8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3efe8;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:{INK};">
<tr><td align="center" style="padding:22px 24px 18px;background:#ffffff;border-bottom:1px solid #ece6dc;">
<a href="https://mindmetab.com/" style="text-decoration:none;"><img src="{{{{logo}}}}" width="180" alt="Mind &amp; Metabolism Wellness Clinic" style="display:block;width:180px;height:auto;border:0;"></a>
</td></tr>
{inner}
<tr><td style="background:#37725f;padding:22px 32px;font-size:12px;line-height:1.6;color:#e3efe9;">
<p style="margin:0 0 6px;color:#ffffff;font-weight:bold;">Mind &amp; Metabolism Wellness Clinic</p>
<p style="margin:0;"><a href="https://maps.google.com/?q=5515+Steilacoom+Blvd+SW+Suite+127+Lakewood+WA+98499" style="color:#ffffff;text-decoration:none;">5515 Steilacoom Blvd SW, Suite 127, Lakewood, WA 98499</a><br><a href="tel:2535255536" style="color:#ffffff;text-decoration:none;">(253) 525-5536</a> &nbsp;|&nbsp; <a href="mailto:info@mindmetab.com" style="color:#ffffff;">info@mindmetab.com</a> &nbsp;|&nbsp; <a href="https://mindmetab.com/" style="color:#ffffff;">mindmetab.com</a></p>
<p style="margin:12px 0 0;color:#cfe2da;">Please don't include patient health details in a reply to this email. Use the secure referral form instead. Prefer not to hear from us? Reply "remove" and we won't email you again.</p>
</td></tr>
</table></td></tr></table>
</body></html>
"""


def hero(eyebrow, title, sub, button=True, color_from=GREEN, color_to=GREEN2):
    eb = f'<p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#ffffff;font-weight:bold;">{eyebrow}</p>' if eyebrow else ""
    btn = f"""<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr><td style="border-radius:100px;background:{GOLD};">
<a href="{REFER}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:{INK};text-decoration:none;border-radius:100px;">Refer a Patient</a></td></tr></table>""" if button else ""
    return f"""<tr><td style="background:{color_from};background-image:linear-gradient(135deg,{color_from} 0%,{color_to} 100%);padding:36px 32px 32px;">
{eb}<h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:#ffffff;font-weight:normal;">{title}</h1>
<p style="margin:0;font-size:16px;line-height:1.6;color:#e7f1ed;">{sub}</p>{btn}
</td></tr>"""


def stats():
    cell = lambda big, small, last=False: f'<td width="33%" align="center" style="padding:18px 8px;{"" if last else "border-right:1px solid #d3e2dc;"}"><p style="margin:0;font-size:20px;font-weight:bold;color:{GREEN};">{big}</p><p style="margin:4px 0 0;font-size:12px;color:#4d5d58;">{small}</p></td>'
    return f"""<tr><td style="padding:0;background:#e8f0ed;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
{cell("1 to 2 days", "usual wait for a first visit")}{cell("Statewide", "telehealth across WA")}{cell("Ages 13+", "teens and adults", True)}
</tr></table></td></tr>"""


def paras(*ps, top=30):
    body = "".join(f'<p style="margin:0 0 14px;">{p}</p>' for p in ps)
    return f'<tr><td style="padding:{top}px 32px 8px;font-size:15px;line-height:1.65;color:{BODY};">{body}</td></tr>'


def label(t, color=GREEN):
    return f'<p style="margin:0 0 12px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:{color};font-weight:bold;">{t}</p>'


def treat():
    ck = f'<span style="color:{GREEN2};font-weight:bold;">&#10003;</span>&nbsp; '
    rows = [("Depression", "Anxiety and panic"), ("ADHD (teens and adults)", "Bipolar disorder"),
            ("Schizophrenia and psychosis", "PTSD and trauma"), ("OCD", "Postpartum depression"),
            ("Insomnia and sleep problems", "Dementia-related behavior changes")]
    trs = "".join(f'<tr><td width="50%" style="padding:6px 0;">{ck}{a}</td><td width="50%" style="padding:6px 0;">{ck}{b}</td></tr>' for a, b in rows)
    more = f'<p style="margin:10px 0 0;font-size:13px;color:#5c6b66;">We also provide full psychiatric evaluations and ongoing medication management. <a href="https://mindmetab.com/" style="color:{GREEN};font-weight:bold;">See all services</a></p>'
    return f'<tr><td style="padding:8px 32px 6px;">{label("Conditions we treat")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:{BODY};">{trs}</table>{more}</td></tr>'


def insurance():
    plans = ["Aetna", "UnitedHealthcare / Optum", "Cigna", "Premera / LifeWise", "Regence", "Medicare", "Apple Health: Molina, Coordinated Care, CHPW, Wellpoint"]
    pills = "".join(f'<span style="display:inline-block;background:#ffffff;border:1px solid #ead7a8;border-radius:100px;padding:2px 12px;margin:0 4px 6px 0;">{p}</span>' for p in plans)
    return f"""<tr><td style="padding:22px 32px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdf6e7;border:1px solid #f2dfb0;border-radius:12px;"><tr><td style="padding:18px 20px;">
{label("In network with", "#9a6a12")}<p style="margin:0;font-size:14px;line-height:2.1;color:{BODY};">{pills}</p>
<p style="margin:8px 0 0;font-size:13px;"><a href="https://mindmetab.com/insurance.html" style="color:#9a6a12;">See the full list of plans</a></p>
</td></tr></table></td></tr>"""


def steps(items, title="How referrals work"):
    rows = "".join(f"""<tr><td width="40" valign="top" style="padding:0 0 12px;"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background:{GREEN};color:#ffffff;font-weight:bold;font-size:13px;">{i}</span></td><td valign="top" style="padding:3px 0 12px;">{t}</td></tr>""" for i, t in enumerate(items, 1))
    return f'<tr><td style="padding:22px 32px 6px;">{label(title)}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;line-height:1.55;color:{BODY};">{rows}</table></td></tr>'


def callout(html, top=6):
    return f'<tr><td style="padding:{top}px 32px 26px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e8f0ed;border-left:4px solid {GREEN};border-radius:8px;"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.55;color:#2d3b37;">{html}</td></tr></table></td></tr>'


def buttons(primary="Refer a Patient"):
    return f"""<tr><td align="center" style="padding:0 32px 30px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="border-radius:100px;background:{GREEN};"><a href="{REFER}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:100px;">{primary}</a></td>
<td width="12"></td>
<td style="border-radius:100px;border:2px solid {GREEN};"><a href="tel:2535255536" style="display:inline-block;padding:11px 24px;font-size:15px;font-weight:bold;color:{GREEN};text-decoration:none;border-radius:100px;">Call (253) 525-5536</a></td>
</tr></table></td></tr>"""


def sign(line):
    return f"""<tr><td style="padding:0 32px 30px;font-size:15px;line-height:1.6;color:{BODY};"><p style="margin:0 0 18px;">{line}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="72" valign="middle" style="padding-right:14px;"><img src="{{{{photo}}}}" width="64" height="64" alt="Elizabeth Calfos" style="display:block;width:64px;height:64px;border-radius:50%;border:0;"></td>
<td valign="middle" style="font-size:14px;line-height:1.5;"><strong style="color:{INK};font-size:15px;">The Mind &amp; Metabolism Team</strong><br><span style="color:#5c6b66;">Lead provider: Elizabeth Calfos, DNP, PMHNP-BC</span><br><a href="tel:2535255536" style="color:{GREEN};text-decoration:none;">(253) 525-5536</a></td>
</tr></table></td></tr>"""


LINK = f'<a href="{REFER}" style="color:{GREEN};font-weight:bold;">mindmetab.com/refer</a>'

EMAILS = {
    "referral-email": wrap(
        hero("", "Psychiatric care your patients can get into fast",
             "Medication evaluations and ongoing medication management for teens and adults across Washington State.")
        + stats()
        + paras("{{greeting}}",
                "We're reaching out from Mind &amp; Metabolism, a psychiatric practice based in Lakewood. We see patients by secure telehealth anywhere in Washington, with in-person visits at our Lakewood office. If you have patients who could use a medication evaluation, we'd be glad to help, and we'll keep you in the loop with their consent.")
        + treat() + insurance()
        + steps([f"Send the short referral form at {LINK}. It takes about two minutes.",
                 "We contact your patient within one business day and verify their insurance.",
                 "With their consent, we share updates so care stays coordinated with you."])
        + callout(f"<strong>Tip:</strong> bookmark {LINK} or save this email, so the referral link is there next time a patient needs medication support.")
        + buttons()
        + sign("Thank you for the work you do. We'd love to be a resource for your patients.")
    ),
    "followup-1": wrap(
        hero("", "Still here when your patients need us",
             "A quick follow-up on psychiatric referrals in Washington.", button=False)
        + paras("{{greeting}}",
                "We wanted to follow up on our note from last week. If any of your patients could use a psychiatric evaluation or help with medication, we're accepting new patients now and can usually see them within 1 to 2 days.",
                "We treat depression, anxiety, ADHD, bipolar disorder, schizophrenia and psychosis, PTSD, OCD, postpartum depression, insomnia and more, for teens and adults.")
        + f"""<tr><td style="padding:4px 32px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td width="33%" align="center" valign="top" style="padding:14px 6px;background:#e8f0ed;border-radius:12px;"><p style="margin:0;font-size:22px;">&#9200;</p><p style="margin:6px 0 0;font-size:13px;font-weight:bold;color:{GREEN};">Seen in 1 to 2 days</p></td>
<td width="8"></td>
<td width="33%" align="center" valign="top" style="padding:14px 6px;background:#fdf6e7;border-radius:12px;"><p style="margin:0;font-size:22px;">&#128179;</p><p style="margin:6px 0 0;font-size:13px;font-weight:bold;color:#9a6a12;">Most plans, including Apple Health</p></td>
<td width="8"></td>
<td width="33%" align="center" valign="top" style="padding:14px 6px;background:#e8f0ed;border-radius:12px;"><p style="margin:0;font-size:22px;">&#128187;</p><p style="margin:6px 0 0;font-size:13px;font-weight:bold;color:{GREEN};">Telehealth statewide</p></td></tr>
</table></td></tr>"""
        + paras(f"Referring takes about two minutes at {LINK}. We take it from there and keep you updated with your patient's consent.", top=18)
        + buttons()
        + sign("Thanks for considering us.")
    ),
    "followup-2": wrap(
        hero("", "One last note, and a link worth saving",
             "No reply needed. We just want to be easy to find when the timing is right.", button=False,
             color_from=GREEN, color_to=GREEN)
        + paras("{{greeting}}",
                "This is our last note for now. We know inboxes are full, so we'll keep it short: whenever a patient needs a psychiatric evaluation or medication management, for anything from depression and ADHD to bipolar disorder or schizophrenia, Mind &amp; Metabolism is here.")
        + callout(f"""<p style="margin:0 0 6px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:{GREEN};font-weight:bold;">Save for later</p>
<p style="margin:0;font-size:16px;"><a href="{REFER}" style="color:{GREEN};font-weight:bold;">mindmetab.com/refer</a></p>
<p style="margin:6px 0 0;">Secure two-minute referral form. First visit usually within 1 to 2 days. Aetna, UnitedHealthcare, Cigna, Premera, Regence, Medicare and Apple Health plans accepted.</p>""", top=4)
        + buttons()
        + sign("Wishing you and your practice all the best.")
    ),
    "thank-you": wrap(
        hero("", "Thank you for your referral",
             "We appreciate your trust. We'll take great care of the patient you sent our way.", button=False)
        + paras("{{greeting}}",
                "Thank you for referring a patient to Mind &amp; Metabolism. We've received your referral, and here's what happens next.")
        + steps(["We reach out to the patient within one business day to schedule.",
                 "We verify their insurance before the first visit, so there are no surprises.",
                 "With the patient's consent, we'll send you updates so care stays coordinated."],
                title="What happens next")
        + callout(f"<strong>Need to send another?</strong> The same secure form is always at {LINK}. Questions about a referral? Call us at (253) 525-5536 and we'll help right away.")
        + buttons("Refer Another Patient")
        + sign("We're grateful to work alongside you and look forward to caring for your patients together.")
    ),
}


def harden(html: str) -> str:
    """Make colors survive strict email sanitizers (Gmail API strips CSS backgrounds).

    - drop gradients
    - every `background:#hex` becomes `background-color:#hex` plus a bgcolor="#hex" attribute
    """
    import re
    html = re.sub(r"background-image:linear-gradient\([^;]*\);", "", html)

    def fix(m):
        tag, attrs = m.group(1), m.group(2)
        sm = re.search(r'style="([^"]*)"', attrs)
        if not sm:
            return m.group(0)
        style = sm.group(1)
        bm = re.search(r"background(?:-color)?:(#[0-9a-fA-F]{3,6})", style)
        if not bm:
            return m.group(0)
        color = bm.group(1)
        style2 = re.sub(r"background:(#[0-9a-fA-F]{3,6})", r"background-color:\1", style)
        attrs2 = attrs.replace(sm.group(0), f'style="{style2}"')
        if tag in ("td", "table") and "bgcolor=" not in attrs2:
            attrs2 += f' bgcolor="{color}"'
        return f"<{tag}{attrs2}>"

    return re.sub(r"<(td|table|div|span|p|a)(\s[^>]*)>", fix, html)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, html in EMAILS.items():
        html = harden(html)
        (OUT / f"{name}.html").write_text(html)
    (OUT / "subjects.txt").write_text("".join(f"{k}: {v}\n" for k, v in SUBJECTS.items()))
    print("built", list(EMAILS))


if __name__ == "__main__":
    main()
