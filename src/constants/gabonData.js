// =============================================================================
// CONSTANTS ET CONFIGURATION MOBILE RSU GABON
// =============================================================================

// =============================================================================
// 1. DONNÉES GABON (constants/gabonData.js)
// =============================================================================
export const GABON_PROVINCES = {
  ESTUAIRE: {
    name: 'Estuaire',
    capital: 'Libreville',
    departments: [
      'Libreville',
      'Komo-Mondah',
      'Noya',
    ],
    vulnerability_level: 'LOW',
    urban_rate: 0.89,
  },
  HAUT_OGOOUE: {
    name: 'Haut-Ogooué',
    capital: 'Franceville',
    departments: [
      'Franceville',
      'Lekoko',
      'Lemboumbi-Leyou',
      'Mpassa',
      'Plateaux Batéké',
      'Sebe-Brikolo',
    ],
    vulnerability_level: 'MODERATE',
    urban_rate: 0.67,
  },
  MOYEN_OGOOUE: {
    name: 'Moyen-Ogooué',
    capital: 'Lambaréné',
    departments: [
      'Abanga-Bigne',
      'Lambaréné',
      'Ogooué et des Lacs',
    ],
    vulnerability_level: 'MODERATE',
    urban_rate: 0.54,
  },
  NGOUNIE: {
    name: 'Ngounié',
    capital: 'Mouila',
    departments: [
      'Boumi-Louetsi',
      'Douya-Onoye',
      'Dola',
      'Louetsi-Wano',
      'Lolo-Bouenguidi',
      'Mimongo',
      'Tsamba-Magotsi',
    ],
    vulnerability_level: 'HIGH',
    urban_rate: 0.43,
  },
  NYANGA: {
    name: 'Nyanga',
    capital: 'Tchibanga',
    departments: [
      'Basse-Banio',
      'Douigny',
      'Haute-Banio',
      'Mondah-Ndounga',
      'Mougoutsi',
      'Doutsila',
    ],
    vulnerability_level: 'CRITICAL',
    urban_rate: 0.31,
  },
  OGOOUE_IVINDO: {
    name: 'Ogooué-Ivindo',
    capital: 'Makokou',
    departments: [
      'Ivindo',
      'Lope',
      'Mvoung',
      'Zadie',
    ],
    vulnerability_level: 'HIGH',
    urban_rate: 0.38,
  },
  OGOOUE_LOLO: {
    name: 'Ogooué-Lolo',
    capital: 'Koulamoutou',
    departments: [
      'Booue',
      'Lolo',
      'Lombo-Bouenguidi',
      'Offoue-Onoye',
      'Mulundu',
    ],
    vulnerability_level: 'HIGH',
    urban_rate: 0.45,
  },
  OGOOUE_MARITIME: {
    name: 'Ogooué-Maritime',
    capital: 'Port-Gentil',
    departments: [
      'Bendje',
      'Etimboue',
      'Komo-Kango',
      'Ndougou',
      'Port-Gentil',
    ],
    vulnerability_level: 'MODERATE',
    urban_rate: 0.72,
  },
  WOLEU_NTEM: {
    name: 'Woleu-Ntem',
    capital: 'Oyem',
    departments: [
      'Haut-Como',
      'Haut-Ntem',
      'Okano',
      'Woleu',
    ],
    vulnerability_level: 'MODERATE',
    urban_rate: 0.56,
  },
};

