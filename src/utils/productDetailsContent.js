/**
 * Product Details content helpers.
 *
 * The `product_details` column is a JSON array. Rich-editor content is stored as a single
 * entry `{ label: '', value: '<html>', format: 'rich' }` so no schema change is needed, while
 * older `{ label, value }` bullet rows keep working.
 */

export const isRichDetailEntry = (entry) => Boolean(entry && entry.format === 'rich');

const parseDetailsArray = (raw) => {
  let list = raw;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch (e) { return []; }
  }
  return Array.isArray(list) ? list : [];
};

/** Legacy label/value rows only (excludes the rich-text entry) */
export const getLegacyDetailRows = (raw) =>
  parseDetailsArray(raw).filter((d) => d && !isRichDetailEntry(d));

const rowsSignature = (rows) =>
  rows
    .map((d) => `${String(d.label || d.title || '').trim().toLowerCase()}=${String(d.value || '').trim().toLowerCase()}`)
    .join('|');

/**
 * Rich text for the editor / renderer; converts legacy rows to an HTML bullet list.
 * Older admin saves copied the Additional Information rows into product_details, so legacy
 * rows identical to `specifications` are treated as "no product details".
 */
export const productDetailsToRichText = (raw, specifications = null) => {
  const list = parseDetailsArray(raw);
  const richEntry = list.find(isRichDetailEntry);
  if (richEntry) return String(richEntry.value || '');

  const rows = list.filter(
    (d) => d && typeof d.value === 'string' && d.value.trim()
  );
  if (rows.length === 0) return '';

  const specRows = parseDetailsArray(specifications).filter(
    (d) => d && typeof d.value === 'string' && d.value.trim()
  );
  if (specRows.length > 0 && rowsSignature(specRows) === rowsSignature(rows)) return '';

  const items = rows.map((d) => {
    const label = (d.label || '').trim();
    return label
      ? `  <li><strong>${label}:</strong> ${d.value.trim()}</li>`
      : `  <li>${d.value.trim()}</li>`;
  });
  return `<ul>\n${items.join('\n')}\n</ul>`;
};

/** Value to save from the rich editor */
export const richTextToProductDetails = (text) => {
  const trimmed = String(text || '').trim();
  return trimmed ? [{ label: '', value: trimmed, format: 'rich' }] : [];
};

/** True when the content has visible text (ignores empty tags / whitespace) */
export const hasVisibleRichText = (text) =>
  String(text || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
