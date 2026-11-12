/**
 * Mind & Metabolism: provider outreach + referral thank-yous, sent from info@mindmetab.com.
 *
 * Install this while signed in to Google as info@mindmetab.com (so emails come from that address).
 * Links in emails sent by this script open the website directly (no "Redirect Notice").
 *
 * Functions you run by hand (pick it in the toolbar, then press Run):
 *   setup()        once: creates the "Campaign" tab and turns on the automatic schedule
 *   testSendAll()  sends all 4 emails to the owner's Gmail so you can check them
 *   runCampaign()  sends today's campaign emails now (it also runs by itself each weekday morning)
 *   stopAll()      turns the automatic schedule off
 *
 * Built by tools/build_apps_script.py from content/outreach/approved/. Do not edit the templates here.
 */

var CONFIG = {
  SHEET_ID: '1oMG4qksb6fpBCjK9C_6WRbBFTx2WVHPebLMGhwuZ3M0',   // "Referral thank-you queue"
  QUEUE_TAB: 'Form Responses 1',
  CAMPAIGN_TAB: 'Campaign',
  SENDER: 'info@mindmetab.com',
  SENDER_NAME: 'Mind & Metabolism',
  OWNER: 'acalfos2@gmail.com',                 // test emails and daily summaries go here only
  NEVER_EMAIL: ['calfose@mindmetab.com'],
  INTROS_PER_DAY: 25,                          // new providers emailed per weekday
  FOLLOWUP1_DAYS: 7,                           // follow-up 1 this many days after the first email
  FOLLOWUP2_DAYS: 14,                          // follow-up 2 this many days after follow-up 1
  THANKYOU_LOOKBACK_DAYS: 3,
  RUN_HOUR: 9,                                 // weekday morning send time (script time zone)
  LOGO_URL: 'https://mindmetab.com/images/logo.jpeg',
  PHOTO_URL: 'https://mindmetab.com/images/email-elizabeth.jpg'
};

var CAMPAIGN_HEADERS = ['Provider name', 'Practice', 'Email', 'Status', 'Email 1 sent', 'Follow-up 1 sent', 'Follow-up 2 sent', 'Notes'];
var COL = { NAME: 1, PRACTICE: 2, EMAIL: 3, STATUS: 4, SENT1: 5, SENT2: 6, SENT3: 7, NOTES: 8 };
var STOP_STATUSES = ['stop', 'remove', 'removed', 'replied', 'bounced', 'do not email'];