// Facteurs de vulnérabilité contextualisés Gabon
export const VULNERABILITY_FACTORS = {
  ECONOMIC: {
    UNEMPLOYMENT: {
      label: 'Chômage',
      weight: 0.25,
      threshold: 'occupationStatus === "UNEMPLOYED"',
    },
    LOW_INCOME: {
      label: 'Revenu faible',
      weight: 0.20,
      threshold: 'monthlyIncome < 100000', // FCFA
    },
    INFORMAL_WORK: {
      label: 'Emploi informel',
      weight: 0.15,
      threshold: 'occupationStatus === "INFORMAL"',
    },
    NO_SAVINGS: {
      label: 'Pas d\'épargne',
      weight: 0.10,
      threshold: 'hasSavings === "no"',
    },
    POOR_HOUSING: {
      label: 'Logement précaire',
      weight: 0.15,
      threshold: 'housingType === "PRECARIOUS"',
    },
    NO_ELECTRICITY: {
      label: 'Pas d\'électricité',
      weight: 0.10,
      threshold: 'hasElectricity === "no"',
    },
    NO_WATER: {
      label: 'Pas d\'eau courante',
      weight: 0.05,
      threshold: 'hasRunningWater === "no"',
    },
  },
  SOCIAL: {
    NO_EDUCATION: {
      label: 'Aucune éducation',
      weight: 0.30,
      threshold: 'educationLevel === "NONE"',
    },
    PRIMARY_ONLY: {
      label: 'Primaire seulement',
      weight: 0.20,
      threshold: 'educationLevel === "PRIMARY"',
    },
    FEMALE_HEAD: {
      label: 'Chef de ménage féminine',
      weight: 0.15,
      threshold: 'gender === "F" && isHouseholdHead === true',
    },
    YOUNG_PARENT: {
      label: 'Parent jeune (<25 ans)',
      weight: 0.15,
      threshold: 'age < 25 && dependents > 0',
    },
    ELDERLY: {
      label: 'Personne âgée (>65 ans)',
      weight: 0.20,
      threshold: 'age > 65',
    },
  },
  DEMOGRAPHIC: {
    LARGE_HOUSEHOLD: {
      label: 'Ménage nombreux (>6)',
      weight: 0.25,
      threshold: 'householdSize > 6',
    },
    HIGH_DEPENDENCY: {
      label: 'Ratio dépendance élevé',
      weight: 0.30,
      threshold: '(dependents / householdSize) > 0.6',
    },
    LOW_INCOME_PER_CAPITA: {
      label: 'Revenu/personne faible',
      weight: 0.25,
      threshold: '(totalIncome / householdSize) < 50000',
    },
    SINGLE_PARENT: {
      label: 'Parent isolé',
      weight: 0.20,
      threshold: 'maritalStatus === "SINGLE" && dependents > 0',
    },
  },
  GEOGRAPHIC: {
    RURAL_REMOTE: {
      label: 'Zone rurale isolée',
      weight: 0.40,
      threshold: 'province IN ["NYANGA", "OGOOUE_IVINDO", "OGOOUE_LOLO"]',
    },
    LIMITED_ACCESS: {
      label: 'Accès limité services',
      weight: 0.30,
      threshold: 'distanceToServices > 50', // km
    },
    POOR_INFRASTRUCTURE: {
      label: 'Infrastructure déficiente',
      weight: 0.30,
      threshold: 'infrastructureScore < 40',
    },
  },
  RESILIENCE: {
    NO_SOCIAL_NETWORK: {
      label: 'Pas de réseau social',
      weight: 0.25,
      threshold: 'hasSocialSupport === "no"',
    },
    FOOD_INSECURITY: {
      label: 'Insécurité alimentaire',
      weight: 0.35,
      threshold: 'hasFoodSecurity === "no"',
    },
    NO_EMERGENCY_FUND: {
      label: 'Pas de fonds d\'urgence',
      weight: 0.20,
      threshold: 'hasEmergencyFund === "no"',
    },
    HEALTH_ISSUES: {
      label: 'Problèmes de santé',
      weight: 0.20,
      threshold: 'hasHealthIssues === "yes"',
    },
  },
};

// Configuration scoring selon standards RSU Gabon
export const SCORING_CONFIG = {
  WEIGHTS: {
    economic: 0.30,
    social: 0.25,
    demographic: 0.20,
    geographic: 0.15,
    resilience: 0.10,
  },
  THRESHOLDS: {
    CRITICAL: 75,
    HIGH: 50,
    MODERATE: 25,
    LOW: 0,
  },
  INCOME_THRESHOLDS: {
    EXTREME_POVERTY: 30000,   // FCFA/mois
    POVERTY: 60000,
    LOW_INCOME: 150000,
    MIDDLE_CLASS: 400000,
    HIGH_INCOME: 1000000,
  },
  AGE_VULNERABILITY: {
    CHILD: { min: 0, max: 5, weight: 0.8 },
    YOUTH: { min: 15, max: 24, weight: 0.6 },
    ADULT: { min: 25, max: 54, weight: 0.3 },
    ELDERLY: { min: 65, max: 120, weight: 0.9 },
  },
};

