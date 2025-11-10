
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