var TEMPLATES = {
 "referral-email": {
  "subject": "Psychiatric referrals for your patients: first visit usually within 1 to 2 days",
  "html": "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f3efe8;\" bgcolor=\"#f3efe8\"><tr><td align=\"center\" style=\"padding:24px 12px;\"><table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1f2a27;\" bgcolor=\"#ffffff\"><tr><td align=\"center\" style=\"padding:22px 24px 18px;background-color:#ffffff;border-bottom:1px solid #ece6dc;\" bgcolor=\"#ffffff\"><a href=\"https://mindmetab.com/\" style=\"text-decoration:none;\"><img src=\"cid:logo\" width=\"180\" alt=\"Mind &amp; Metabolism Wellness Clinic\" style=\"display:block;width:180px;height:auto;border:0;\"></a></td></tr><tr><td style=\"background-color:#37725f;padding:36px 32px 32px;\" bgcolor=\"#37725f\"><h1 style=\"margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:#ffffff;font-weight:normal;\">Psychiatric care your patients can get into fast</h1><p style=\"margin:0;font-size:16px;line-height:1.6;color:#e7f1ed;\">Medication evaluations and ongoing medication management for teens and adults across Washington State.</p><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin-top:24px;\"><tr><td style=\"border-radius:100px;background-color:#f2b544;\" bgcolor=\"#f2b544\"><a href=\"https://mindmetab.com/referrals.html#referral-form\" style=\"display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#1f2a27;text-decoration:none;border-radius:100px;\">Refer a Patient</a></td></tr></table></td></tr><tr><td style=\"padding:0;background-color:#e8f0ed;\" bgcolor=\"#e8f0ed\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td width=\"33%\" align=\"center\" style=\"padding:18px 8px;border-right:1px solid #d3e2dc;\"><p style=\"margin:0;font-size:20px;font-weight:bold;color:#37725f;\">1 to 2 days</p><p style=\"margin:4px 0 0;font-size:12px;color:#4d5d58;\">usual wait for a first visit</p></td><td width=\"33%\" align=\"center\" style=\"padding:18px 8px;border-right:1px solid #d3e2dc;\"><p style=\"margin:0;font-size:20px;font-weight:bold;color:#37725f;\">Statewide</p><p style=\"margin:4px 0 0;font-size:12px;color:#4d5d58;\">telehealth across WA</p></td><td width=\"33%\" align=\"center\" style=\"padding:18px 8px;\"><p style=\"margin:0;font-size:20px;font-weight:bold;color:#37725f;\">Ages 13+</p><p style=\"margin:4px 0 0;font-size:12px;color:#4d5d58;\">teens and adults</p></td></tr></table></td></tr><tr><td style=\"padding:30px 32px 8px;font-size:15px;line-height:1.65;color:#33403c;\"><p style=\"margin:0 0 14px;\">{{greeting}}</p><p style=\"margin:0 0 14px;\">We're reaching out from Mind &amp; Metabolism, a psychiatric practice based in Lakewood. We see patients by secure telehealth anywhere in Washington, with in-person visits at our Lakewood office. If you have patients who could use a medication evaluation, we'd be glad to help, and we'll keep you in the loop with their consent.</p></td></tr><tr><td style=\"padding:8px 32px 6px;\"><p style=\"margin:0 0 12px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#37725f;font-weight:bold;\">Conditions we treat</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"font-size:14px;color:#33403c;\"><tr><td width=\"50%\" style=\"padding:6px 0;\"><span style=\"color:#37725f;font-weight:bold;\">&#10003;</span>&nbsp; Depression</td><td width=\"50%\" style=\"padding:6px 0;\"><span style=\"color:#37725f;font-weight:bold;\">&#10003;</span>&nbsp; Anxiety and panic</td></tr><tr><td width=\"50%\" style=\"padding:6px 0;\"><span style=\"color:#37725f;font-weight:bold;\">&#10003;</span>&nbsp; ADHD (teens and adults)</td><td width=\"50%\" style=\"padding:6px 0;\"><span style=\"color:#37725f;font-weight:bold;\">&#10003;</span>&nbsp; Bipolar disorder</td></tr><tr><td width=\"50%\" style=\"padding:6px 0;\"><span style=\"color:#37725f;font-weight:bold;\">&#10003;</span>&nbsp; Schizophrenia and psychosis</td><td width=\"50%\" style=\"padding:6px 0;\"><span style=\"color:#37725f;font-weight:bold;\">&#10003;</span>&nbsp; PTSD and trauma</td></tr><tr><td width=\"50%\" style=\"padding:6px 0;\"><span style=\"color:#37725f;font-weight:bold;\">&#10003;</span>&nbsp; OCD</td><td width=\"50%\" style=\"padding:6px 0;\"><span style=\"color:#37725f;font-weight:bold;\">&#10003;</span>&nbsp; Postpartum depression</td></tr><tr><td width=\"50%\" style=\"padding:6px 0;\"><span style=\"color:#37725f;font-weight:bold;\">&#10003;</span>&nbsp; Insomnia and sleep problems</td><td width=\"50%\" style=\"padding:6px 0;\"><span style=\"color:#37725f;font-weight:bold;\">&#10003;</span>&nbsp; Dementia-related behavior changes</td></tr></table><p style=\"margin:10px 0 0;font-size:13px;color:#5c6b66;\">We also provide full psychiatric evaluations and ongoing medication management. <a href=\"https://mindmetab.com/\" style=\"color:#37725f;font-weight:bold;\">See all services</a></p></td></tr><tr><td style=\"padding:22px 32px 8px;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#fdf6e7;border:1px solid #f2dfb0;border-radius:12px;\" bgcolor=\"#fdf6e7\"><tr><td style=\"padding:18px 20px;\"><p style=\"margin:0 0 12px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#9a6a12;font-weight:bold;\">In network with</p><p style=\"margin:0;font-size:14px;line-height:2.1;color:#33403c;\"><span style=\"display:inline-block;background-color:#ffffff;border:1px solid #ead7a8;border-radius:100px;padding:2px 12px;margin:0 4px 6px 0;\">Aetna</span><span style=\"display:inline-block;background-color:#ffffff;border:1px solid #ead7a8;border-radius:100px;padding:2px 12px;margin:0 4px 6px 0;\">UnitedHealthcare / Optum</span><span style=\"display:inline-block;background-color:#ffffff;border:1px solid #ead7a8;border-radius:100px;padding:2px 12px;margin:0 4px 6px 0;\">Cigna</span><span style=\"display:inline-block;background-color:#ffffff;border:1px solid #ead7a8;border-radius:100px;padding:2px 12px;margin:0 4px 6px 0;\">Premera / LifeWise</span><span style=\"display:inline-block;background-color:#ffffff;border:1px solid #ead7a8;border-radius:100px;padding:2px 12px;margin:0 4px 6px 0;\">Regence</span><span style=\"display:inline-block;background-color:#ffffff;border:1px solid #ead7a8;border-radius:100px;padding:2px 12px;margin:0 4px 6px 0;\">Medicare</span><span style=\"display:inline-block;background-color:#ffffff;border:1px solid #ead7a8;border-radius:100px;padding:2px 12px;margin:0 4px 6px 0;\">Apple Health: Molina, Coordinated Care, CHPW, Wellpoint</span></p><p style=\"margin:8px 0 0;font-size:13px;\"><a href=\"https://mindmetab.com/insurance.html\" style=\"color:#9a6a12;\">See the full list of plans</a></p></td></tr></table></td></tr><tr><td style=\"padding:22px 32px 6px;\"><p style=\"margin:0 0 12px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#37725f;font-weight:bold;\">How referrals work</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"font-size:14px;line-height:1.55;color:#33403c;\"><tr><td width=\"40\" valign=\"top\" style=\"padding:0 0 12px;\"><span style=\"display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background-color:#37725f;color:#ffffff;font-weight:bold;font-size:13px;\">1</span></td><td valign=\"top\" style=\"padding:3px 0 12px;\">Send the short referral form at <a href=\"https://mindmetab.com/referrals.html#referral-form\" style=\"color:#37725f;font-weight:bold;\">mindmetab.com/referrals</a>. It takes about two minutes.</td></tr><tr><td width=\"40\" valign=\"top\" style=\"padding:0 0 12px;\"><span style=\"display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background-color:#37725f;color:#ffffff;font-weight:bold;font-size:13px;\">2</span></td><td valign=\"top\" style=\"padding:3px 0 12px;\">We contact your patient within one business day and verify their insurance.</td></tr><tr><td width=\"40\" valign=\"top\" style=\"padding:0 0 12px;\"><span style=\"display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background-color:#37725f;color:#ffffff;font-weight:bold;font-size:13px;\">3</span></td><td valign=\"top\" style=\"padding:3px 0 12px;\">With their consent, we share updates so care stays coordinated with you.</td></tr></table></td></tr><tr><td style=\"padding:6px 32px 26px;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#e8f0ed;border-left:4px solid #37725f;border-radius:8px;\" bgcolor=\"#e8f0ed\"><tr><td style=\"padding:16px 18px;font-size:14px;line-height:1.55;color:#2d3b37;\"><strong>Tip:</strong> bookmark <a href=\"https://mindmetab.com/referrals.html#referral-form\" style=\"color:#37725f;font-weight:bold;\">mindmetab.com/referrals</a> or save this email, so the referral link is there next time a patient needs medication support.</td></tr></table></td></tr><tr><td align=\"center\" style=\"padding:0 32px 30px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td style=\"border-radius:100px;background-color:#37725f;\" bgcolor=\"#37725f\"><a href=\"https://mindmetab.com/referrals.html#referral-form\" style=\"display:inline-block;padding:13px 26px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:100px;\">Refer a Patient</a></td><td width=\"12\"></td><td style=\"border-radius:100px;border:2px solid #37725f;\"><a href=\"tel:2535255536\" style=\"display:inline-block;padding:11px 24px;font-size:15px;font-weight:bold;color:#37725f;text-decoration:none;border-radius:100px;\">Call (253) 525-5536</a></td></tr></table></td></tr><tr><td style=\"padding:0 32px 30px;font-size:15px;line-height:1.6;color:#33403c;\"><p style=\"margin:0 0 18px;\">Thank you for the work you do. We'd love to be a resource for your patients.</p><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td width=\"72\" valign=\"middle\" style=\"padding-right:14px;\"><img src=\"cid:photo\" width=\"64\" height=\"64\" alt=\"Elizabeth Calfos\" style=\"display:block;width:64px;height:64px;border-radius:50%;border:0;\"></td><td valign=\"middle\" style=\"font-size:14px;line-height:1.5;\"><strong style=\"color:#1f2a27;font-size:15px;\">The Mind &amp; Metabolism Team</strong><br><span style=\"color:#5c6b66;\">Lead provider: Elizabeth Calfos, DNP, PMHNP-BC</span><br><a href=\"tel:2535255536\" style=\"color:#37725f;text-decoration:none;\">(253) 525-5536</a></td></tr></table></td></tr><tr><td style=\"background-color:#37725f;padding:22px 32px;font-size:12px;line-height:1.6;color:#e3efe9;\" bgcolor=\"#37725f\"><p style=\"margin:0 0 6px;color:#ffffff;font-weight:bold;\">Mind &amp; Metabolism Wellness Clinic</p><p style=\"margin:0;\"><a href=\"https://maps.google.com/?q=5515+Steilacoom+Blvd+SW+Suite+127+Lakewood+WA+98499\" style=\"color:#ffffff;text-decoration:none;\">5515 Steilacoom Blvd SW, Suite 127, Lakewood, WA 98499</a><br><a href=\"tel:2535255536\" style=\"color:#ffffff;text-decoration:none;\">(253) 525-5536</a> &nbsp;|&nbsp; <a href=\"mailto:info@mindmetab.com\" style=\"color:#ffffff;\">info@mindmetab.com</a> &nbsp;|&nbsp; <a href=\"https://mindmetab.com/\" style=\"color:#ffffff;\">mindmetab.com</a></p><p style=\"margin:12px 0 0;color:#cfe2da;\">Please don't include patient health details in a reply to this email. Use the secure referral form instead. Prefer not to hear from us? Reply \"remove\" and we won't email you again.</p></td></tr></table></td></tr></table>"
 },
 "followup-1": {
  "subject": "Quick follow-up: psychiatric referrals in Washington",
  "html": "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f3efe8;\" bgcolor=\"#f3efe8\"><tr><td align=\"center\" style=\"padding:24px 12px;\"><table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1f2a27;\" bgcolor=\"#ffffff\"><tr><td align=\"center\" style=\"padding:22px 24px 18px;background-color:#ffffff;border-bottom:1px solid #ece6dc;\" bgcolor=\"#ffffff\"><a href=\"https://mindmetab.com/\" style=\"text-decoration:none;\"><img src=\"cid:logo\" width=\"180\" alt=\"Mind &amp; Metabolism Wellness Clinic\" style=\"display:block;width:180px;height:auto;border:0;\"></a></td></tr><tr><td style=\"background-color:#37725f;padding:36px 32px 32px;\" bgcolor=\"#37725f\"><h1 style=\"margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:#ffffff;font-weight:normal;\">Still here when your patients need us</h1><p style=\"margin:0;font-size:16px;line-height:1.6;color:#e7f1ed;\">A quick follow-up on psychiatric referrals in Washington.</p></td></tr><tr><td style=\"padding:30px 32px 8px;font-size:15px;line-height:1.65;color:#33403c;\"><p style=\"margin:0 0 14px;\">{{greeting}}</p><p style=\"margin:0 0 14px;\">We wanted to follow up on our note from last week. If any of your patients could use a psychiatric evaluation or help with medication, we're accepting new patients now and can usually see them within 1 to 2 days.</p><p style=\"margin:0 0 14px;\">We treat depression, anxiety, ADHD, bipolar disorder, schizophrenia and psychosis, PTSD, OCD, postpartum depression, insomnia and more, for teens and adults.</p></td></tr><tr><td style=\"padding:4px 32px 10px;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td width=\"33%\" align=\"center\" valign=\"top\" style=\"padding:14px 6px;background-color:#e8f0ed;border-radius:12px;\" bgcolor=\"#e8f0ed\"><p style=\"margin:0;font-size:22px;\">&#9200;</p><p style=\"margin:6px 0 0;font-size:13px;font-weight:bold;color:#37725f;\">Seen in 1 to 2 days</p></td><td width=\"8\"></td><td width=\"33%\" align=\"center\" valign=\"top\" style=\"padding:14px 6px;background-color:#fdf6e7;border-radius:12px;\" bgcolor=\"#fdf6e7\"><p style=\"margin:0;font-size:22px;\">&#128179;</p><p style=\"margin:6px 0 0;font-size:13px;font-weight:bold;color:#9a6a12;\">Most plans, including Apple Health</p></td><td width=\"8\"></td><td width=\"33%\" align=\"center\" valign=\"top\" style=\"padding:14px 6px;background-color:#e8f0ed;border-radius:12px;\" bgcolor=\"#e8f0ed\"><p style=\"margin:0;font-size:22px;\">&#128187;</p><p style=\"margin:6px 0 0;font-size:13px;font-weight:bold;color:#37725f;\">Telehealth statewide</p></td></tr></table></td></tr><tr><td style=\"padding:18px 32px 8px;font-size:15px;line-height:1.65;color:#33403c;\"><p style=\"margin:0 0 14px;\">Referring takes about two minutes at <a href=\"https://mindmetab.com/referrals.html#referral-form\" style=\"color:#37725f;font-weight:bold;\">mindmetab.com/referrals</a>. We take it from there and keep you updated with your patient's consent.</p></td></tr><tr><td align=\"center\" style=\"padding:0 32px 30px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td style=\"border-radius:100px;background-color:#37725f;\" bgcolor=\"#37725f\"><a href=\"https://mindmetab.com/referrals.html#referral-form\" style=\"display:inline-block;padding:13px 26px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:100px;\">Refer a Patient</a></td><td width=\"12\"></td><td style=\"border-radius:100px;border:2px solid #37725f;\"><a href=\"tel:2535255536\" style=\"display:inline-block;padding:11px 24px;font-size:15px;font-weight:bold;color:#37725f;text-decoration:none;border-radius:100px;\">Call (253) 525-5536</a></td></tr></table></td></tr><tr><td style=\"padding:0 32px 30px;font-size:15px;line-height:1.6;color:#33403c;\"><p style=\"margin:0 0 18px;\">Thanks for considering us.</p><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td width=\"72\" valign=\"middle\" style=\"padding-right:14px;\"><img src=\"cid:photo\" width=\"64\" height=\"64\" alt=\"Elizabeth Calfos\" style=\"display:block;width:64px;height:64px;border-radius:50%;border:0;\"></td><td valign=\"middle\" style=\"font-size:14px;line-height:1.5;\"><strong style=\"color:#1f2a27;font-size:15px;\">The Mind &amp; Metabolism Team</strong><br><span style=\"color:#5c6b66;\">Lead provider: Elizabeth Calfos, DNP, PMHNP-BC</span><br><a href=\"tel:2535255536\" style=\"color:#37725f;text-decoration:none;\">(253) 525-5536</a></td></tr></table></td></tr><tr><td style=\"background-color:#37725f;padding:22px 32px;font-size:12px;line-height:1.6;color:#e3efe9;\" bgcolor=\"#37725f\"><p style=\"margin:0 0 6px;color:#ffffff;font-weight:bold;\">Mind &amp; Metabolism Wellness Clinic</p><p style=\"margin:0;\"><a href=\"https://maps.google.com/?q=5515+Steilacoom+Blvd+SW+Suite+127+Lakewood+WA+98499\" style=\"color:#ffffff;text-decoration:none;\">5515 Steilacoom Blvd SW, Suite 127, Lakewood, WA 98499</a><br><a href=\"tel:2535255536\" style=\"color:#ffffff;text-decoration:none;\">(253) 525-5536</a> &nbsp;|&nbsp; <a href=\"mailto:info@mindmetab.com\" style=\"color:#ffffff;\">info@mindmetab.com</a> &nbsp;|&nbsp; <a href=\"https://mindmetab.com/\" style=\"color:#ffffff;\">mindmetab.com</a></p><p style=\"margin:12px 0 0;color:#cfe2da;\">Please don't include patient health details in a reply to this email. Use the secure referral form instead. Prefer not to hear from us? Reply \"remove\" and we won't email you again.</p></td></tr></table></td></tr></table>"
 },
 "followup-2": {
  "subject": "Keeping our referral link handy for you",
  "html": "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f3efe8;\" bgcolor=\"#f3efe8\"><tr><td align=\"center\" style=\"padding:24px 12px;\"><table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1f2a27;\" bgcolor=\"#ffffff\"><tr><td align=\"center\" style=\"padding:22px 24px 18px;background-color:#ffffff;border-bottom:1px solid #ece6dc;\" bgcolor=\"#ffffff\"><a href=\"https://mindmetab.com/\" style=\"text-decoration:none;\"><img src=\"cid:logo\" width=\"180\" alt=\"Mind &amp; Metabolism Wellness Clinic\" style=\"display:block;width:180px;height:auto;border:0;\"></a></td></tr><tr><td style=\"background-color:#37725f;padding:36px 32px 32px;\" bgcolor=\"#37725f\"><h1 style=\"margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:#ffffff;font-weight:normal;\">One last note, and a link worth saving</h1><p style=\"margin:0;font-size:16px;line-height:1.6;color:#e7f1ed;\">No reply needed. We just want to be easy to find when the timing is right.</p></td></tr><tr><td style=\"padding:30px 32px 8px;font-size:15px;line-height:1.65;color:#33403c;\"><p style=\"margin:0 0 14px;\">{{greeting}}</p><p style=\"margin:0 0 14px;\">This is our last note for now. We know inboxes are full, so we'll keep it short: whenever a patient needs a psychiatric evaluation or medication management, for anything from depression and ADHD to bipolar disorder or schizophrenia, Mind &amp; Metabolism is here.</p></td></tr><tr><td style=\"padding:4px 32px 26px;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#e8f0ed;border-left:4px solid #37725f;border-radius:8px;\" bgcolor=\"#e8f0ed\"><tr><td style=\"padding:16px 18px;font-size:14px;line-height:1.55;color:#2d3b37;\"><p style=\"margin:0 0 6px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#37725f;font-weight:bold;\">Save for later</p><p style=\"margin:0;font-size:16px;\"><a href=\"https://mindmetab.com/referrals.html#referral-form\" style=\"color:#37725f;font-weight:bold;\">mindmetab.com/referrals</a></p><p style=\"margin:6px 0 0;\">Secure two-minute referral form. First visit usually within 1 to 2 days. Aetna, UnitedHealthcare, Cigna, Premera, Regence, Medicare and Apple Health plans accepted.</p></td></tr></table></td></tr><tr><td align=\"center\" style=\"padding:0 32px 30px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td style=\"border-radius:100px;background-color:#37725f;\" bgcolor=\"#37725f\"><a href=\"https://mindmetab.com/referrals.html#referral-form\" style=\"display:inline-block;padding:13px 26px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:100px;\">Refer a Patient</a></td><td width=\"12\"></td><td style=\"border-radius:100px;border:2px solid #37725f;\"><a href=\"tel:2535255536\" style=\"display:inline-block;padding:11px 24px;font-size:15px;font-weight:bold;color:#37725f;text-decoration:none;border-radius:100px;\">Call (253) 525-5536</a></td></tr></table></td></tr><tr><td style=\"padding:0 32px 30px;font-size:15px;line-height:1.6;color:#33403c;\"><p style=\"margin:0 0 18px;\">Wishing you and your practice all the best.</p><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td width=\"72\" valign=\"middle\" style=\"padding-right:14px;\"><img src=\"cid:photo\" width=\"64\" height=\"64\" alt=\"Elizabeth Calfos\" style=\"display:block;width:64px;height:64px;border-radius:50%;border:0;\"></td><td valign=\"middle\" style=\"font-size:14px;line-height:1.5;\"><strong style=\"color:#1f2a27;font-size:15px;\">The Mind &amp; Metabolism Team</strong><br><span style=\"color:#5c6b66;\">Lead provider: Elizabeth Calfos, DNP, PMHNP-BC</span><br><a href=\"tel:2535255536\" style=\"color:#37725f;text-decoration:none;\">(253) 525-5536</a></td></tr></table></td></tr><tr><td style=\"background-color:#37725f;padding:22px 32px;font-size:12px;line-height:1.6;color:#e3efe9;\" bgcolor=\"#37725f\"><p style=\"margin:0 0 6px;color:#ffffff;font-weight:bold;\">Mind &amp; Metabolism Wellness Clinic</p><p style=\"margin:0;\"><a href=\"https://maps.google.com/?q=5515+Steilacoom+Blvd+SW+Suite+127+Lakewood+WA+98499\" style=\"color:#ffffff;text-decoration:none;\">5515 Steilacoom Blvd SW, Suite 127, Lakewood, WA 98499</a><br><a href=\"tel:2535255536\" style=\"color:#ffffff;text-decoration:none;\">(253) 525-5536</a> &nbsp;|&nbsp; <a href=\"mailto:info@mindmetab.com\" style=\"color:#ffffff;\">info@mindmetab.com</a> &nbsp;|&nbsp; <a href=\"https://mindmetab.com/\" style=\"color:#ffffff;\">mindmetab.com</a></p><p style=\"margin:12px 0 0;color:#cfe2da;\">Please don't include patient health details in a reply to this email. Use the secure referral form instead. Prefer not to hear from us? Reply \"remove\" and we won't email you again.</p></td></tr></table></td></tr></table>"
 },
 "thank-you": {
  "subject": "Thank you for your referral",
  "html": "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#f3efe8;\" bgcolor=\"#f3efe8\"><tr><td align=\"center\" style=\"padding:24px 12px;\"><table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1f2a27;\" bgcolor=\"#ffffff\"><tr><td align=\"center\" style=\"padding:22px 24px 18px;background-color:#ffffff;border-bottom:1px solid #ece6dc;\" bgcolor=\"#ffffff\"><a href=\"https://mindmetab.com/\" style=\"text-decoration:none;\"><img src=\"cid:logo\" width=\"180\" alt=\"Mind &amp; Metabolism Wellness Clinic\" style=\"display:block;width:180px;height:auto;border:0;\"></a></td></tr><tr><td style=\"background-color:#37725f;padding:36px 32px 32px;\" bgcolor=\"#37725f\"><h1 style=\"margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:#ffffff;font-weight:normal;\">Thank you for your referral</h1><p style=\"margin:0;font-size:16px;line-height:1.6;color:#e7f1ed;\">We appreciate your trust. We'll take great care of the patient you sent our way.</p></td></tr><tr><td style=\"padding:30px 32px 8px;font-size:15px;line-height:1.65;color:#33403c;\"><p style=\"margin:0 0 14px;\">{{greeting}}</p><p style=\"margin:0 0 14px;\">Thank you for referring a patient to Mind &amp; Metabolism. We've received your referral, and here's what happens next.</p></td></tr><tr><td style=\"padding:22px 32px 6px;\"><p style=\"margin:0 0 12px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#37725f;font-weight:bold;\">What happens next</p><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"font-size:14px;line-height:1.55;color:#33403c;\"><tr><td width=\"40\" valign=\"top\" style=\"padding:0 0 12px;\"><span style=\"display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background-color:#37725f;color:#ffffff;font-weight:bold;font-size:13px;\">1</span></td><td valign=\"top\" style=\"padding:3px 0 12px;\">We reach out to the patient within one business day to schedule.</td></tr><tr><td width=\"40\" valign=\"top\" style=\"padding:0 0 12px;\"><span style=\"display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background-color:#37725f;color:#ffffff;font-weight:bold;font-size:13px;\">2</span></td><td valign=\"top\" style=\"padding:3px 0 12px;\">We verify their insurance before the first visit, so there are no surprises.</td></tr><tr><td width=\"40\" valign=\"top\" style=\"padding:0 0 12px;\"><span style=\"display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background-color:#37725f;color:#ffffff;font-weight:bold;font-size:13px;\">3</span></td><td valign=\"top\" style=\"padding:3px 0 12px;\">With the patient's consent, we'll send you updates so care stays coordinated.</td></tr></table></td></tr><tr><td style=\"padding:6px 32px 26px;\"><table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color:#e8f0ed;border-left:4px solid #37725f;border-radius:8px;\" bgcolor=\"#e8f0ed\"><tr><td style=\"padding:16px 18px;font-size:14px;line-height:1.55;color:#2d3b37;\"><strong>Need to send another?</strong> The same secure form is always at <a href=\"https://mindmetab.com/referrals.html#referral-form\" style=\"color:#37725f;font-weight:bold;\">mindmetab.com/referrals</a>. Questions about a referral? Call us at (253) 525-5536 and we'll help right away.</td></tr></table></td></tr><tr><td align=\"center\" style=\"padding:0 32px 30px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td style=\"border-radius:100px;background-color:#37725f;\" bgcolor=\"#37725f\"><a href=\"https://mindmetab.com/referrals.html#referral-form\" style=\"display:inline-block;padding:13px 26px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:100px;\">Refer Another Patient</a></td><td width=\"12\"></td><td style=\"border-radius:100px;border:2px solid #37725f;\"><a href=\"tel:2535255536\" style=\"display:inline-block;padding:11px 24px;font-size:15px;font-weight:bold;color:#37725f;text-decoration:none;border-radius:100px;\">Call (253) 525-5536</a></td></tr></table></td></tr><tr><td style=\"padding:0 32px 30px;font-size:15px;line-height:1.6;color:#33403c;\"><p style=\"margin:0 0 18px;\">We're grateful to work alongside you and look forward to caring for your patients together.</p><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr><td width=\"72\" valign=\"middle\" style=\"padding-right:14px;\"><img src=\"cid:photo\" width=\"64\" height=\"64\" alt=\"Elizabeth Calfos\" style=\"display:block;width:64px;height:64px;border-radius:50%;border:0;\"></td><td valign=\"middle\" style=\"font-size:14px;line-height:1.5;\"><strong style=\"color:#1f2a27;font-size:15px;\">The Mind &amp; Metabolism Team</strong><br><span style=\"color:#5c6b66;\">Lead provider: Elizabeth Calfos, DNP, PMHNP-BC</span><br><a href=\"tel:2535255536\" style=\"color:#37725f;text-decoration:none;\">(253) 525-5536</a></td></tr></table></td></tr><tr><td style=\"background-color:#37725f;padding:22px 32px;font-size:12px;line-height:1.6;color:#e3efe9;\" bgcolor=\"#37725f\"><p style=\"margin:0 0 6px;color:#ffffff;font-weight:bold;\">Mind &amp; Metabolism Wellness Clinic</p><p style=\"margin:0;\"><a href=\"https://maps.google.com/?q=5515+Steilacoom+Blvd+SW+Suite+127+Lakewood+WA+98499\" style=\"color:#ffffff;text-decoration:none;\">5515 Steilacoom Blvd SW, Suite 127, Lakewood, WA 98499</a><br><a href=\"tel:2535255536\" style=\"color:#ffffff;text-decoration:none;\">(253) 525-5536</a> &nbsp;|&nbsp; <a href=\"mailto:info@mindmetab.com\" style=\"color:#ffffff;\">info@mindmetab.com</a> &nbsp;|&nbsp; <a href=\"https://mindmetab.com/\" style=\"color:#ffffff;\">mindmetab.com</a></p><p style=\"margin:12px 0 0;color:#cfe2da;\">Please don't include patient health details in a reply to this email. Use the secure referral form instead. Prefer not to hear from us? Reply \"remove\" and we won't email you again.</p></td></tr></table></td></tr></table>"
 }
};

