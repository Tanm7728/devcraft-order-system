/**
 * entityextractor.js — NLP-Lite & Domain-Aware Entity & Attribute Extractor
 * Pure JS — zero network calls.
 */

import { convertDevanagariDigits, wordToNumber } from '../utils/numberWords.js';
import { NON_CUSTOMER_WORDS } from '../utils/nlp.js';

export const DOMAIN_VOCABULARY = {
  tailor: ['color', 'fabric', 'chest', 'waist', 'length', 'sleeve', 'size', 'fit'],
  tiffin: ['portion', 'spice_level', 'meal', 'roti_count', 'jain', 'days'],
  electrician: ['appliance', 'issue', 'room', 'brand', 'wattage'],
  baker: ['flavour', 'weight_kg', 'egg_free', 'tier', 'message_on_cake', 'shape']
};

export const KNOWN_CUSTOMERS = [
  'Anil ji', 'Asha', 'Deepak bhai', 'Farida', 'Gopal ji', 'Iqbal bhai',
  'Kavita', 'Manoj', 'Meena aunty', 'Naveen', 'Neha', 'Priya',
  'Rakesh', 'Ramesh', 'Sarita didi', 'Shalini', 'Sunita', 'Tarun', 'Vikram'
];

export const ALL_ITEMS_MAP = {
  // Electrician
  'ac point': ['ac point', 'एसी पॉइंट'],
  'ceiling fan': ['ceiling fan', 'pankha', 'पंखा', 'सीलिंग फैन', 'fan'],
  'doorbell': ['doorbell', 'bell', 'ghanti', 'घंटी', 'डोरबेल'],
  'exhaust fan': ['exhaust fan', 'exhaust', 'एग्जॉस्ट फैन'],
  'geyser': ['geyser', 'gizer', 'गीजर'],
  'inverter': ['inverter', 'इन्वर्टर'],
  'mcb': ['mcb', 'एमसीबी'],
  'socket': ['socket', 'सॉकेट'],
  'switch board': ['switch board', 'switchboard', 'स्विच बोर्ड', 'स्विचबोर्ड'],
  'tube light': ['tube light', 'tubelight', 'ट्यूब लाइट', 'light'],
  'water motor': ['water motor', 'motor', 'पानी की मोटर', 'मोटर'],
  'wiring': ['wiring', 'वायरिंग'],

  // Tailor
  'blouse': ['blouse', 'ब्लाउज'],
  'dupatta': ['dupatta', 'दुपट्टा'],
  'kameez': ['kameez', 'कमीज'],
  'kurta': ['kurta', 'kurti', 'कुर्ता', 'कुर्ती'],
  'lehenga': ['lehenga', 'lehnga', 'लहंगा'],
  'pajama': ['pajama', 'pyjama', 'पैजामा', 'पजामा'],
  'pant': ['pant', 'pent', 'पेंट', 'पैंट', 'trouser'],
  'salwar': ['salwar', 'सलवार'],
  'sherwani': ['sherwani', 'शेरवानी'],
  'shirt': ['shirt', 'शर्ट'],
  'suit': ['suit', 'सूट'],
  'waistcoat': ['waistcoat', 'koti', 'vest', 'कोटी'],

  // Tiffin
  'chole': ['chole', 'छोले'],
  'curd': ['curd', 'dahi', 'दही'],
  'dal': ['dal', 'दाल'],
  'idli': ['idli', 'इडली'],
  'khichdi': ['khichdi', 'खिचड़ी'],
  'paneer sabzi': ['paneer sabzi', 'paneer', 'पनीर सब्जी', 'पनीर'],
  'paratha': ['paratha', 'पराठा'],
  'poha': ['poha', 'पोहा'],
  'rajma': ['rajma', 'राजमा'],
  'rice': ['rice', 'चावल'],
  'roti': ['roti', 'phulka', 'chapati', 'रोटी'],
  'sabzi': ['sabzi', 'sabji', 'bhaji', 'सब्जी'],
  'thali': ['thali', 'थाली'],

  // Baker
  'birthday cake': ['birthday cake', 'bday cake', 'बर्थडे केक'],
  'bread loaf': ['bread loaf', 'bread', 'ब्रेड'],
  'brownie': ['brownie', 'ब्राउनी'],
  'cake': ['cake', 'केक'],
  'cheesecake': ['cheesecake', 'cheese cake', 'चीज़केक'],
  'cookies': ['cookies', 'cookie', 'कुकीज़', 'बिस्कुट'],
  'cupcake': ['cupcake', 'कपकेक'],
  'donut': ['donut', 'doughnut', 'डोनट'],
  'muffin': ['muffin', 'मफिन'],
  'pastry': ['pastry', 'पेस्ट्री']
};

