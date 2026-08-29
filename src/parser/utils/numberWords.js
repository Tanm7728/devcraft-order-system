/**
 * numberWords.js
 * Maps Hindi, Hinglish, Devanagari, and English numeric words to numbers.
 * Pure JS — zero network calls.
 */

const DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

/**
 * Replaces Devanagari numerals (०-९) with standard ASCII digits (0-9).
 * @param {string} text
 * @returns {string}
 */
export function convertDevanagariDigits(text) {
  if (!text) return '';
  return text.replace(/[०-९]/g, char => DEVANAGARI_DIGITS[char] || char);
}

const NUMBER_WORD_MAP = {
  // Hindi / Hinglish 1-20
  'ek': 1, 'do': 2, 'teen': 3, 'tin': 3, 'chaar': 4, 'char': 4,
  'paanch': 5, 'panch': 5, 'chhah': 6, 'che': 6, 'chhe': 6,
  'saat': 7, 'sat': 7, 'aath': 8, 'ath': 8, 'nau': 9, 'das': 10,
  'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14,
  'pandrah': 15, 'solah': 16, 'satrah': 17, 'atharah': 18,
  'unnis': 19, 'bees': 20, 'bis': 20,

  // Hindi measurements / numbers from DATASET_CARD.md
  'athais': 28, 'atthais': 28, 'tees': 30, 'tis': 30,
  'battis': 32, 'chautis': 34, 'chhotis': 34, 'chhattis': 36,
  'aadtis': 38, 'adtis': 38, 'artees': 38, 'chalis': 40, 'chaalis': 40,
  'bayalis': 42, 'byalis': 42, 'chavalis': 44, 'chawalis': 44,
  'chhiyalis': 46, 'chhiyalees': 46, 'adtalis': 48, 'athtalis': 48,
  'pachaas': 50, 'pachas': 50, 'saath': 60, 'sath': 60,
  'sattar': 70, 'assi': 80, 'nabbe': 90, 'sau': 100, 'so': 100,
  'hazaar': 1000, 'hazar': 1000, 'dedh hazaar': 1500, 'do hazaar': 2000,

  // Devanagari words
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5,
  'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14,
  'पंद्रह': 15, 'सोलह': 16, 'सत्रह': 17, 'अठारह': 18,
  'उन्नीस': 19, 'बीस': 20,
  'अट्ठाइस': 28, 'तीस': 30, 'बत्तीस': 32, 'चौंतीस': 34,
  'छत्तीस': 36, 'अड़तीस': 38, 'चालीस': 40, 'बयालीस': 42,
  'चवालीस': 44, 'छियालीस': 46, 'अड़तालीस': 48,
  'पचास': 50, 'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90, 'सौ': 100,
  'हज़ार': 1000, 'हजार': 1000,

  // English words
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
  'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
  'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
  'eighteen': 18, 'nineteen': 19, 'twenty': 20,

  // Collective & fractional
  'darjan': 12, 'दर्जन': 12, 'dozen': 12, 'doz': 12,
  'half': 0.5, 'aadha': 0.5, 'आधा': 0.5,
  'dedh': 1.5, 'डेढ़': 1.5,
  'dhai': 2.5, 'ढाई': 2.5,
};

/**
 * Converts a word, digit string, or Devanagari numeral to a number.
 * @param {string} token
 * @returns {number | null}
 */
export function wordToNumber(token) {
  if (token == null) return null;
  let cleaned = token.toString().trim().toLowerCase();
  cleaned = convertDevanagariDigits(cleaned);

  if (/^\d+(\.\d+)?$/.test(cleaned)) {
    return parseFloat(cleaned);
  }

  return NUMBER_WORD_MAP[cleaned] ?? null;
}

/**
 * Finds the first numeric value in a string.
 * @param {string} text
 * @returns {number | null}
 */
export function findFirstNumber(text) {
  if (!text) return null;
  const converted = convertDevanagariDigits(text);
  const tokens = converted.trim().split(/[\s,]+/);
  for (const t of tokens) {
    const n = wordToNumber(t);
    if (n !== null) return n;
  }
  return null;
}

export { NUMBER_WORD_MAP, DEVANAGARI_DIGITS };
