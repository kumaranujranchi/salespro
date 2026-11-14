/**
 * RealSalePro Contact & Name Intelligence Utilities
 * Prevents treating companies (e.g. "AR developer", "Shivam Real Estate") as human personal names,
 * and ensures honorifics like "ji" are NEVER appended to business/company entities.
 */

/**
 * Detects whether a string is a company, agency, firm, developer, builder, or business entity name.
 */
export function isCompanyOrBusinessName(name) {
  if (!name || typeof name !== 'string') return false;
  const str = name.trim();
  if (!str) return false;

  // Domain / email / handle / phone patterns / URLs
  if (/[@&#]|(\.com|\.in|\.org|\.net|\.co|\.io|www\.)/i.test(str)) return true;
  if (/^\+?\d[\d\s\-()]{6,}$/.test(str)) return true;

  // Business / commercial entity keywords (covers builders, developers, real estate firms, agencies)
  const businessWords = [
    'developer', 'developers', 'development',
    'realty', 'real estate', 'realestate', 'realtor', 'realtors',
    'builder', 'builders', 'buildcon', 'construction', 'constructions',
    'infra', 'infrastructure', 'infratech',
    'properties', 'property', 'estates?',
    'enterprises?', 'solutions?', 'services?', 'group', 'associates?',
    'consultants?', 'consultancy', 'consulting',
    'holdings?', 'homes?', 'housing', 'ventures?',
    'technologies', 'tech', 'studios?', 'industries', 'corporation', 'corp',
    'firm', 'company', 'promoters?', 'agency', 'agencies',
    'pvt', 'ltd', 'limited', 'llp', 'inc',
    'architects?', 'interiors?', 'designers?',
    'marketing', 'advisors?', 'capital', 'brokerage', 'broker', 'brokers',
    'desk', 'sales', 'support', 'admin', 'office', 'official', 'info', 'team',
    'management', 'investments?'
  ];

  const pattern = new RegExp(`\\b(${businessWords.join('|')})\\b`, 'i');
  return pattern.test(str);
}

/**
 * Checks if a name is a generic placeholder or bot-like handle.
 */
export function isGenericOrHandle(name) {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 40) return true;
  if (/^(hey|visitor|user|website visitor|guest|whatsapp user|client|customer|admin|mydigitalera|sir|madam|unknown|test|none|null|undefined)$/i.test(trimmed)) return true;
  // If it contains only digits, spaces, or punctuation
  if (!/[a-zA-Z\u0900-\u097F]/.test(trimmed)) return true;
  return false;
}

/**
 * Extracts and cleans a personal human name.
 * Returns null if the string is a company, generic handle, phone number, or invalid.
 */
export function extractCleanPersonalName(name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (isGenericOrHandle(trimmed)) return null;

  // Check compound profile names like "Anuj | AR Developer" or "Rahul - Apex Realty"
  if (/[-|/:,]/.test(trimmed)) {
    const parts = trimmed.split(/[-|/:,]/).map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (!isCompanyOrBusinessName(part) && !isGenericOrHandle(part)) {
        const cleanPart = part.replace(/[^\p{L}\s.'-]/gu, '').replace(/\s+/g, ' ').trim();
        if (cleanPart.length >= 2 && cleanPart.length <= 30 && !isCompanyOrBusinessName(cleanPart)) {
          return cleanPart;
        }
      }
    }
    return null;
  }

  // Pure single entity check: if the entire string is a company name, return null
  if (isCompanyOrBusinessName(trimmed)) return null;

  // Clean out extraneous emojis, numbers, and symbols
  const clean = trimmed.replace(/[^\p{L}\s.'-]/gu, '').replace(/\s+/g, ' ').trim();
  if (clean.length < 2 || clean.length > 30) return null;
  if (isCompanyOrBusinessName(clean) || isGenericOrHandle(clean)) return null;

  return clean;
}

/**
 * Extracts company name if present in name string.
 */
export function extractCompanyName(name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed || isGenericOrHandle(trimmed)) return null;

  if (/[-|/:,]/.test(trimmed)) {
    const parts = trimmed.split(/[-|/:,]/).map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (isCompanyOrBusinessName(part)) {
        return part;
      }
    }
  }

  if (isCompanyOrBusinessName(trimmed)) {
    return trimmed;
  }
  return null;
}
