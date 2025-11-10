
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