export const DOMAIN_ITEMS = {
  electrician: ['ac point', 'ceiling fan', 'doorbell', 'exhaust fan', 'geyser', 'inverter', 'mcb', 'socket', 'switch board', 'tube light', 'water motor', 'wiring'],
  tailor: ['blouse', 'dupatta', 'kameez', 'kurta', 'lehenga', 'pajama', 'pant', 'salwar', 'sherwani', 'shirt', 'suit', 'waistcoat'],
  tiffin: ['chole', 'curd', 'dal', 'idli', 'khichdi', 'paneer sabzi', 'paratha', 'poha', 'rajma', 'rice', 'roti', 'sabzi', 'thali'],
  baker: ['birthday cake', 'bread loaf', 'brownie', 'cake', 'cheesecake', 'cookies', 'cupcake', 'donut', 'muffin', 'pastry']
};

const BRANDS = ['Havells', 'Crompton', 'Anchor', 'Bajaj', 'Usha', 'Orient', 'Polycab', 'Philips', 'Syska', 'Legrand', 'Schneider'];
const ISSUES = {
  'leaking current': 'leaking current',
  'current aa raha': 'leaking current',
  'jhatka lag raha': 'leaking current',
  'jhatka': 'leaking current',
  'current': 'leaking current',
  'short circuit': 'short circuit',
  'short ho gaya': 'short circuit',
  'short': 'short circuit',
  'not working': 'not working',
  'chal nahi raha': 'not working',
  'kaam nahi kar raha': 'not working',
  'band hai': 'not working',
  'kharab hai': 'not working',
  'kharab': 'not working',
  'fuse blown': 'fuse blown',
  'fuse ud gaya': 'fuse blown',
  'fuse': 'fuse blown',
  'spark': 'spark',
  'chingari': 'spark',
  'noise': 'noise',
  'awaaz': 'noise',
  'sound': 'noise',
  'slow': 'slow',
  'dheema': 'slow',
  'speed kam': 'slow'
};

const ROOMS = ['hall', 'balcony', 'kitchen', 'bathroom', 'bedroom', 'terrace', 'drawing room', 'living room', 'pooja room'];
const APPLIANCES = ['motor', 'fridge point', 'light', 'ac', 'fan', 'geyser', 'cooler', 'inverter'];

const COLORS = [
  'navy blue', 'bottle green', 'mustard', 'sky blue', 'royal blue', 'dark green', 'light green',
  'white', 'pink', 'grey', 'gray', 'beige', 'maroon', 'black', 'red', 'blue', 'green', 'yellow',
  'purple', 'orange', 'golden', 'silver', 'cream', 'brown', 'laal', 'neela', 'safed', 'kala', 'hara', 'peela'
];

const FABRICS = ['velvet', 'linen', 'rayon', 'chiffon', 'khadi', 'silk', 'cotton', 'georgette', 'satin'];
const SIZES = ['XXL', 'XXXL', 'XS', 'XL', 'L', 'M', 'S'];
const FITS = { 'slim': 'slim', 'regular': 'regular', 'loose': 'loose' };
const SLEEVES = {
  'full': 'full', 'full sleeve': 'full', 'poori aasteen': 'full',
  'half': 'half', 'half sleeve': 'half', 'aadhi aasteen': 'half',
  'three-quarter': 'three-quarter', '3/4': 'three-quarter', 'three quarter': 'three-quarter'
};