// ---------- setup ----------

function setup() {
  checkSender_();
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var c = ss.getSheetByName(CONFIG.CAMPAIGN_TAB) || ss.insertSheet(CONFIG.CAMPAIGN_TAB);
  if (c.getLastRow() === 0) {
    c.getRange(1, 1, 1, CAMPAIGN_HEADERS.length).setValues([CAMPAIGN_HEADERS]).setFontWeight('bold');
    c.setFrozenRows(1);
    c.getRange(1, COL.STATUS).setNote('Leave blank to keep emailing. Type Stop, Remove or Replied to stop. The script fills this in when someone replies.');
  }
  var q = ss.getSheetByName(CONFIG.QUEUE_TAB);
  if (q && !q.getRange(1, 5).getValue()) q.getRange(1, 5).setValue('Thank-you sent').setFontWeight('bold');
  stopAll();
  ScriptApp.newTrigger('processThankYous').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('runCampaign').timeBased().everyDays(1).atHour(CONFIG.RUN_HOUR).create();
  Logger.log('Ready. Add providers to the "Campaign" tab, then run testSendAll() to check the emails.');
}

function stopAll() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
}

function testSendAll() {
  checkSender_();
  ['referral-email', 'followup-1', 'followup-2', 'thank-you'].forEach(function (n) {
    send_(CONFIG.OWNER, n, 'Hi Abdul,', '[TEST] ');
  });
  Logger.log('Sent 4 test emails to ' + CONFIG.OWNER);
}

