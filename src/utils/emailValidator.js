export const COMMON_DOMAIN_TYPOS = {
  // Gmail
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaol.com': 'gmail.com',
  'gmaio.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.c': 'gmail.com',
  'gmai.co': 'gmail.com',
  'gmailc.om': 'gmail.com',
  'gamil.co': 'gmail.com',
  'gmaill.con': 'gmail.com',

  // Hotmail / Outlook
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'hotamail.com': 'hotmail.com',
  'homail.com': 'hotmail.com',
  'hotmai.co': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outluk.com': 'outlook.com',
  'outlock.com': 'outlook.com',
  'outloook.com': 'outlook.com',

  // Yahoo
  'yahho.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yaho.co': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',

  // iCloud
  'iclud.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  'icould.com': 'icloud.com',
  'icloud.con': 'icloud.com',

  // Rediffmail
  'redifmail.com': 'rediffmail.com',
  'rediff.com': 'rediffmail.com',
};

export const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmailClient(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  const clean = email.trim().toLowerCase();

  if (clean.length > 254) {
    return { isValid: false, message: 'Email address is too long' };
  }

  if (!STRICT_EMAIL_REGEX.test(clean)) {
    return { isValid: false, message: 'Please enter a valid email address (e.g. yourname@gmail.com)' };
  }

  const parts = clean.split('@');
  if (parts.length !== 2) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  const [localPart, domain] = parts;

  if (localPart.length > 64) {
    return { isValid: false, message: 'The username part of your email is too long' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { isValid: false, message: 'Email cannot contain consecutive dots or start/end with a dot' };
  }

  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, message: 'The email domain ending is invalid (must be e.g. .com, .in)' };
  }

  if (COMMON_DOMAIN_TYPOS[domain]) {
    const suggested = COMMON_DOMAIN_TYPOS[domain];
    return {
      isValid: false,
      message: `Did you mean @${suggested}? Please check for typos.`
    };
  }

  return { isValid: true, cleanEmail: clean };
}
