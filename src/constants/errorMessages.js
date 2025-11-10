// =============================================================================
// CONSTANTS ET CONFIGURATION MOBILE RSU GABON
// =============================================================================

// =============================================================================
// 8. MESSAGES D'ERREUR (constants/errorMessages.js)
// =============================================================================
export const ERROR_MESSAGES = {
  // Erreurs réseau
  NETWORK: {
    NO_CONNECTION: 'Aucune connexion internet disponible',
    TIMEOUT: 'Délai d\'attente dépassé',
    SERVER_ERROR: 'Erreur serveur, veuillez réessayer',
    NOT_FOUND: 'Ressource non trouvée',
    UNAUTHORIZED: 'Accès non autorisé',
    FORBIDDEN: 'Action non autorisée',
  },
  
  // Erreurs authentification
  AUTH: {
    INVALID_CREDENTIALS: 'Identifiants incorrects',
    SESSION_EXPIRED: 'Session expirée, veuillez vous reconnecter',
    ACCOUNT_LOCKED: 'Compte verrouillé',
    PASSWORD_REQUIRED: 'Mot de passe requis',
    USERNAME_REQUIRED: 'Nom d\'utilisateur requis',
  },
  
  // Erreurs validation
  VALIDATION: {
    REQUIRED_FIELD: 'Ce champ est requis',
    INVALID_FORMAT: 'Format invalide',
    VALUE_TOO_LONG: 'Valeur trop longue',
    VALUE_TOO_SHORT: 'Valeur trop courte',
    INVALID_NUMBER: 'Nombre invalide',
    INVALID_DATE: 'Date invalide',
    INVALID_EMAIL: 'Email invalide',
    INVALID_PHONE: 'Numéro de téléphone invalide',
  },
  
  // Erreurs GPS
  GPS: {
    PERMISSION_DENIED: 'Permission GPS refusée',
    POSITION_UNAVAILABLE: 'Position GPS indisponible',
    TIMEOUT: 'Délai GPS dépassé',
    ACCURACY_LOW: 'Précision GPS insuffisante',
    OUTSIDE_GABON: 'Position en dehors du territoire gabonais',
  },
  
  // Erreurs synchronisation
  SYNC: {
    FAILED: 'Échec de la synchronisation',
    PARTIAL_FAILURE: 'Synchronisation partiellement échouée',
    DATA_CONFLICT: 'Conflit de données détecté',
    SERVER_FULL: 'Serveur saturé, réessayer plus tard',
    INVALID_DATA: 'Données invalides à synchroniser',
  },
  
  // Erreurs stockage
  STORAGE: {
    QUOTA_EXCEEDED: 'Espace de stockage insuffisant',
    ACCESS_DENIED: 'Accès au stockage refusé', 
    CORRUPTION: 'Données corrompues détectées',
    CLEANUP_FAILED: 'Échec du nettoyage des données',
  },
  
  // Messages génériques
  GENERIC: {
    UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite',
    TRY_AGAIN: 'Veuillez réessayer',
    CONTACT_SUPPORT: 'Contactez le support technique',
    OPERATION_CANCELLED: 'Opération annulée',
    DATA_NOT_AVAILABLE: 'Données non disponibles',
  },
};

// Export global pour faciliter les imports
export default {
  GABON_PROVINCES,
  VULNERABILITY_FACTORS,
  SCORING_CONFIG,
  API_CONFIG,
  FORM_OPTIONS,
  THEME_COLORS,
  SPACING,
  TYPOGRAPHY,
  ELEVATION,
  VALIDATION_RULES,
  OFFLINE_CONFIG,
  PERMISSIONS,
  ERROR_MESSAGES,
};