const FLAVOURS = [
  'black forest', 'red velvet', 'butterscotch', 'mango', 'vanilla', 'coffee',
  'strawberry', 'chocolate', 'pineapple', 'blueberry', 'fruit'
];

const SHAPES = ['heart', 'round', 'square', 'rectangle'];

const MEALS = {
  'breakfast': 'breakfast', 'nashta': 'breakfast',
  'lunch': 'lunch', 'dopahar': 'lunch',
  'dinner': 'dinner', 'raat': 'dinner'
};

const PORTIONS = {
  'half': 'half', 'aadha': 'half',
  'full': 'full', 'poora': 'full',
  'extra': 'extra', 'jyada': 'extra'
};

const SPICE_LEVELS = {
  'mild': 'mild', 'kam teekha': 'mild', 'kam mirch': 'mild', 'teekha kam': 'mild', 'less spicy': 'mild',
  'medium': 'medium', 'normal': 'medium', 'medium teekha': 'medium',
  'spicy': 'spicy', 'teekha': 'spicy', 'jyada teekha': 'spicy', 'extra spicy': 'spicy'
};

const PRIOR_ORDER_PATTERNS = [
  /\blast\s+time\s+jaisa\b/i,
  /\bpichli\s+baar\s+(?:jaisa|wala|waala|ki\s+tarah)\b/i,
  /\bpehle\s+(?:jaisa|wala|waala)\b/i,
  /\bsame\s+as\s+(?:last|previous|before)\b/i,
  /\bwahi\s+jo\s+pehle\b/i,
  /पिछली\s+बार/u,
  /पहले\s+जैसा/u,
  /\brepeat\s+order\b/i,
  /\bpurana\s+measurement\b/i,
  /\blast\s+wale\s+jaisa\b/i,
  /\bmeasurement\s+(?:hi\s+)?rakh\s+le/i,
];

const NEGATED_PRIOR_PATTERNS = [
  /\bpichli\s+baar\s+jaisa\s+nahi\b/i,
  /\blast\s+time\s+jaisa\s+nahi\b/i,
  /\bpehle\s+jaisa\s+nahi\b/i,
  /\bis\s+baar\s+naya\b/i
];

export function referencesPriorOrder(message) {
  if (!message) return false;
  if (NEGATED_PRIOR_PATTERNS.some(re => re.test(message))) {
    return false;
  }
  return PRIOR_ORDER_PATTERNS.some(re => re.test(message));
}

/**
 * Automatically infers the business domain from unstructured customer messages.
 * @param {string} message
 * @returns {'tailor' | 'tiffin' | 'electrician' | 'baker'}
 */
