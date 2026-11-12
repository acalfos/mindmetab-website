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
 * New providers: add rows to the "Campaign" tab by hand, or drop a CSV named outreach-queue-YYYY-MM-DD.csv
 * (columns: name,practice,email,city,provider_type,source_url) into the Drive queue folder. Each CSV is imported once.
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
  QUEUE_FOLDER_ID: '1ICMmm1uJ0eoXu_viOIrvNPJFMfnOZnCP', // Drive folder where new provider lists (outreach-queue-*.csv) are dropped
  RUN_HOUR: 9,                                 // weekday morning send time (script time zone)
  LOGO_URL: 'https://mindmetab.com/images/logo.jpeg',
  PHOTO_URL: 'https://mindmetab.com/images/email-elizabeth.jpg'
};

var CAMPAIGN_HEADERS = ['Provider name', 'Practice', 'Email', 'Status', 'Email 1 sent', 'Follow-up 1 sent', 'Follow-up 2 sent', 'Notes'];
var COL = { NAME: 1, PRACTICE: 2, EMAIL: 3, STATUS: 4, SENT1: 5, SENT2: 6, SENT3: 7, NOTES: 8 };
var STOP_STATUSES = ['stop', 'remove', 'removed', 'replied', 'bounced', 'do not email'];

/*__TEMPLATES__*/

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
    if (!c) throw new Error('Run setup() first.');
    var imported = importQueue_(c);
    if (c.getLastRow() < 2) return;
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

    var lines = [];
    if (imported) lines.push('New providers added to the Campaign tab: ' + imported);
    lines.push('First emails sent: ' + report.email1, 'Follow-up 1 sent: ' + report.fu1, 'Follow-up 2 sent: ' + report.fu2);
    if (report.replied.length) lines.push('\nReplied (follow-ups stopped, check the inbox):\n- ' + report.replied.join('\n- '));
    if (report.removed.length) lines.push('\nAsked to be removed (stopped):\n- ' + report.removed.join('\n- '));
    if (report.skipped.length) lines.push('\nSkipped:\n- ' + report.skipped.join('\n- '));
    if (imported + report.email1 + report.fu1 + report.fu2 + report.replied.length + report.removed.length + report.skipped.length) {
      summary_('Outreach update ' + shortDate_(), lines.join('\n'));
    }
  } finally {
    lock.releaseLock();
  }
}

// Adds providers from new outreach-queue-*.csv files in the Drive queue folder (each file once, no duplicate emails).
function importQueue_(c) {
  if (!CONFIG.QUEUE_FOLDER_ID) return 0;
  var props = PropertiesService.getScriptProperties();
  var existing = {};
  if (c.getLastRow() > 1) c.getRange(2, COL.EMAIL, c.getLastRow() - 1, 1).getValues().forEach(function (r) { existing[String(r[0]).trim().toLowerCase()] = true; });
  var files = DriveApp.getFolderById(CONFIG.QUEUE_FOLDER_ID).getFiles(), added = 0;
  while (files.hasNext()) {
    var f = files.next();
    if (!/^outreach-queue-.*\.csv$/i.test(f.getName()) || props.getProperty('imported_' + f.getId())) continue;
    var rows = Utilities.parseCsv(f.getBlob().getDataAsString());
    var head = rows.shift().map(function (h) { return String(h).trim().toLowerCase(); });
    var ix = function (k) { return head.indexOf(k); };
    rows.forEach(function (r) {
      var email = String(r[ix('email')] || '').trim().toLowerCase();
      if (!validEmail_(email) || existing[email] || CONFIG.NEVER_EMAIL.indexOf(email) >= 0) return;
      var notes = [r[ix('city')], r[ix('provider_type')], r[ix('source_url')]].filter(function (x) { return x; }).join(' | ');
      c.appendRow([r[ix('name')] || '', r[ix('practice')] || '', email, '', '', '', '', notes]);
      existing[email] = true; added++;
    });
    props.setProperty('imported_' + f.getId(), new Date().toISOString());
  }
  return added;
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
