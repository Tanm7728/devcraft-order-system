/**
 * dateParser.js
 * Resolves colloquial and relative date expressions anchored to received_at (Asia/Kolkata).
 * Returns ISO-8601 YYYY-MM-DD date string, or null.
 * Also flags unresolvable deadline phrases (e.g. jaldi, asap, urgent) for needs_clarification.
 *
 * Pure JS — zero network calls.
 */

import { convertDevanagariDigits, wordToNumber } from '../utils/numberWords.js';

const DAY_NAMES = {
  'somwar': 1, 'somvaar': 1, 'somvar': 1, 'monday': 1, 'mon': 1, 'सोमवार': 1,
  'mangalwar': 2, 'mangalvaar': 2, 'mangalvar': 2, 'tuesday': 2, 'tue': 2, 'मंगलवार': 2,
  'budhwar': 3, 'budhvaar': 3, 'budhvar': 3, 'wednesday': 3, 'wed': 3, 'बुधवार': 3,
  'guruwar': 4, 'guruvaar': 4, 'guruvar': 4, 'brihaspativar': 4, 'thursday': 4, 'thu': 4, 'गुरुवार': 4, 'बृहस्पतिवार': 4,
  'shukrawar': 5, 'shukravaar': 5, 'shukravar': 5, 'friday': 5, 'fri': 5, 'शुक्रवार': 5,
  'shaniwar': 6, 'shanivaar': 6, 'shanivar': 6, 'saturday': 6, 'sat': 6, 'शनिवार': 6,
  'raviwar': 0, 'ravivaar': 0, 'ravivar': 0, 'itwar': 0, 'itwaar': 0, 'sunday': 0, 'sun': 0, 'रविवार': 0, 'इतवार': 0
};

const MONTH_NAMES = {
  'jan': 0, 'january': 0, 'janwary': 0, 'जनवरी': 0,
  'feb': 1, 'february': 1, 'farwari': 1, 'फरवरी': 1,
  'mar': 2, 'march': 2, 'मार्च': 2,
  'apr': 3, 'april': 3, 'अप्रैल': 3,
  'may': 4, 'mai': 4, 'मई': 4,
  'jun': 5, 'june': 5, 'जून': 5,
  'jul': 6, 'july': 6, 'जुलाई': 6,
  'aug': 7, 'august': 7, 'अगस्त': 7,
  'sep': 8, 'sept': 8, 'september': 8, 'sitambar': 8, 'सितंबर': 8,
  'oct': 9, 'october': 9, 'aktubar': 9, 'अक्टूबर': 9,
  'nov': 10, 'november': 10, 'navambar': 10, 'नवंबर': 10,
  'dec': 11, 'december': 11, 'disambar': 11, 'दिसंबर': 11
};

const UNRESOLVABLE_DEADLINE_PATTERNS = [
  /\bjaldi\b/i,
  /\bthoda jaldi\b/i,
  /\basap\b/i,
  /\burgent\b/i,
  /\bjab\s+ho\s+jaye\b/i,
  /\bfestival\s+se\s+pehle\b/i,
  /\bnext\s+week\s+kabhi\s+bhi\b/i,
  /\bagle\s+mahine\b/i,
  /\bmahine\s+ke\s+end\s+tak\b/i,
  /\bdiwali\s+se\s+pehle\b/i,
  /\bshaadi\s+se\s+pehle\b/i,
  /\bexam\s+ke\s+baad\b/i,
  /\bjab\s+time\s+mile\b/i,
  /\bemergency\b/i,
  /\bjitna\s+jaldi\b/i,
  /जल्दी/u,
  /तुरंत/u,
];

export function hasUnresolvableDeadline(message) {
  if (!message) return false;
  return UNRESOLVABLE_DEADLINE_PATTERNS.some(re => re.test(message));
}

function getAnchorDate(received_at) {
  if (!received_at) return new Date();
  if (received_at instanceof Date) return new Date(received_at);
  const d = new Date(received_at);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const res = new Date(date);
  res.setDate(res.getDate() + days);
  return res;
}

function getNextDayOfWeek(anchor, targetDay) {
  const currentDay = anchor.getDay();
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7;
  return addDays(anchor, diff);
}

