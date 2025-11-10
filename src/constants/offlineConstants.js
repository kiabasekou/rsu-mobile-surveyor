
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