// =============================================================================
// 2. CONFIGURATION API (constants/apiConfig.js)
// =============================================================================
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:8000/api/v1' 
    : 'https://rsu-api.gouv.ga/api/v1',
  
  TIMEOUT: 30000,
  
  ENDPOINTS: {
    // Authentification
    LOGIN: '/auth/token/',
    REFRESH: '/auth/token/refresh/',
    LOGOUT: '/auth/logout/',
    
    // Identity
    PERSONS: '/identity/persons/',
    HOUSEHOLDS: '/identity/households/',
    VALIDATE_NIP: '/identity/validate-nip/',
    SEARCH_DUPLICATES: '/identity/persons/search_duplicates/',
    
    // Services
    VULNERABILITY_ASSESSMENT: '/services/vulnerability-assessments/',
    CALCULATE_SCORE: '/services/vulnerability-assessments/calculate_assessment/',
    VULNERABILITY_STATS: '/services/vulnerability-assessments/statistics/',
    
    // Enrollment
    SUBMIT_ENROLLMENT: '/enrollment/submit/',
    CHECK_ELIGIBILITY: '/enrollment/check-eligibility/',
    
    // Surveys
    SURVEY_TEMPLATES: '/surveys/templates/',
    SUBMIT_SURVEY: '/surveys/submit/',
    
    // Dashboard
    SURVEYOR_STATS: '/dashboard/surveyor-stats/',
    RECENT_ACTIVITY: '/dashboard/recent-activity/',
    
    // Sync
    BULK_UPLOAD: '/sync/bulk-upload/',
    SYNC_STATUS: '/sync/status/',
  },
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Platform': 'mobile',
  },
  
  // Configuration retry
  RETRY_CONFIG: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      return error.code === 'NETWORK_ERROR' || 
             (error.response && error.response.status >= 500);
    },
  },
};

// =============================================================================
// 3. CONSTANTES FORMULAIRES (constants/formConstants.js)
// =============================================================================
export const FORM_OPTIONS = {
  GENDER: [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' },
  ],
  
  EDUCATION_LEVELS: [
    { value: 'NONE', label: 'Aucune éducation' },
    { value: 'INCOMPLETE_PRIMARY', label: 'Primaire incomplet' },
    { value: 'PRIMARY', label: 'Primaire' },
    { value: 'SECONDARY', label: 'Secondaire' },
    { value: 'HIGH_SCHOOL', label: 'Baccalauréat' },
    { value: 'TECHNICAL', label: 'Formation technique' },
    { value: 'UNIVERSITY', label: 'Universitaire' },
    { value: 'POSTGRADUATE', label: 'Post-universitaire' },
  ],
  
  OCCUPATION_STATUS: [
    { value: 'UNEMPLOYED', label: 'Sans emploi' },
    { value: 'INFORMAL', label: 'Secteur informel' },
    { value: 'FORMAL_PRIVATE', label: 'Salarié privé' },
    { value: 'PUBLIC_SERVANT', label: 'Fonctionnaire' },
    { value: 'SELF_EMPLOYED', label: 'Entrepreneur/Indépendant' },
    { value: 'RETIRED', label: 'Retraité' },
    { value: 'STUDENT', label: 'Étudiant' },
    { value: 'HOMEMAKER', label: 'Au foyer' },
    { value: 'FARMER', label: 'Agriculteur' },
  ],
  
  MARITAL_STATUS: [
    { value: 'SINGLE', label: 'Célibataire' },
    { value: 'MARRIED', label: 'Marié(e)' },
    { value: 'DIVORCED', label: 'Divorcé(e)' },
    { value: 'WIDOWED', label: 'Veuf/Veuve' },
    { value: 'COHABITING', label: 'Concubinage' },
    { value: 'SEPARATED', label: 'Séparé(e)' },
  ],
  
  HOUSING_TYPE: [
    { value: 'OWNED_MODERN', label: 'Propriétaire - Logement moderne' },
    { value: 'OWNED_TRADITIONAL', label: 'Propriétaire - Logement traditionnel' },
    { value: 'RENTED', label: 'Locataire' },
    { value: 'SHARED', label: 'Logé gratuitement (famille/ami)' },
    { value: 'PRECARIOUS', label: 'Habitat précaire' },
  ],
  
  YES_NO: [
    { value: 'yes', label: 'Oui' },
    { value: 'no', label: 'Non' },
  ],
  
  VERIFICATION_STATUS: [
    { value: 'PENDING', label: 'En attente' },
    { value: 'VERIFIED', label: 'Vérifié' },
    { value: 'REJECTED', label: 'Rejeté' },
    { value: 'REQUIRES_REVIEW', label: 'Nécessite révision' },
  ],
};

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

