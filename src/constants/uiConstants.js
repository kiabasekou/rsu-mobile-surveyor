
// =============================================================================
// 4. CONSTANTES UI (constants/uiConstants.js)
// =============================================================================
export const THEME_COLORS = {
  // Couleurs officielles Gabon
  PRIMARY: '#2E7D32',        // Vert drapeau
  SECONDARY: '#FFB300',      // Jaune drapeau  
  TERTIARY: '#1976D2',       // Bleu gouvernemental
  
  // Couleurs système
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  
  // Couleurs vulnérabilité
  VULNERABILITY: {
    CRITICAL: '#F44336',     // Rouge
    HIGH: '#FF9800',         // Orange
    MODERATE: '#4CAF50',     // Vert
    LOW: '#9C27B0',          // Violet
  },
  
  // Couleurs status
  STATUS: {
    PENDING: '#FF9800',
    VERIFIED: '#4CAF50', 
    REJECTED: '#F44336',
    SYNCED: '#4CAF50',
    FAILED: '#F44336',
  },
  
  // Couleurs de fond
  BACKGROUND: '#F5F5F5',
  SURFACE: '#FFFFFF',
  CARD: '#FFFFFF',
  
  // Couleurs texte
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
  TEXT_DISABLED: '#BDBDBD',
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

export const TYPOGRAPHY = {
  SIZES: {
    CAPTION: 12,
    BODY: 14,
    SUBTITLE: 16,
    TITLE: 18,
    HEADLINE: 24,
    DISPLAY: 32,
  },
  WEIGHTS: {
    LIGHT: '300',
    REGULAR: '400', 
    MEDIUM: '500',
    BOLD: '700',
  },
};

export const ELEVATION = {
  NONE: 0,
  LOW: 2,
  MEDIUM: 4,
  HIGH: 8,
  HIGHEST: 16,
};
