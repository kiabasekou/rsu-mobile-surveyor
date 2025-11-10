// =============================================================================
// 5. CONSTANTES VALIDATION (constants/validationConstants.js)  
// =============================================================================
export const VALIDATION_RULES = {
  NIP: {
    PATTERN: /^[0-9]{10}$/,
    MIN_LENGTH: 10,
    MAX_LENGTH: 10,
    ERROR_MESSAGES: {
      REQUIRED: 'NIP requis',
      INVALID_FORMAT: 'NIP doit contenir exactement 10 chiffres',
      INVALID_CHECKSUM: 'NIP invalide (checksum incorrect)',
    },
  },
  
  PHONE: {
    PATTERN: /^(\+241|241)?[0-9]{8}$/,
    VALID_PREFIXES: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
    ERROR_MESSAGES: {
      REQUIRED: 'Numéro de téléphone requis',
      INVALID_FORMAT: 'Format téléphone gabonais invalide',
      INVALID_PREFIX: 'Préfixe téléphonique gabonais invalide',
    },
  },
  
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    ERROR_MESSAGES: {
      INVALID_FORMAT: 'Format email invalide',
    },
  },
  
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-ZÀ-ÿ\s\-']+$/,
    ERROR_MESSAGES: {
      REQUIRED: 'Ce champ est requis',
      TOO_SHORT: 'Trop court (minimum 2 caractères)',
      TOO_LONG: 'Trop long (maximum 50 caractères)',
      INVALID_CHARACTERS: 'Caractères invalides détectés',
    },
  },
  
  AGE: {
    MIN: 0,
    MAX: 120,
    ERROR_MESSAGES: {
      REQUIRED: 'Date de naissance requise',
      FUTURE_DATE: 'Date de naissance ne peut être dans le futur',
      TOO_OLD: 'Âge non réaliste (plus de 120 ans)',
      INVALID_DATE: 'Date de naissance invalide',
    },
  },
  
  INCOME: {
    MIN: 0,
    MAX: 10000000, // 10M FCFA
    ERROR_MESSAGES: {
      REQUIRED: 'Revenu mensuel requis',
      NEGATIVE: 'Revenu doit être un nombre positif',
      TOO_HIGH: 'Revenu semble trop élevé',
      INVALID_NUMBER: 'Veuillez saisir un nombre valide',
    },
  },
  
  HOUSEHOLD: {
    SIZE: {
      MIN: 1,
      MAX: 20,
      ERROR_MESSAGES: {
        REQUIRED: 'Taille du ménage requise',
        TOO_SMALL: 'Taille minimale: 1 personne',
        TOO_LARGE: 'Taille maximale: 20 personnes',
      },
    },
    DEPENDENTS: {
      MIN: 0,
      ERROR_MESSAGES: {
        NEGATIVE: 'Nombre de dépendants ne peut être négatif',
        EXCEEDS_SIZE: 'Dépendants ne peuvent dépasser la taille du ménage',
      },
    },
  },
};