// =============================================================================
// 6. CONSTANTES OFFLINE (constants/offlineConstants.js)
// =============================================================================
export const OFFLINE_CONFIG = {
  // Durée de cache (ms)
  CACHE_DURATION: {
    SHORT: 5 * 60 * 1000,      // 5 minutes
    MEDIUM: 30 * 60 * 1000,    // 30 minutes  
    LONG: 24 * 60 * 60 * 1000, // 24 heures
  },
  
  // Taille maximale queue offline
  MAX_QUEUE_SIZE: 1000,
  
  // Types de données stockables offline
  STORAGE_KEYS: {
    OFFLINE_QUEUE: 'offline_queue',
    USER_DATA: 'user_data',
    CACHED_PERSONS: 'cached_persons',
    APP_SETTINGS: 'app_settings',
    FORM_DRAFTS: 'form_drafts',
  },
  
  // Configuration synchronisation
  SYNC_CONFIG: {
    AUTO_SYNC: true,
    SYNC_INTERVAL: 30000,      // 30 secondes
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 5000,         // 5 secondes
    BATCH_SIZE: 10,            // Éléments par batch
  },
  
  // Types d'opérations offline
  OPERATION_TYPES: {
    ENROLLMENT: 'enrollment',
    SURVEY: 'survey',  
    UPDATE_PERSON: 'update_person',
    DELETE_PERSON: 'delete_person',
  },
  
  // Status des éléments en queue
  QUEUE_STATUS: {
    PENDING: 'pending',
    SYNCING: 'syncing', 
    SYNCED: 'synced',
    FAILED: 'failed',
  },
};

// =============================================================================
// 7. CONSTANTES PERMISSIONS (constants/permissionsConstants.js)
// =============================================================================
export const PERMISSIONS = {
  // Permissions système
  LOCATION: {
    PERMISSION: 'location',
    RATIONALE: 'L\'application a besoin d\'accéder à votre position pour la géolocalisation des enquêtes terrain.',
  },
  
  CAMERA: {
    PERMISSION: 'camera',
    RATIONALE: 'L\'application a besoin d\'accéder à l\'appareil photo pour capturer des documents.',
  },
  
  STORAGE: {
    PERMISSION: 'storage',
    RATIONALE: 'L\'application a besoin d\'accéder au stockage pour sauvegarder les données hors ligne.',
  },
  
  // Rôles utilisateur RSU
  USER_ROLES: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    SUPERVISOR: 'SUPERVISOR', 
    SURVEYOR: 'SURVEYOR',
    VIEWER: 'VIEWER',
  },
  
  // Permissions métier
  ACTIONS: {
    // Personnes
    VIEW_PERSONS: 'view_persons',
    CREATE_PERSON: 'create_person',
    UPDATE_PERSON: 'update_person',
    DELETE_PERSON: 'delete_person',
    
    // Ménages
    VIEW_HOUSEHOLDS: 'view_households',
    CREATE_HOUSEHOLD: 'create_household',
    UPDATE_HOUSEHOLD: 'update_household',
    DELETE_HOUSEHOLD: 'delete_household',
    
    // Évaluations
    VIEW_ASSESSMENTS: 'view_assessments',
    CREATE_ASSESSMENT: 'create_assessment',
    UPDATE_ASSESSMENT: 'update_assessment',
    
    // Enquêtes
    VIEW_SURVEYS: 'view_surveys',
    CREATE_SURVEY: 'create_survey',
    UPDATE_SURVEY: 'update_survey',
    DELETE_SURVEY: 'delete_survey',
    
    // Administration
    MANAGE_USERS: 'manage_users',
    VIEW_REPORTS: 'view_reports',
    EXPORT_DATA: 'export_data',
    MANAGE_SYSTEM: 'manage_system',
  },
};

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