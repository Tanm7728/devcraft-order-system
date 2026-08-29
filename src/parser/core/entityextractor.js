/**
 * entityextractor.js
 * Domain-aware entity and attribute extraction matching DevCraft schema and vocabulary.
 * Pure JS — zero network calls.
 */

import { convertDevanagariDigits, wordToNumber } from '../utils/numberWords.js';

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
  'ceiling fan': ['ceiling fan', 'pankha', 'पंखा', 'सीलिंग फैन'],
  'doorbell': ['doorbell', 'bell', 'ghanti', 'घंटी', 'डोरबेल'],
  'exhaust fan': ['exhaust fan', 'exhaust', 'एग्जॉस्ट फैन'],
  'geyser': ['geyser', 'gizer', 'गीजर'],
  'inverter': ['inverter', 'इन्वर्टर'],
  'mcb': ['mcb', 'एमसीबी'],
  'socket': ['socket', 'सॉकेट'],
  'switch board': ['switch board', 'switchboard', 'स्विच बोर्ड', 'स्विचबोर्ड'],
  'tube light': ['tube light', 'tubelight', 'ट्यूब लाइट'],
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
 * Automatically detects the business domain from unstructured customer messages.
 * @param {string} message
 * @returns {'tailor' | 'tiffin' | 'electrician' | 'baker'}
 */