export function parseDate(rawMessage, receivedAt, domain) {
  if (!rawMessage) return { due_date: null, had_unresolvable_deadline: false };

  const anchor = getAnchorDate(receivedAt);
  let message = convertDevanagariDigits(rawMessage).toLowerCase();
  const unresolvable = hasUnresolvableDeadline(message);

  // 1. Explicit ISO date (e.g. 2026-09-08)
  const isoMatch = message.match(/\b(20\d\d)-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    return { due_date: toISODate(new Date(y, m, d)), had_unresolvable_deadline: false };
  }

  // 2. Relative Day offsets: aaj (+0), kal (+1), parso (+2), narso/narsu/tarso (+3)
  const hasKalNahi = /kal\s+(?:nahi|ko\s+nahi|nahin)/i.test(message);
  const hasParsoNahi = /parso\s+(?:nahi|ko\s+nahi|nahin)/i.test(message);

  if (!hasParsoNahi && (/\b(parso|parson)\b/i.test(message) || /परसों/u.test(message))) {
    return { due_date: toISODate(addDays(anchor, 2)), had_unresolvable_deadline: false };
  }

  if (/\b(narso|narsu|tarso)\b/i.test(message) || /नरसों/u.test(message)) {
    return { due_date: toISODate(addDays(anchor, 3)), had_unresolvable_deadline: false };
  }

  if (!hasKalNahi && (/\bkal\b/i.test(message) || /\btomorrow\b/i.test(message) || /कल/u.test(message))) {
    return { due_date: toISODate(addDays(anchor, 1)), had_unresolvable_deadline: false };
  }

  if (/\baaj\b/i.test(message) || /\btoday\b/i.test(message) || /आज/u.test(message)) {
    return { due_date: toISODate(addDays(anchor, 0)), had_unresolvable_deadline: false };
  }

  // 3. "is weekend" / "this weekend" -> upcoming Saturday
  if (/\b(?:is|this|iss)\s+weekend\b/i.test(message) || /इस\s+weekend/u.test(message)) {
    return { due_date: toISODate(getNextDayOfWeek(anchor, 6)), had_unresolvable_deadline: false };
  }

  // 4. "agle hafte" / "next week" (without 'kabhi bhi') -> +7 days
  if (/\b(?:agle|agla|next)\s+(?:hafte|week)\b/i.test(message) && !/\bkabhi\s+bhi\b/i.test(message)) {
    return { due_date: toISODate(addDays(anchor, 7)), had_unresolvable_deadline: false };
  }

  // 5. Explicit Day Month (e.g. "9 Oct", "1 September", "22 Aug", "5 Sep")
  const monthNamesKeys = Object.keys(MONTH_NAMES).sort((a, b) => b.length - a.length).join('|');
  const monthRegex = new RegExp(`\\b(\\d{1,2})\\s*(?:st|nd|rd|th)?\\s+(${monthNamesKeys})\\b`, 'i');
  const dayMonthMatch = message.match(monthRegex);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const monthStr = dayMonthMatch[2].toLowerCase();
    if (MONTH_NAMES[monthStr] !== undefined) {
      const month = MONTH_NAMES[monthStr];
      let year = anchor.getFullYear();
      const cand = new Date(year, month, day);
      if (cand < anchor && (anchor.getMonth() > month || (anchor.getMonth() === month && anchor.getDate() > day))) {
        year += 1;
      }
      return { due_date: toISODate(new Date(year, month, day)), had_unresolvable_deadline: false };
    }
  }

  // 6. "<N> din me" / "<N> din baad" / "<N> din tak"
  if (domain !== 'tiffin' || /\b(?:tak|delivery|de\s+dena)\b/i.test(message)) {
    const dinMatch = message.match(/\b(\d+|ek|do|teen|chaar|char|paanch|panch)\s+din\s*(?:me|mein|baad|tak)\b/i);
    if (dinMatch) {
      const num = wordToNumber(dinMatch[1]);
      if (num !== null && num > 0) {
        return { due_date: toISODate(addDays(anchor, Math.round(num))), had_unresolvable_deadline: false };
      }
    }
  }

  // 7. Weekdays with negation awareness (e.g. "somvar ko nahi, mangalvar ko")
  const dayKeys = Object.keys(DAY_NAMES).sort((a, b) => b.length - a.length);
  const dayRegex = new RegExp(`\\b(${dayKeys.join('|')})\\b`, 'gi');
  let match;
  const mentionedDays = [];
  while ((match = dayRegex.exec(message)) !== null) {
    const dayWord = match[1].toLowerCase();
    const dayIndex = DAY_NAMES[dayWord];
    const start = Math.max(0, match.index - 20);
    const end = Math.min(message.length, match.index + match[0].length + 20);
    const windowText = message.slice(start, end);
    const isNegated = new RegExp(`${dayWord}\\s*(?:ko\\s+)?(?:nahi|nahin|not)|(?:nahi|nahin|not)\\s+(?:ko\\s+)?${dayWord}`, 'i').test(windowText);
    if (!isNegated && dayIndex !== undefined) {
      mentionedDays.push(dayIndex);
    }
  }

  if (mentionedDays.length > 0) {
    const targetDay = mentionedDays[mentionedDays.length - 1];
    return { due_date: toISODate(getNextDayOfWeek(anchor, targetDay)), had_unresolvable_deadline: false };
  }

  // 8. "<N> tarikh" / "<N> tareekh" / "<N> ko" / "<N> तारीख"
  const tarikhMatch = message.match(/\b(\d{1,2})\s*(?:tarikh|tareekh|taareekh|tareek|तारीख|ko\b)/i);
  if (tarikhMatch) {
    const targetDayNum = parseInt(tarikhMatch[1], 10);
    if (targetDayNum >= 1 && targetDayNum <= 31) {
      const curYear = anchor.getFullYear();
      const curMonth = anchor.getMonth();
      const curDay = anchor.getDate();

      let resMonth = curMonth;
      let resYear = curYear;
      if (targetDayNum < curDay) {
        resMonth += 1;
        if (resMonth > 11) {
          resMonth = 0;
          resYear += 1;
        }
      }
      return { due_date: toISODate(new Date(resYear, resMonth, targetDayNum)), had_unresolvable_deadline: false };
    }
  }

  return {
    due_date: null,
    had_unresolvable_deadline: unresolvable
  };
}
