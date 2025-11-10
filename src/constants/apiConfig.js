
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