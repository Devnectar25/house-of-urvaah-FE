/**
 * Color validation, normalization, and palette mapping utility for House of Urvaah.
 * Supports HEX codes (#RGB, #RRGGBB), standard fashion color names, and CSS colors.
 */

// Common high-fashion apparel color name to HEX mapping for storefront swatch previews
export const APPAREL_COLOR_MAP = {
  // Whites, Creams & Neutrals
  'white': '#FFFFFF',
  'off white': '#FAF9F6',
  'ivory': '#FFFFF0',
  'cream': '#FFFDD0',
  'beige': '#F5F5DC',
  'nude': '#E3BC9A',
  'champagne': '#F7E7CE',
  'sand': '#C2B280',
  'taupe': '#483C32',

  // Blacks & Greys
  'black': '#111111',
  'jet black': '#0A0A0A',
  'charcoal': '#36454F',
  'grey': '#808080',
  'gray': '#808080',
  'silver': '#C0C0C0',
  'metallic silver': '#C0C0C0',
  'slate': '#708090',

  // Reds & Maroons
  'red': '#E53E3E',
  'wine red': '#722F37',
  'wine': '#722F37',
  'maroon': '#800000',
  'burgundy': '#800020',
  'crimson': '#DC143C',
  'ruby': '#E0115F',
  'scarlet': '#FF2400',
  'brick red': '#CB4154',

  // Pinks & Corals
  'pink': '#FFC0CB',
  'baby pink': '#F4C2C2',
  'rose pink': '#FF66CC',
  'rose': '#FF007F',
  'dusty rose': '#DCAE96',
  'blush': '#DE5D83',
  'blush pink': '#FFD1DC',
  'fuchsia': '#FF00FF',
  'magenta': '#FF0090',
  'peach': '#FFE5B4',
  'coral': '#FF7F50',

  // Blues
  'blue': '#2B6CB0',
  'navy': '#000080',
  'navy blue': '#000080',
  'royal blue': '#4169E1',
  'sky blue': '#87CEEB',
  'baby blue': '#89CFF0',
  'cobalt': '#0047AB',
  'cobalt blue': '#0047AB',
  'teal': '#008080',
  'turquoise': '#40E0D0',
  'cyan': '#00FFFF',
  'midnight blue': '#191970',

  // Greens
  'green': '#2F855A',
  'emerald green': '#50C878',
  'emerald': '#50C878',
  'olive': '#808000',
  'olive green': '#556B2F',
  'sage': '#9DC183',
  'sage green': '#9DC183',
  'mint': '#98FF98',
  'mint green': '#98FF98',
  'bottle green': '#006A4E',
  'forest green': '#228B22',
  'moss green': '#8A9A5B',
  'pistachio': '#93C572',
  'sea green': '#2E8B57',

  // Yellows & Golds
  'yellow': '#ECC94B',
  'mustard': '#FFDB58',
  'mustard yellow': '#E1AD01',
  'gold': '#D4AF37',
  'metallic gold': '#D4AF37',
  'amber': '#FFBF00',
  'lemon': '#FFF700',

  // Oranges & Browns
  'orange': '#DD6B20',
  'rust': '#B7410E',
  'terracotta': '#E2725B',
  'brown': '#654321',
  'mocha': '#967117',
  'mocha brown': '#967117',
  'chocolate': '#7B3F00',
  'chocolate brown': '#3D1C02',
  'coffee': '#6F4E37',
  'chestnut': '#954535',
  'tan': '#D2B48C',
  'camel': '#C19A6B',
  'bronze': '#CD7F32',
  'copper': '#B87333',

  // Purples
  'purple': '#800080',
  'lavender': '#E6E6FA',
  'lilac': '#C8A2C8',
  'plum': '#8E4585',
  'violet': '#8F00FF',
  'mauve': '#E0B0FF',
  'indigo': '#4B0082',

  // Special
  'default': '#111111',
  'multicolor': 'linear-gradient(135deg, #FF6B6B, #4ECDC4, #FFE66D, #1A535C)'
};

/**
 * Checks if a string is a valid HEX color code (#RGB or #RRGGBB).
 */
export function isHexColor(str) {
  if (!str || typeof str !== 'string') return false;
  const clean = str.trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean);
}

/**
 * Checks if a string matches 3 or 6 hex characters without a leading '#'
 */
export function isBareHex(str) {
  if (!str || typeof str !== 'string') return false;
  const clean = str.trim();
  return /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean);
}

/**
 * Checks if the string is a valid CSS or recognized fashion color.
 */
export function isNamedColor(str) {
  if (!str || typeof str !== 'string') return false;
  const lower = str.trim().toLowerCase();

  // 1. Check in our comprehensive apparel color map
  if (APPAREL_COLOR_MAP[lower]) return true;

  // 2. Check in browser environment using Option/CSS if available
  if (typeof window !== 'undefined' && typeof Option !== 'undefined') {
    const s = new Option().style;
    s.color = '';
    s.color = lower;
    return Boolean(s.color);
  }

  return false;
}

/**
 * Validates whether an input represents a valid apparel color.
 * Accepts:
 * - Hex code: '#8B0000', '#111', '8B0000'
 * - Recognized color name: 'Emerald Green', 'Wine Red', 'Black', 'Ivory'
 * - RGB/HSL functional notation: 'rgb(255, 0, 0)'
 */
export function isValidColor(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (trimmed.length < 2) return false;

  // 1. Valid Hex code with #
  if (isHexColor(trimmed)) return true;

  // 2. Bare Hex without # (e.g. 8B0000 or 111111 or FFF)
  if (isBareHex(trimmed)) return true;

  // 3. Recognized named color
  if (isNamedColor(trimmed)) return true;

  // 4. CSS functional color (rgb, rgba, hsl, hsla)
  if (/^(rgb|rgba|hsl|hsla)\([\d\s,%./-]+\)$/i.test(trimmed)) return true;

  return false;
}

