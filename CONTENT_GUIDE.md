# Mind & Metabolism: Content Guide

Every article on mindmetab.com follows these rules. The weekly article automation reads this file first.

## Voice
- Write like a calm, experienced clinician talking to a patient across the desk. Warm, direct, plain English.
- Use contractions (you're, we'll, it's). Short paragraphs. Short sentences mixed with longer ones.
- Speak to the reader as "you." Refer to the practice as "we."
- No hype and no filler. Never use: "delve," "in today's fast-paced world," "it's important to note," "game-changer," "unlock," "navigate the complexities," "journey," "robust," "seamless," "transformative," "revolutionary."
- **No long dashes (— or –). Ever.** Rewrite the sentence with a period, comma, colon, or parentheses. The build script rejects any article that contains one.
- Don't open with a question to the reader or with a dictionary definition. Open with something true and specific.
- Avoid bullet-point walls. Use a list only when the content really is a list (symptoms, what to bring).

## Accuracy and safety
- Only state facts you can stand behind. For laws, rules, and coverage, check a current source and say "as of [month year]" when a rule can change.
- Never promise results, timelines, or diagnoses. Say "many people" or "often," not "you will."
- Don't invent statistics, studies, quotes, patients, or reviews.
- We do **not** provide therapy. Say we coordinate with the patient's therapist or can point them to one.
- We see teens (13+) and adults. Telehealth anywhere in Washington State; limited in-person visits in Lakewood when available.
- Medicaid, Apple Health, and Adult Family Homes (AFHs) may be discussed when they're relevant to the topic. Anything about coverage, eligibility, or regulations must be accurate and current: check an official source (HCA, DSHS, the plan itself) and say "as of [month year]". Only describe services we actually provide, and link to /insurance.html for plan details.
- Don't use real patient stories or any detail that could identify a patient.
- Every article gets the crisis note automatically (988 / 911). Don't remove it.
- Medication names are allowed in educational context. Don't tell readers to take, stop, or change a medication. Send them to a provider.

## Structure
- 400 to 900 words. Title under 65 characters when possible. A clear H1 and 3 to 5 H2 sections.
- Link to at least two of our pages inside the text where it reads naturally (service pages, condition pages, other articles). Always link to the page that matches the topic.
- End sections with something useful, not a summary of what was just said.
- The build script adds the byline, crisis note, related services, related articles, and Book Now button.

## Byline and review
- Every article shows "Published by Mind & Metabolism Editorial Team" with the date. The build script adds this automatically.
- Only fill in `reviewed_by` when a named clinician has actually reviewed that article. Never claim a review that didn't happen. When it's blank, nothing about review is shown.
- The owner reviews articles after publication and corrects them as needed.

## Google Business Profile post
- Every article entry needs a `gbp_post` field: 2 to 3 natural sentences about the article for our Google profile (under 600 characters). No long dashes, no health claims or promises, no patient details, no phone numbers.
- The build script puts it in resources/feed.xml. Zapier watches that feed and posts it to Google with a "Learn more" link to the article. Don't post to Google by hand or with a browser.

## Publishing checklist
1. Add the article body to `content/articles/<slug>.html` (only the inner content: paragraphs, h2, lists, links).
2. Add an entry to `content/articles.json` (slug, title, description under 160 characters, tag, summary, date, read_minutes, services, gbp_post).
3. Mark the topic done in `content/topics.md`.
4. Run `python3 tools/build_resources.py`. Fix anything it rejects.
5. Commit and push to main. Check the live page loads.
6. The Google post goes out automatically through Zapier from resources/feed.xml. Confirm the feed contains the new article.
7. Tell the owner what was published, with the link.
