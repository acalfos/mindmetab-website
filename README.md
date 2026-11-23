# Mind & Metabolism Website

Source code for mindmetab.com

## Do not delete

- `googledad68286967f38f5.html` proves to Google Search Console that we own mindmetab.com. Deleting it disconnects Search Console.
- `sitemap.xml` and `robots.txt` tell Google which pages exist. Update `sitemap.xml` when adding or removing a page.

## Form spam protection (added Nov 2, 2026)
Both Google Forms (contact and referral, owned by info@mindmetab.com) have a required question called "Website key" that only accepts the code the website sends. Do not delete or edit that question, or every website submission will be rejected. The website code lives in the `mmData` helper at the bottom of each page with a form.

## Ad landing pages (added Nov 4, 2026)
`lp-adhd-evaluation.html`, `lp-anxiety-care.html` and `lp-depression-care.html` are where the Google Ads and Microsoft Ads campaigns send people. Google disapproved the ads under its "Prescription drug services" policy because the regular service pages talk about medication. These pages:
- must not mention medication, prescribing, stimulants, antidepressants or drug names (Google re-reviews them)
- are `noindex` and left out of `sitemap.xml` on purpose, so they don't compete with the regular pages in search

## Booking flow (changed Nov 23, 2026)
Every Book Now button goes to `book.html`, not to AdvancedMD online scheduling (it showed patients "online scheduling is currently unavailable"). The page collects name, date of birth, phone, email (required), address, insurance plan, member ID, visit type and reason, and sends it to the same HIPAA-covered contact Google Form. Plan and member ID arrive in the "Insurance Plan" answer; date of birth, address, visit type and reason arrive in the "How Can We Help?" answer, starting with "BOOKING REQUEST". Staff call the patient to schedule and enter them into AdvancedMD by hand. New pages and articles should link Book Now to `/book.html`.