/**
 * Normalizes user color input:
 * - If 3 or 6 hex chars without '#', prepends '#' and uppercases (e.g. '8b0000' -> '#8B0000')
 * - If Hex with '#', uppercases hex letters (e.g. '#8b0000' -> '#8B0000')
 * - If text name, title-cases it (e.g. 'emerald green' -> 'Emerald Green')
 */
export function normalizeColor(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();

  // Bare hex: '8b0000' -> '#8B0000'
  if (isBareHex(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }

  // Hex with '#': '#8b0000' -> '#8B0000'
  if (isHexColor(trimmed)) {
    return `#${trimmed.slice(1).toUpperCase()}`;
  }

  // Named color: title case
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Returns a CSS-usable background color or gradient for visual swatch preview.
 */
export function getSwatchCss(colorStr) {
  if (!colorStr) return '#E5E5E5';
  const clean = colorStr.trim();
  const lower = clean.toLowerCase();

  // 1. Direct hex
  if (isHexColor(clean)) return clean;

  // 2. Bare hex
  if (isBareHex(clean)) return `#${clean}`;

  // 3. Apparel color map
  if (APPAREL_COLOR_MAP[lower]) return APPAREL_COLOR_MAP[lower];

  // 4. Browser color fallback
  return clean;
}

/**
 * Validates a color addition attempt.
 * Returns { valid: boolean, error: string | null, normalized: string }
 */
export function validateColorInput(raw, existingColors = []) {
  if (!raw || !raw.trim()) {
    return { valid: false, error: 'Please enter a color code or color name.', normalized: '' };
  }

  const trimmed = raw.trim();

  if (!isValidColor(trimmed)) {
    return {
      valid: false,
      error: `"${trimmed}" is not a recognized color. Please enter a valid HEX code (e.g. #8B0000) or apparel color name (e.g. Emerald Green, Wine Red, Ivory).`,
      normalized: ''
    };
  }

  const normalized = normalizeColor(trimmed);

  // Check duplicate (case-insensitive)
  const isDuplicate = existingColors.some(
    c => c.trim().toLowerCase() === normalized.toLowerCase()
  );

  if (isDuplicate) {
    return {
      valid: false,
      error: `Color "${normalized}" is already added.`,
      normalized
    };
  }

  return { valid: true, error: null, normalized };
}

/**
 * Common quick-pick fashion colors for admin product forms
 */
export const POPULAR_FASHION_COLORS = [
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Wine Red', hex: '#722F37' },
  { name: 'Emerald Green', hex: '#50C878' },
  { name: 'Navy Blue', hex: '#000080' },
  { name: 'Ivory', hex: '#FFFFF0' },
  { name: 'Mustard', hex: '#FFDB58' },
  { name: 'Blush Pink', hex: '#FFD1DC' }
];

/**
 * Filters and normalizes a list of colors, keeping only valid ones and removing duplicates.
 */
export function filterValidColors(colorList) {
  if (!Array.isArray(colorList)) return [];
  const result = [];
  for (const c of colorList) {
    if (typeof c === 'string' && isValidColor(c.trim())) {
      const norm = normalizeColor(c.trim());
      if (!result.some(r => r.toLowerCase() === norm.toLowerCase())) {
        result.push(norm);
      }
    }
  }
  return result;
}

/**
 * Shopper-facing name for a color the admin picked: a preset (stored as its name or its HEX) or a
 * typed color name. Returns null for the "Default" placeholder and for HEX codes that are not one
 * of the admin presets (old seeded values the admin never chose), so filters only offer real picks.
 */
export function getColorName(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') return null;
  const clean = colorStr.trim();
  if (!clean || clean.toLowerCase() === 'default') return null;
  if (!isHexColor(clean) && !isBareHex(clean)) return normalizeColor(clean);
  const hex = normalizeColor(clean);
  const preset = POPULAR_FASHION_COLORS.find((c) => c.hex.toUpperCase() === hex);
  return preset ? preset.name : null;
}

/** Sort color names in the admin preset order (Black, White, Wine Red...), then A-Z */
export function compareColorNames(a, b) {
  const rank = (n) => {
    const i = POPULAR_FASHION_COLORS.findIndex((c) => c.name.toLowerCase() === String(n).toLowerCase());
    return i === -1 ? POPULAR_FASHION_COLORS.length : i;
  };
  return rank(a) - rank(b) || String(a).localeCompare(String(b));
}

/** True when a stored color is this preset, saved either by name or by its HEX code */
export function isPresetColor(color, preset) {
  const c = String(color || '').trim().toLowerCase();
  return c === preset.name.toLowerCase() || c === preset.hex.toLowerCase();
}

/**
 * Clean a stored color list for the admin form: preset HEX codes become the preset name
 * (#111111 -> Black), duplicates are removed and the "Default" placeholder is dropped when real
 * colors exist. Saving the form then stores each color once, by name.
 */
export function normalizePresetColors(colors) {
  if (!Array.isArray(colors)) return [];
  const out = [];
  colors.forEach((raw) => {
    if (typeof raw !== 'string' || !raw.trim()) return;
    const preset = POPULAR_FASHION_COLORS.find((p) => isPresetColor(raw, p));
    const value = preset ? preset.name : raw.trim();
    if (!out.some((v) => v.toLowerCase() === value.toLowerCase())) out.push(value);
  });
  const real = out.filter((c) => c.toLowerCase() !== 'default');
  return real.length > 0 ? real : out;
}