// ---------- referral thank-yous ----------

function processThankYous() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    checkSender_();
    var q = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.QUEUE_TAB);
    if (!q || q.getLastRow() < 2) return;
    var rows = q.getRange(2, 1, q.getLastRow() - 1, 5).getValues();
    var cutoff = new Date(Date.now() - CONFIG.THANKYOU_LOOKBACK_DAYS * 864e5);
    var sent = [], noEmail = [];
    rows.forEach(function (r, i) {
      var ts = r[0], name = String(r[1] || '').trim(), practice = String(r[2] || '').trim();
      var email = String(r[3] || '').trim().toLowerCase(), done = r[4];
      if (done || !(ts instanceof Date) || ts < cutoff) return;
      var cell = q.getRange(i + 2, 5);
      if (!validEmail_(email)) {
        cell.setValue('No email: thank by phone');
        noEmail.push(label_(name, practice));
        return;
      }
      var already = GmailApp.search('in:sent to:' + email + ' subject:"Thank you for your referral" newer_than:1d', 0, 1).length;
      if (!already) send_(email, 'thank-you', greeting_(name));
      cell.setValue(new Date());
      if (!already) sent.push(label_(name, practice));
    });
    if (sent.length || noEmail.length) {
      var lines = [];
      if (sent.length) lines.push('Thank-you emails sent:\n- ' + sent.join('\n- '));
      if (noEmail.length) lines.push('New referrals with no email (thank them by phone):\n- ' + noEmail.join('\n- '));
      summary_('Referral update ' + shortDate_(), lines.join('\n\n'));
    }
  } finally {
    lock.releaseLock();
  }
}