export function detectDomain(message) {
  if (!message || typeof message !== 'string') return 'tailor';
  const lower = message.toLowerCase();

  const scores = { tailor: 0, tiffin: 0, electrician: 0, baker: 0 };

  // Score against items in DOMAIN_ITEMS
  for (const [dom, items] of Object.entries(DOMAIN_ITEMS)) {
    for (const it of items) {
      if (lower.includes(it)) scores[dom] += 4;
      const aliases = ALL_ITEMS_MAP[it] || [];
      for (const al of aliases) {
        if (lower.includes(al)) scores[dom] += 4;
      }
    }
  }

  // Tailor keywords
  const tailorKeywords = [
    'silna', 'silwana', 'silana', 'silaai', 'stitching', 'stitch', 'fabric', 'kapda', 'kapde',
    'cotton', 'silk', 'linen', 'georgette', 'naap', 'naapna', 'alteration', 'alter', 'fitting',
    'chest', 'chhati', 'waist', 'kamar', 'length', 'lambai', 'sleeve', 'aasteen'
  ];
  for (const kw of tailorKeywords) {
    if (lower.includes(kw)) scores.tailor += 2;
  }

  // Tiffin keywords
  const tiffinKeywords = [
    'tiffin', 'lunch', 'dinner', 'dabba', 'meal', 'roti', 'chapati', 'phulka', 'dal', 'daal',
    'sabzi', 'sabji', 'bhaji', 'rice', 'chawal', 'rajma', 'chole', 'paneer', 'paratha', 'poha',
    'idli', 'khichdi', 'dahi', 'thali', 'jain', 'swaminarayan', 'kam teekha', 'teekha', 'spice', 'spicy', 'khana'
  ];
  for (const kw of tiffinKeywords) {
    if (lower.includes(kw)) scores.tiffin += 2;
  }

  // Electrician keywords
  const electricianKeywords = [
    'geyser', 'fan', 'pankha', 'exhaust', 'wiring', 'wire', 'socket', 'switch', 'switchboard',
    'mcb', 'inverter', 'motor', 'tubelight', 'ac point', 'short circuit', 'spark', 'current',
    'jhatka', 'fuse', 'watt', 'havells', 'crompton', 'bajaj', 'usha', 'anchor', 'chal nahi raha', 'kharab'
  ];
  for (const kw of electricianKeywords) {
    if (lower.includes(kw)) scores.electrician += 2;
  }

  // Baker keywords
  const bakerKeywords = [
    'cake', 'pastry', 'brownie', 'cupcake', 'cookies', 'cookie', 'bread', 'muffin', 'donut', 'cheesecake',
    'flavour', 'flavor', 'chocolate', 'vanilla', 'strawberry', 'pineapple', 'black forest', 'red velvet',
    'butterscotch', 'eggless', 'egg free', 'bina ande', 'kg', 'pound', 'tier', 'happy birthday'
  ];
  for (const kw of bakerKeywords) {
    if (lower.includes(kw)) scores.baker += 2;
  }

  let bestDomain = 'tailor';
  let maxScore = 0;
  for (const [dom, sc] of Object.entries(scores)) {
    if (sc > maxScore) {
      maxScore = sc;
      bestDomain = dom;
    }
  }

  return bestDomain;
}

const AMOUNT_PATTERNS = [
  /(?:₹|rs\.?|inr)\s*(\d+(?:[.,]\d+)?)/i,
  /(\d+(?:[.,]\d+)?)\s*(?:₹|rs\.?|rupees?|rupaye?|inr)/i,
  /(\d+(?:[.,]\d+)?)\s*(?:mein|me|में)\s+(?:ho|kar|ban|de\s+dena|final)/i,
  /(\d+(?:[.,]\d+)?)\s*(?:tak|tk)\b/i,
  /(?:total|amount|rate|price|cost|budget)\s*[:-]?\s*(\d+(?:[.,]\d+)?)/i,
];

export function extractAmount(message) {
  if (!message) return null;
  const converted = convertDevanagariDigits(message);
  for (const re of AMOUNT_PATTERNS) {
    const m = converted.match(re);
    if (m && m[1]) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) {
        return val;
      }
    }
  }
  return null;
}