export function detectDomain(message) {
  if (!message || typeof message !== 'string') return 'tailor';
  const lower = message.toLowerCase();

  const scores = { tailor: 0, tiffin: 0, electrician: 0, baker: 0 };

  // Domain 1: Tailor
  const tailorKeywords = [
    'blouse', 'kurta', 'kurti', 'pajama', 'pyjama', 'pant', 'pent', 'shirt', 'salwar', 'lehenga',
    'lehnga', 'sherwani', 'suit', 'waistcoat', 'koti', 'dupatta', 'kameez', 'trouser', 'vest',
    'ब्लाउज', 'कुर्ता', 'कुर्ती', 'पजामा', 'पैजामा', 'पेंट', 'पैंट', 'कमीज', 'शर्ट', 'सलवार', 'लहंगा', 'शेरवानी', 'सूट', 'कोटी', 'दुपट्टा',
    'chest', 'chhati', 'waist', 'kamar', 'length', 'lambai', 'lambaai', 'sleeve', 'aasteen', 'silna', 'silwana', 'silana',
    'silaai', 'stitching', 'stitch', 'fabric', 'kapda', 'kapde', 'cotton', 'silk', 'linen', 'georgette', 'naap', 'naapna',
    'alteration', 'alter', 'fitting', 'slim fit', 'loose'
  ];
  for (const kw of tailorKeywords) {
    if (lower.includes(kw)) scores.tailor += 3;
  }

  // Domain 2: Tiffin
  const tiffinKeywords = [
    'tiffin', 'lunch', 'dinner', 'dabba', 'meal', 'roti', 'chapati', 'phulka', 'dal', 'daal',
    'sabzi', 'sabji', 'bhaji', 'rice', 'chawal', 'rajma', 'chole', 'paneer', 'paratha', 'poha',
    'idli', 'khichdi', 'curd', 'dahi', 'thali', 'टिफिन', 'लंच', 'डिनर', 'डब्बा', 'रोटी', 'दाल', 'सब्जी', 'चावल', 'राजमा', 'छोले', 'पनीर', 'पराठा', 'पोहा', 'इडली', 'खिचड़ी', 'दही', 'थाली',
    'jain', 'swaminarayan', 'kam teekha', 'teekha', 'spice', 'spicy', 'mirchi', 'portion', 'dopahar', 'nashta', 'khana', 'pack'
  ];
  for (const kw of tiffinKeywords) {
    if (lower.includes(kw)) scores.tiffin += 3;
  }

  // Domain 3: Electrician
  const electricianKeywords = [
    'geyser', 'gizer', 'fan', 'pankha', 'exhaust', 'wiring', 'wire', 'socket', 'switch', 'switchboard',
    'mcb', 'inverter', 'motor', 'water motor', 'tubelight', 'tube light', 'bulb', 'ac point', 'doorbell', 'bell', 'ghanti',
    'गीजर', 'पंखा', 'सीलिंग फैन', 'एग्जॉस्ट', 'वायरिंग', 'सॉकेट', 'स्विच', 'स्विचबोर्ड', 'इन्वर्टर', 'मोटर', 'ट्यूब लाइट', 'घंटी', 'डोरबेल',
    'short circuit', 'short', 'spark', 'current', 'jhatka', 'fuse', 'watt', 'havells', 'crompton', 'bajaj', 'usha', 'anchor',
    'orient', 'polycab', 'philips', 'syska', 'chal nahi raha', 'band hai', 'kharab'
  ];
  for (const kw of electricianKeywords) {
    if (lower.includes(kw)) scores.electrician += 3;
  }

  // Domain 4: Baker
  const bakerKeywords = [
    'cake', 'birthday cake', 'bday cake', 'pastry', 'brownie', 'cupcake', 'cookies', 'cookie', 'bread loaf',
    'bread', 'muffin', 'donut', 'doughnut', 'cheesecake', 'केक', 'बर्थडे केक', 'पेस्ट्री', 'ब्राउनी', 'कपकेक', 'कुकीज़', 'ब्रेड', 'मफिन', 'डोनट', 'चीज़केक',
    'flavour', 'flavor', 'chocolate', 'vanilla', 'strawberry', 'pineapple', 'black forest', 'red velvet',
    'butterscotch', 'eggless', 'egg free', 'bina ande', 'ande bina', 'kg', 'kilo', 'pound', 'tier', 'message on cake', 'happy birthday'
  ];
  for (const kw of bakerKeywords) {
    if (lower.includes(kw)) scores.baker += 3;
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

export function extractCustomer(message) {
  if (!message) return null;

  const decoyMatch = message.match(CUSTOMER_DECOY_PATTERN);
  if (decoyMatch && decoyMatch[2]) {
    const raw = decoyMatch[2].trim();
    for (const kn of KNOWN_CUSTOMERS) {
      if (kn.toLowerCase() === raw.toLowerCase() || raw.toLowerCase().startsWith(kn.toLowerCase().split(' ')[0])) {
        return kn;
      }
    }
    return raw;
  }

  const bolMatch = message.match(/^((?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+(?:\s+(?:didi|bhaiya|bhai|uncle|aunty|ji|bhabhi))?)\s+bol\s+raha\s+hu/iu);
  if (bolMatch && bolMatch[1]) {
    const raw = bolMatch[1].trim();
    for (const kn of KNOWN_CUSTOMERS) {
      if (kn.toLowerCase() === raw.toLowerCase() || raw.toLowerCase().startsWith(kn.toLowerCase().split(' ')[0])) {
        return kn;
      }
    }
    return raw;
  }

  const keLiyeMatch = message.match(/^((?:\p{Lu}|\p{Lo})[\p{L}\p{M}]+(?:\s+(?:didi|bhaiya|bhai|uncle|aunty|ji|bhabhi))?)\s+ke\s+liye\b/iu);
  if (keLiyeMatch && keLiyeMatch[1]) {
    const raw = keLiyeMatch[1].trim();
    for (const kn of KNOWN_CUSTOMERS) {
      if (kn.toLowerCase() === raw.toLowerCase() || raw.toLowerCase().startsWith(kn.toLowerCase().split(' ')[0])) {
        return kn;
      }
    }
    return raw;
  }

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

    for (const [k, v] of Object.entries(FITS)) {
      if (new RegExp(`\\b${k}\\s*(?:fit)?\\b`, 'i').test(lower)) {
        attrs.fit = v;
        break;
      }
    }

    for (const [k, v] of Object.entries(SLEEVES)) {
      if (new RegExp(`\\b${k.replace('/', '\\/')}\\b`, 'i').test(lower) || lower.includes(k)) {
        attrs.sleeve = v;
        break;
      }
    }

    for (const sz of SIZES) {
      if (new RegExp(`\\b(?:size\\s*)?${sz}\\b`, 'i').test(text)) {
        attrs.size = sz;
        break;
      }
    }

    for (const fab of FABRICS) {
      if (new RegExp(`\\b${fab}\\b`, 'i').test(lower)) {
        attrs.fabric = fab;
        break;
      }
    }

    for (const col of COLORS) {
      if (new RegExp(`\\b${col}\\b`, 'i').test(lower)) {
        attrs.color = col;
        break;
      }
    }
  }

  if (!domain || domain === 'electrician') {
    for (const br of BRANDS) {
      if (new RegExp(`\\b${br}\\b`, 'i').test(text)) {
        attrs.brand = br;
        break;
      }
    }

    for (const [k, v] of Object.entries(ISSUES)) {
      if (lower.includes(k)) {
        attrs.issue = v;
        break;
      }
    }

    for (const rm of ROOMS) {
      if (new RegExp(`\\b${rm}\\b`, 'i').test(lower)) {
        attrs.room = rm;
        break;
      }
    }

    const wattM = converted.match(/\b(\d+|athais|tees|chalis|saath|assi|sau)\s*(?:watt|w|wattage)\b/i);
    if (wattM) {
      const num = wordToNumber(wattM[1]);
      if (num !== null) attrs.wattage = num;
    }

    for (const app of APPLIANCES) {
      const appNegated = new RegExp(`(?:${app}\\s+(?:nahi|nahin|not)|(?:nahi|nahin|not)\\s+${app})`, 'i').test(lower);
      if (!appNegated && new RegExp(`\\b${app}\\b`, 'i').test(lower)) {
        attrs.appliance = app;
        break;
      }
    }
  }

  if (!domain || domain === 'tiffin') {
    const daysM = converted.match(/\b(\d+|ek|do|teen|chaar|paanch|chhah|saat|das)\s*(?:din|days|day)\b/i);
    if (daysM) {
      const num = wordToNumber(daysM[1]);
      if (num !== null) attrs.days = num;
    }

    const rotiM = converted.match(/\b(\d+|ek|do|teen|chaar|paanch|chhah|saat|das)\s*(?:roti|chapati|phulka)\b/i);
    if (rotiM) {
      const num = wordToNumber(rotiM[1]);
      if (num !== null) attrs.roti_count = num;
    }

    if (/\bjain\b/i.test(lower) || /जैन/u.test(text)) {
      attrs.jain = true;
    }

    for (const [k, v] of Object.entries(SPICE_LEVELS)) {
      if (lower.includes(k)) {
        attrs.spice_level = v;
        break;
      }
    }

    for (const [k, v] of Object.entries(MEALS)) {
      if (new RegExp(`\\b${k}\\b`, 'i').test(lower)) {
        attrs.meal = v;
        break;
      }
    }

    for (const [k, v] of Object.entries(PORTIONS)) {
      if (new RegExp(`\\b${k}\\b`, 'i').test(lower)) {
        attrs.portion = v;
        break;
      }
    }
  }

  if (!domain || domain === 'baker') {
    for (const flv of FLAVOURS) {
      if (lower.includes(flv)) {
        attrs.flavour = flv;
        break;
      }
    }

    const wtM = converted.match(/\b(\d+(?:\.\d+)?|half|aadha|dedh|dhai)\s*(?:kg|kilo|pound)?\b/i);
    if (wtM && (/\bkg\b/i.test(lower) || /\bkilo\b/i.test(lower) || /\bweight\b/i.test(lower) || /\b(\d+(?:\.\d+)?)\s*kg\b/i.test(lower))) {
      const num = wordToNumber(wtM[1]);
      if (num !== null) attrs.weight_kg = num;
    }

    if (/\begg\s*less|egg\s*free|bina\s+ande|bina\s+anda\b/i.test(lower)) {
      attrs.egg_free = true;
    }

    const tierM = converted.match(/\b(\d+)\s*(?:tier|step|manzil)\b/i);
    if (tierM) {
      attrs.tier = parseInt(tierM[1], 10);
    }

    for (const shp of SHAPES) {
      if (lower.includes(shp)) {
        attrs.shape = shp;
        break;
      }
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
        const aliasRe = new RegExp(`(?:^|[\\s,.;!?])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s,.;!?]|$)`, 'i');
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

            seenCanonical.set(canonicalDesc, {
              quantity: qty,
              clauses: [cl]
            });
          } else {
            seenCanonical.get(canonicalDesc).clauses.push(cl);
          }
          break;
        }
      }
    }
  }

  const globalAttrs = extractSegmentAttributes(rawMessage, domain);
  const totalItemCount = seenCanonical.size;

  const results = [];
  for (const [canonicalDesc, data] of seenCanonical.entries()) {
    let itemAttrs = {};
    if (totalItemCount === 1) {
      // Single item: all global attributes belong to this item
      itemAttrs = { ...globalAttrs };
    } else {
      // Multiple items: combine clause-specific attributes
      for (const cl of data.clauses) {
        const clAttrs = extractSegmentAttributes(cl, domain);
        itemAttrs = { ...itemAttrs, ...clAttrs };
      }
    }

    results.push({
      description: canonicalDesc,
      quantity: data.quantity,
      attributes: itemAttrs
    });
  }

  return { items: results, has_contradictory_quantity };
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