// ---------- campaign ----------

function runCampaign() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    checkSender_();
    var day = new Date().getDay();
    if (day === 0 || day === 6) return;   // weekdays only
    var c = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.CAMPAIGN_TAB);
    if (!c || c.getLastRow() < 2) return;
    var data = c.getRange(2, 1, c.getLastRow() - 1, CAMPAIGN_HEADERS.length).getValues();
    var now = new Date(), report = { replied: [], removed: [], email1: 0, fu1: 0, fu2: 0, skipped: [] };
    var seen = {}, intros = 0;

    data.forEach(function (r, i) {
      var row = i + 2, name = String(r[COL.NAME - 1] || '').trim(), practice = String(r[COL.PRACTICE - 1] || '').trim();
      var email = String(r[COL.EMAIL - 1] || '').trim().toLowerCase();
      var status = String(r[COL.STATUS - 1] || '').trim().toLowerCase();
      var s1 = r[COL.SENT1 - 1], s2 = r[COL.SENT2 - 1], s3 = r[COL.SENT3 - 1];
      if (!email) return;
      if (STOP_STATUSES.indexOf(status) >= 0) return;
      if (!validEmail_(email)) { report.skipped.push(label_(name, practice) + ' (bad email)'); return; }
      if (seen[email]) return;   // same address listed twice: only the first row is used
      seen[email] = true;

      // Stop if they replied
      if (s1 instanceof Date) {
        var reply = findReply_(email, s1);
        if (reply) {
          var isRemove = /\b(remove|unsubscribe|stop|opt.?out)\b/i.test(reply);
          c.getRange(row, COL.STATUS).setValue(isRemove ? 'Remove' : 'Replied');
          (isRemove ? report.removed : report.replied).push(label_(name, practice) + ' <' + email + '>');
          return;
        }
      }

      if (!(s1 instanceof Date)) {
        if (intros >= CONFIG.INTROS_PER_DAY) return;
        send_(email, 'referral-email', greeting_(name));
        c.getRange(row, COL.SENT1).setValue(now); intros++; report.email1++;
      } else if (!(s2 instanceof Date) && daysSince_(s1) >= CONFIG.FOLLOWUP1_DAYS) {
        send_(email, 'followup-1', greeting_(name));
        c.getRange(row, COL.SENT2).setValue(now); report.fu1++;
      } else if (s2 instanceof Date && !(s3 instanceof Date) && daysSince_(s2) >= CONFIG.FOLLOWUP2_DAYS) {
        send_(email, 'followup-2', greeting_(name));
        c.getRange(row, COL.SENT3).setValue(now); report.fu2++;
      }
      SpreadsheetApp.flush();
    });

    var lines = ['First emails sent: ' + report.email1, 'Follow-up 1 sent: ' + report.fu1, 'Follow-up 2 sent: ' + report.fu2];
    if (report.replied.length) lines.push('\nReplied (follow-ups stopped, check the inbox):\n- ' + report.replied.join('\n- '));
    if (report.removed.length) lines.push('\nAsked to be removed (stopped):\n- ' + report.removed.join('\n- '));
    if (report.skipped.length) lines.push('\nSkipped:\n- ' + report.skipped.join('\n- '));
    if (report.email1 + report.fu1 + report.fu2 + report.replied.length + report.removed.length + report.skipped.length) {
      summary_('Outreach update ' + shortDate_(), lines.join('\n'));
    }
  } finally {
    lock.releaseLock();
  }
}

