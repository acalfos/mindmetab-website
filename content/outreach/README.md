# Provider outreach emails: approved design (locked Nov 10, 2026)

The owner approved the versions in `approved/`. Send ONLY these. Do not redesign without the owner's sign-off.

## Files
- `approved/referral-email.html`: first email ("Psychiatric referrals for your patients: first visit usually within 1 to 2 days")
- `approved/followup-1.html`: 1 week later ("Quick follow-up: psychiatric referrals in Washington")
- `approved/followup-2.html`: 2 weeks after follow-up 1 ("Keeping our referral link handy for you"); last one, then stop
- `approved/thank-you.html`: same day a provider refers ("Thank you for your referral"); never names the patient
- Source of truth for edits: `tools/build_outreach_emails.py`. After any edit, rebuild, preview, get approval, then copy into `approved/`.

## Rules that prevent the "all white email" mistake
1. Send through the Gmail connector for info@mindmetab.com. It STRIPS CSS backgrounds and external images.
2. Colors must use `bgcolor="..."` attributes plus `background-color` (the builder does this). No gradients.
3. One brand green everywhere: `#37725f`. Gold button `#f2b544`. Nothing darker.
4. Images go as inline attachments, in this order: att0 = `images/logo.jpeg`, att1 = `images/email-elizabeth.jpg`.
   Render with `python3 tools/outreach_render.py <name> "Hi Sarah,"` (gives cid:att0 / cid:att1).
5. Before calling anything "ready", open the received email in a real inbox and check the header color, logo, photo and footer.
6. Test or preview emails go ONLY to the owner's personal Gmail (address is in the private task instructions, not here). Never to calfose@mindmetab.com.
7. One recipient per email. No CC, no BCC.
8. "Refer a Patient" links go to `referrals.html#referral-form`.
