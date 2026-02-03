/**
 * =============================================================================
 * 🇬🇦 RSU GABON - FORMATTERS UTILITIES
 * Standards Top 1% - Fonctions de Formatage
 * =============================================================================
 */

/**
 * Formate un montant en FCFA
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '0 FCFA';
  return `${parseInt(amount).toLocaleString('fr-FR')} FCFA`;
}

/**
 * Formate une date en français
 */
export function formatDate(date, includeTime = false) {
  if (!date) return '';
  
  const d = new Date(date);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return d.toLocaleDateString('fr-FR', options);
}

/**
 * Formate un numéro de téléphone gabonais
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Enlever le +241 et espaces
  const cleaned = phone.replace(/^\+241/, '').replace(/\s/g, '');
  
  // Format: XX XX XX XX
  if (cleaned.length === 8) {
    return cleaned.match(/.{1,2}/g).join(' ');
  }
  
  return phone;
}

/**
 * Formate un nom complet
 */
export function formatFullName(firstName, lastName) {
  if (!firstName && !lastName) return '';
  return `${firstName || ''} ${lastName || ''}`.trim();
}

/**
 * Formate une adresse complète
 */
export function formatAddress(province, commune, quartier) {
  const parts = [quartier, commune, province].filter(Boolean);
  return parts.join(', ');
}

/**
 * Tronque un texte
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalise la première lettre
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Formate les coordonnées GPS
 */
export function formatCoordinates(latitude, longitude, precision = 6) {
  if (latitude === null || longitude === null) return '';
  return `${parseFloat(latitude).toFixed(precision)}, ${parseFloat(longitude).toFixed(precision)}`;
}