const CUSTOMER_DECOY_PATTERN = /((?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+(?:\s+(?:didi|bhaiya|bhai|uncle|aunty|ji|bhabhi))?)\s+(?:ke\s+liye\s+nahi|nahi|ke\s+liye\s+nahin)[,\s]+((?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+(?:\s+(?:didi|bhaiya|bhai|uncle|aunty|ji|bhabhi))?)\s+ke\s+liye/iu;

/**
 * Cleans extracted candidate customer name.
 */
function cleanCustomerCandidate(raw) {
  if (!raw) return null;
  let name = raw.trim();
  const lower = name.toLowerCase();

  // If candidate is a stop word (e.g. 'Bhaiya', 'Order')
  if (NON_CUSTOMER_WORDS.has(lower) || wordToNumber(lower) !== null) {
    return null;
  }

  // Check known customers
  for (const kn of KNOWN_CUSTOMERS) {
    if (kn.toLowerCase() === lower || lower.startsWith(kn.toLowerCase().split(' ')[0])) {
      return kn;
    }
  }

  // Return formatted name
  return name;
}

export function extractCustomer(message) {
  if (!message) return null;

  // 1. Decoy pattern: "A ke liye nahi, B ke liye"
  const decoyMatch = message.match(CUSTOMER_DECOY_PATTERN);
  if (decoyMatch && decoyMatch[2]) {
    const res = cleanCustomerCandidate(decoyMatch[2]);
    if (res) return res;
  }

  // 2. "Ram bol raha hu", "Ram bol rha hai", "Pooja bol rahi"
  const bolMatch = message.match(/(?:^|[.,!?;]|\s+)(?:mai[n]?\s+|me\s+|mai\s+)?((?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+(?:\s+(?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+)?(?:\s+(?:didi|bhaiya|bhai|uncle|aunty|ji|bhabhi|sir|madam))?)\s+bol\s+(?:raha|rahi|rahe|rha|rhi|rh)\s*(?:hu|hoon|hun|hai|hain)?\b/iu);
  if (bolMatch && bolMatch[1]) {
    const res = cleanCustomerCandidate(bolMatch[1]);
    if (res) return res;
  }

  // 3. "from Ram", "from: Ram", "this is Ram"
  const fromMatch = message.match(/(?:^|[.,!?;]|\s+)(?:from|this is)\s*[:]?\s*((?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+(?:\s+[\p{L}\p{M}]+)?)\b/iu);
  if (fromMatch && fromMatch[1]) {
    const res = cleanCustomerCandidate(fromMatch[1]);
    if (res) return res;
  }

  // 4. "Amit Sharma here", "Rahul this side"
  const hereMatch = message.match(/(?:^|[.,!?;]|\s+)((?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+(?:\s+[\p{L}\p{M}]+)?)\s+(?:here|this side)\b/iu);
  if (hereMatch && hereMatch[1]) {
    const res = cleanCustomerCandidate(hereMatch[1]);
    if (res) return res;
  }

  // 5. "Sunita Rao ke liye...", "Meena aunty ke liye..."
  const keLiyeMatch = message.match(/(?:^|[.,!?;]|\s+)((?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+(?:\s+(?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+)?(?:\s+(?:didi|bhaiya|bhai|uncle|aunty|ji|bhabhi))?)\s+ke\s+liye\b/iu);
  if (keLiyeMatch && keLiyeMatch[1]) {
    const res = cleanCustomerCandidate(keLiyeMatch[1]);
    if (res) return res;
  }

  // 6. "Mera naam Rohit hai", "Name: Suresh"
  const nameMatch = message.match(/(?:^|[.,!?;]|\s+)(?:mera\s+naam|name|customer)\s*[:-]?\s*((?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+(?:\s+[\p{L}\p{M}]+)?)\b/iu);
  if (nameMatch && nameMatch[1]) {
    const res = cleanCustomerCandidate(nameMatch[1]);
    if (res) return res;
  }

  // 7. Known customers dictionary lookup with negation guard
  for (const name of KNOWN_CUSTOMERS) {
    const re = new RegExp(`(?:^|[\\s,;!?])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s,;!?]|$)`, 'i');
    if (re.test(message)) {
      const negated = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:ke\\s+liye\\s+)?(?:nahi|nahin|not)`, 'i').test(message);
      if (!negated) {
        return name;
      }
    }
  }

  return null;
}

export function extractSegmentAttributes(text, domain) {
  const attrs = {};
  if (!text) return attrs;
  const lower = text.toLowerCase();
  const converted = convertDevanagariDigits(text);

  if (!domain || domain === 'tailor') {
    const chestM = converted.match(/\b(?:chest|chhati)\s*[:-]?\s*(\d+|athais|tees|battis|chautis|chhattis|aadtis|chalis|bayalis|chavalis|chhiyalis|adtalis|pachaas)/i)
      || lower.match(/\bchest\s+(\d+)\b/i);
    if (chestM) {
      const num = wordToNumber(chestM[1]);
      if (num !== null) attrs.chest = num;
    }

    const waistM = converted.match(/\b(?:waist|kamar)\s*[:-]?\s*(\d+|athais|tees|battis|chautis|chhattis|aadtis|chalis|bayalis|chavalis|chhiyalis|adtalis|pachaas)/i);
    if (waistM) {
      const num = wordToNumber(waistM[1]);
      if (num !== null) attrs.waist = num;
    }

    const lenM = converted.match(/\b(?:length|lambaai|lambai)\s*[:-]?\s*(\d+|athais|tees|battis|chautis|chhattis|aadtis|chalis|bayalis|chavalis|chhiyalis|adtalis|pachaas)/i);
    if (lenM) {
      const num = wordToNumber(lenM[1]);
      if (num !== null) attrs.length = num;
    }

    for (const c of COLORS) {
      const re = new RegExp(`(?:^|[\\s,;!?])${c}(?=[\\s,;!?]|$)`, 'i');
      if (re.test(text)) {
        if (c === 'laal') attrs.color = 'red';
        else if (c === 'neela') attrs.color = 'blue';
        else if (c === 'safed') attrs.color = 'white';
        else if (c === 'kala') attrs.color = 'black';
        else if (c === 'hara') attrs.color = 'green';
        else if (c === 'peela') attrs.color = 'yellow';
        else attrs.color = c;
        break;
      }
    }

    for (const f of FABRICS) {
      const re = new RegExp(`(?:^|[\\s,;!?])${f}(?=[\\s,;!?]|$)`, 'i');
      if (re.test(text)) {
        attrs.fabric = f;
        break;
      }
    }

    for (const [sKey, sVal] of Object.entries(SLEEVES)) {
      if (lower.includes(sKey)) {
        attrs.sleeve = sVal;
        break;
      }
    }

    for (const [fKey, fVal] of Object.entries(FITS)) {
      const re = new RegExp(`\\b${fKey}\\s+fit\\b|\\b${fKey}\\b`, 'i');
      if (re.test(text)) {
        attrs.fit = fVal;
        break;
      }
    }

    for (const sz of SIZES) {
      const re = new RegExp(`(?:size|साइज़)\\s*[:-]?\\s*${sz}\\b|\\b${sz}\\s*size\\b`, 'i');
      if (re.test(text)) {
        attrs.size = sz;
        break;
      }
    }
  }

  if (!domain || domain === 'tiffin') {
    for (const [mKey, mVal] of Object.entries(MEALS)) {
      if (lower.includes(mKey)) {
        attrs.meal = mVal;
        break;
      }
    }

    for (const [pKey, pVal] of Object.entries(PORTIONS)) {
      if (lower.includes(pKey)) {
        attrs.portion = pVal;
        break;
      }
    }

    for (const [spKey, spVal] of Object.entries(SPICE_LEVELS)) {
      if (lower.includes(spKey)) {
        attrs.spice_level = spVal;
        break;
      }
    }

    if (/\bjain\b|जैन/i.test(text)) {
      attrs.jain = true;
    }

    const rotiM = converted.match(/(\d+|ek|do|teen|chaar|char|paanch|chhe|chhah|saat|aath|das|barah|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|दस)\s*(?:roti|rotis|phulka|chapati|रोटी)/i);
    if (rotiM) {
      const num = wordToNumber(rotiM[1]);
      if (num !== null) attrs.roti_count = num;
    }

    const daysM = converted.match(/(\d+|ek|do|teen|chaar|char|paanch|panch|chhe|saat|aath|das|barah|ek\s+mahina|1\s+mahina)\s*(?:din|days|दिन)/i);
    if (daysM) {
      let num = wordToNumber(daysM[1]);
      if (daysM[1].includes('mahina')) num = 30;
      if (num !== null) attrs.days = num;
    }
  }

  if (!domain || domain === 'electrician') {
    for (const [issKey, issVal] of Object.entries(ISSUES)) {
      if (lower.includes(issKey)) {
        attrs.issue = issVal;
        break;
      }
    }

    for (const r of ROOMS) {
      if (lower.includes(r)) {
        attrs.room = r;
        break;
      }
    }

    for (const b of BRANDS) {
      if (lower.includes(b.toLowerCase())) {
        attrs.brand = b;
        break;
      }
    }

    for (const app of APPLIANCES) {
      const re = new RegExp(`\\b${app}\\b`, 'i');
      if (re.test(text)) {
        attrs.appliance = app;
        break;
      }
    }

    const wattM = converted.match(/(\d+)\s*(?:w|watt|watts|वाट)\b/i);
    if (wattM) {
      attrs.wattage = `${wattM[1]}W`;
    }
  }

  if (!domain || domain === 'baker') {
    for (const fl of FLAVOURS) {
      if (lower.includes(fl)) {
        attrs.flavour = fl;
        break;
      }
    }

    const kgM = converted.match(/(\d+(?:\.\d+)?|\d+\s*\/\s*\d+|aadha|half|ek|do|teen|char|paanch|एक|दो|तीन|चार|पाँच|पांच)\s*(?:kg|kilo|किलो|pound|पाउंड)/i);
    if (kgM) {
      let val;
      if (kgM[1] === 'aadha' || kgM[1] === 'half' || kgM[1] === '1/2') val = 0.5;
      else if (kgM[1] === '1.5' || kgM[1] === 'dedh') val = 1.5;
      else val = wordToNumber(kgM[1]) || parseFloat(kgM[1]);
      if (val !== null && !isNaN(val)) attrs.weight_kg = val;
    }

    if (/\b(?:eggless|egg-free|egg\s+free|bina\s+ande|ande\s+ke\s+bina|बिना\s+अंडे|एगलेस)\b/i.test(text)) {
      attrs.egg_free = true;
    }

    const tierM = converted.match(/(\d+|do|teen|chaar|char|2|3|4)\s*tier\b/i);
    if (tierM) {
      const num = wordToNumber(tierM[1]) || parseInt(tierM[1], 10);
      if (num) attrs.tier = num;
    }

    for (const sh of SHAPES) {
      if (lower.includes(sh)) {
        attrs.shape = sh;
        break;
      }
    }

    const msgM = text.match(/(?:message|likhna|likh\s+dena|likh\s+do|naam\s+likhna)\s*[:]?\s*["']?([^"',.\n]+)["']?/i);
    if (msgM && msgM[1]) {
      attrs.message_on_cake = msgM[1].trim();
    }
  }

  if (domain && DOMAIN_VOCABULARY[domain]) {
    const validKeys = new Set(DOMAIN_VOCABULARY[domain]);
    const filtered = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (validKeys.has(k)) {
        filtered[k] = v;
      }
    }
    return filtered;
  }

  return attrs;
}

export function isMissingBlockingAttribute(items, domain) {
  if (!items || items.length === 0) return false;

  if (domain === 'baker') {
    return items.every(item => !item.attributes || !item.attributes.flavour);
  }

  if (domain === 'electrician') {
    return items.every(item => !item.attributes || !item.attributes.issue);
  }

  return false;
}

export function extractItemsAndAttributes(rawMessage, domain) {
  if (!rawMessage) return { items: [], has_contradictory_quantity: false };

  const converted = convertDevanagariDigits(rawMessage);
  let has_contradictory_quantity = false;

  if (/\b(?:do\s+ya\s+teen|teen\s+ya\s+chaar|char\s+ya\s+paanch|paanch\s+ya\s+chhe|1\s+ya\s+2|2\s+ya\s+3|3\s+ya\s+4|4\s+ya\s+5|5\s+ya\s+6|\d+\s+ya\s+\d+|\d+\s+or\s+\d+)\b/i.test(converted)) {
    has_contradictory_quantity = true;
  }

  const validItemsForDomain = (domain && DOMAIN_ITEMS[domain])
    ? new Set(DOMAIN_ITEMS[domain])
    : null;

  const seenCanonical = new Map();
  const clauses = rawMessage.split(/[,;.\n]+|\s+aur\s+|\s+and\s+/i);

  for (let cl of clauses) {
    if (!cl.trim()) continue;
    cl = convertDevanagariDigits(cl);

    for (const [canonicalDesc, aliases] of Object.entries(ALL_ITEMS_MAP)) {
      if (validItemsForDomain && !validItemsForDomain.has(canonicalDesc)) continue;

      for (const alias of aliases) {
        const aliasRe = new RegExp(`(?:^|[\\s,.;!?])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?(?=[\\s,.;!?]|$)`, 'i');
        if (aliasRe.test(cl)) {
          const negRe = new RegExp(`(?:${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(?:nahi|nahin|not)|(?:nahi|nahin|not)\\s+${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
          if (negRe.test(cl)) continue;

          if (!seenCanonical.has(canonicalDesc)) {
            let qty = 1;
            const matchIdx = cl.search(aliasRe);
            const beforeText = cl.slice(0, matchIdx);
            const afterText = cl.slice(matchIdx + alias.length);

            const beforeQtyMatch = beforeText.match(/(?:^|[\s,])(\d+(?:\.\d+)?|ek|do|teen|chaar|char|paanch|panch|chhah|che|chhe|saat|aath|nau|das|barah|darjan|dozen|दर्जन|एक|दो|तीन|चार|पाँच|पांच|छह|सात|आठ|नौ|दस)\s*(?:bhar|भर)?\s*$/i);
            const afterQtyMatch = afterText.match(/^\s*(\d+|ek|do|teen|chaar|char|paanch|panch|chhah|che|chhe|saat|aath|nau|das|barah|दर्जन|एक|दो|तीन|चार|पाँच|पांच|छह|सात|आठ|नौ|दस)\b/i);

            if (beforeQtyMatch) {
              const num = wordToNumber(beforeQtyMatch[1]);
              if (num !== null && num >= 1) qty = Math.round(num);
            } else if (afterQtyMatch) {
              const num = wordToNumber(afterQtyMatch[1]);
              if (num !== null && num >= 1) qty = Math.round(num);
            }

            const itemAttrs = extractSegmentAttributes(cl, domain);

            seenCanonical.set(canonicalDesc, {
              description: canonicalDesc,
              quantity: qty,
              attributes: itemAttrs
            });
            break;
          }
        }
      }
    }
  }

  // Fallback: full string scan if clauses missed an item
  if (seenCanonical.size === 0) {
    for (const [canonicalDesc, aliases] of Object.entries(ALL_ITEMS_MAP)) {
      if (validItemsForDomain && !validItemsForDomain.has(canonicalDesc)) continue;

      for (const alias of aliases) {
        const aliasRe = new RegExp(`(?:^|[\\s,.;!?])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?(?=[\\s,.;!?]|$)`, 'i');
        if (aliasRe.test(rawMessage)) {
          const negRe = new RegExp(`(?:${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(?:nahi|nahin|not)|(?:nahi|nahin|not)\\s+${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
          if (negRe.test(rawMessage)) continue;

          let qty = 1;
          const matchIdx = rawMessage.search(aliasRe);
          const beforeText = rawMessage.slice(0, matchIdx);
          const qtyM = beforeText.match(/(\d+|ek|do|teen|chaar|char|paanch|panch|chhah|che|chhe|saat|aath|nau|das|barah|darjan|dozen|दर्जन|एक|दो|तीन|चार|पाँच|पांच|छह|सात|आठ|नौ|दस)\s*(?:bhar|भर)?\s*$/i);
          if (qtyM) {
            const num = wordToNumber(qtyM[1]);
            if (num !== null && num >= 1) qty = Math.round(num);
          }

          const attrs = extractSegmentAttributes(rawMessage, domain);
          seenCanonical.set(canonicalDesc, {
            description: canonicalDesc,
            quantity: qty,
            attributes: attrs
          });
          break;
        }
      }
    }
  }

  // If only 1 item extracted, merge global attributes from entire message
  if (seenCanonical.size === 1) {
    const [singleItem] = seenCanonical.values();
    const globalAttrs = extractSegmentAttributes(rawMessage, domain);
    singleItem.attributes = {
      ...globalAttrs,
      ...(singleItem.attributes || {})
    };
  }

  return {
    items: Array.from(seenCanonical.values()),
    has_contradictory_quantity
  };
}
