/**
 * Complete, authoritative list of 28 Indian States & 8 Union Territories
 * Sorted in strict alphabetical order.
 */
export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

/**
 * Safely match any raw or legacy state string (case-insensitive) to an exact state in INDIAN_STATES.
 * If unmatched, returns empty string to gracefully default to the disabled "Select State" placeholder.
 */
export const findMatchedState = (rawState) => {
  if (!rawState) return '';
  const trimmed = String(rawState).trim().toLowerCase();
  const match = INDIAN_STATES.find((st) => st.toLowerCase() === trimmed);
  return match || '';
};
