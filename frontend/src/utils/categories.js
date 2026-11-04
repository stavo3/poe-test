// Gig categories supported by the backend, plus the local illustration used for each.
// Images live in /public/images/categories so they load from the same origin (CSP-safe).
export const CATEGORY_LIST = [
  'design',
  'development',
  'writing',
  'marketing',
  'video',
  'music',
  'business',
  'other',
];

export function categoryImage(category) {
  const key = CATEGORY_LIST.includes(category) ? category : 'other';
  return `/images/categories/${key}.svg`;
}