// ---------- helpers ----------

var IMAGES_ = null;
function images_() {
  if (!IMAGES_) {
    IMAGES_ = {
      logo: UrlFetchApp.fetch(CONFIG.LOGO_URL).getBlob().setName('logo.jpeg'),
      photo: UrlFetchApp.fetch(CONFIG.PHOTO_URL).getBlob().setName('elizabeth.jpg')
    };
  }
  return IMAGES_;
}

function send_(to, name, greeting, subjectPrefix) {
  to = String(to).trim().toLowerCase();
  if (CONFIG.NEVER_EMAIL.indexOf(to) >= 0) throw new Error('Refusing to email ' + to);
  var t = TEMPLATES[name];
  var html = t.html.split('{{greeting}}').join(escapeHtml_(greeting));
  GmailApp.sendEmail(to, (subjectPrefix || '') + t.subject, plainText_(html), {
    htmlBody: html,
    inlineImages: images_(),
    name: CONFIG.SENDER_NAME
  });
}

function plainText_(html) {
  return html
    .replace(/<a [^>]*href="(https?:[^"]+)"[^>]*>([^<]*)<\/a>/g, '$2 ($1)')
    .replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|tr|h1|h2)>/g, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}

function greeting_(name) {
  name = String(name || '').replace(/\s+/g, ' ').trim();
  if (!name || /@/.test(name)) return 'Hello,';
  var dr = /^dr\.?\s+/i.test(name) || /,?\s*(md|do)\b\.?$/i.test(name);
  var parts = name.replace(/^dr\.?\s+/i, '').replace(/,.*$/, '').trim().split(' ');
  if (dr) return 'Hi Dr. ' + parts[parts.length - 1] + ',';
  var first = parts[0];
  return first.length > 1 ? 'Hi ' + first.charAt(0).toUpperCase() + first.slice(1) + ',' : 'Hello,';
}

function findReply_(email, since) {
  var after = Utilities.formatDate(since, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  var threads = GmailApp.search('from:' + email + ' after:' + after + ' -in:sent', 0, 5);
  for (var i = 0; i < threads.length; i++) {
    var msgs = threads[i].getMessages();
    for (var j = 0; j < msgs.length; j++) {
      if (msgs[j].getFrom().toLowerCase().indexOf(email) >= 0 && msgs[j].getDate() >= since) {
        return msgs[j].getPlainBody().split(/\nOn .+wrote:/)[0].slice(0, 2000);
      }
    }
  }
  return null;
}

function summary_(subject, text) {
  GmailApp.sendEmail(CONFIG.OWNER, subject, text + '\n\n(Sent automatically from ' + CONFIG.SENDER + '. Patient details are never included.)', { name: CONFIG.SENDER_NAME });
}

function checkSender_() {
  var me = Session.getEffectiveUser().getEmail().toLowerCase();
  if (me !== CONFIG.SENDER) throw new Error('This script must be installed under ' + CONFIG.SENDER + ' (it is running as ' + me + ').');
}

function validEmail_(e) { return /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i.test(e); }
function daysSince_(d) { return (Date.now() - d.getTime()) / 864e5; }
function label_(name, practice) { return (name || '(no name)') + (practice ? ', ' + practice : ''); }
function shortDate_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMM d'); }
function escapeHtml_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
