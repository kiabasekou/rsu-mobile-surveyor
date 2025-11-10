// =============================================================================
// 🇬🇦 RSU GABON - VALIDATION SERVICE COMPLET
// Fichier: src/services/validation/validationService.js
// Validation complète données terrain + règles métier Gabon
// =============================================================================

/**
 * Service de validation des données
 * Validations spécifiques au contexte gabonais
 * Conformité standards ID4D + règles métier RSU
 */

class ValidationService {
  constructor() {
    // Configuration validation NIP Gabonais
    this.NIP_CONFIG = {
      length: 10,
      pattern: /^[0-9]{10}$/,
      provinces: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
    };

    // Configuration téléphone Gabon
    this.PHONE_CONFIG = {
      countryCode: '+241',
      formats: [
        /^\+241[0-9]{8}$/,           // +241XXXXXXXX
        /^241[0-9]{8}$/,              // 241XXXXXXXX
        /^0[1-7][0-9]{6}$/,           // 0XXXXXXX
        /^[1-7][0-9]{6}$/,            // XXXXXXX
      ],
      operatorPrefixes: ['07', '06', '05', '04', '01', '02', '03'],
    };

    // Limites géographiques Gabon
    this.GABON_BOUNDS = {
      latitude: { min: -4.0, max: 2.3 },
      longitude: { min: 8.5, max: 14.8 },
    };

    // Provinces officielles
    this.PROVINCES = [
      'ESTUAIRE', 'HAUT-OGOOUE', 'MOYEN-OGOOUE',
      'NGOUNIE', 'NYANGA', 'OGOOUE-IVINDO',
      'OGOOUE-LOLO', 'OGOOUE-MARITIME', 'WOLEU-NTEM'
    ];

    // Niveaux d'éducation
    this.EDUCATION_LEVELS = [
      'AUCUN', 'PRIMAIRE', 'SECONDAIRE', 
      'TECHNIQUE', 'UNIVERSITAIRE', 'POSTGRADUATE'
    ];

    // Statuts d'occupation
    this.OCCUPATION_STATUSES = [
      'EMPLOYE', 'CHOMEUR', 'INDEPENDANT',
      'ETUDIANT', 'RETRAITE', 'INACTIF'
    ];
  }

  /**
   * ==========================================================================
   * VALIDATIONS IDENTITÉ PERSONNE
   * ==========================================================================
   */

  /**
   * Validation NIP (Numéro d'Identification Personnel) Gabonais
   * Format : 10 chiffres avec préfixe province
   */
  validateNIP(nip) {
    // Vérifier présence
    if (!nip) {
      return {
        valid: false,
        error: 'NIP requis'
      };
    }

    // Nettoyer espaces
    nip = nip.replace(/\s/g, '');

    // Vérifier longueur
    if (nip.length !== this.NIP_CONFIG.length) {
      return {
        valid: false,
        error: `NIP doit contenir exactement ${this.NIP_CONFIG.length} chiffres`
      };
    }

    // Vérifier format numérique
    if (!this.NIP_CONFIG.pattern.test(nip)) {
      return {
        valid: false,
        error: 'NIP doit contenir uniquement des chiffres'
      };
    }

    // Vérifier préfixe province
    const provinceCode = nip.substring(0, 2);
    if (!this.NIP_CONFIG.provinces.includes(provinceCode)) {
      return {
        valid: false,
        error: `Code province invalide: ${provinceCode}`
      };
    }

    // Validation checksum (algorithme Luhn si implémenté)
    // TODO: Implémenter checksum si requis par RBPP

    return {
      valid: true,
      nip: nip,
      provinceCode: provinceCode
    };
  }

  /**
   * Validation téléphone gabonais
   * Formats acceptés: +241XXXXXXXX, 0XXXXXXX, XXXXXXX
   */
  validatePhone(phone) {
    if (!phone) {
      return {
        valid: false,
        error: 'Numéro de téléphone requis'
      };
    }

    // Nettoyer
    phone = phone.replace(/[\s\-\(\)]/g, '');

    // Tester tous les formats acceptés
    const isValidFormat = this.PHONE_CONFIG.formats.some(format => 
      format.test(phone)
    );

    if (!isValidFormat) {
      return {
        valid: false,
        error: 'Format téléphone invalide. Utilisez +241XXXXXXXX ou 0XXXXXXX'
      };
    }

    // Normaliser au format international
    let normalized = phone;
    if (phone.startsWith('0')) {
      normalized = '+241' + phone.substring(1);
    } else if (phone.startsWith('241')) {
      normalized = '+' + phone;
    } else if (!phone.startsWith('+241') && phone.length === 7) {
      normalized = '+241' + phone;
    }

    return {
      valid: true,
      phone: normalized,
      display: phone
    };
  }

  /**
   * Validation email
   */
  validateEmail(email) {
    if (!email) {
      return {
        valid: true, // Email optionnel
        email: null
      };
    }

    const emailPattern = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailPattern.test(email)) {
      return {
        valid: false,
        error: 'Format email invalide'
      };
    }

    return {
      valid: true,
      email: email.toLowerCase()
    };
  }

  /**
   * Validation date de naissance
   */
  validateBirthDate(birthDate) {
    if (!birthDate) {
      return {
        valid: false,
        error: 'Date de naissance requise'
      };
    }

    const date = new Date(birthDate);
    const today = new Date();
    
    // Vérifier date valide
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        error: 'Date invalide'
      };
    }

    // Vérifier pas dans le futur
    if (date > today) {
      return {
        valid: false,
        error: 'Date de naissance ne peut être dans le futur'
      };
    }

    // Calculer âge
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    // Vérifier âge minimum/maximum
    if (age < 0) {
      return {
        valid: false,
        error: 'Âge invalide'
      };
    }

    if (age > 120) {
      return {
        valid: false,
        error: 'Âge semble incorrect (>120 ans)'
      };
    }

    return {
      valid: true,
      birthDate: date.toISOString().split('T')[0],
      age: age
    };
  }

  /**
   * Validation province
   */
  validateProvince(province) {
    if (!province) {
      return {
        valid: false,
        error: 'Province requise'
      };
    }

    const normalized = province.toUpperCase().trim();
    
    if (!this.PROVINCES.includes(normalized)) {
      return {
        valid: false,
        error: `Province invalide. Choisir parmi: ${this.PROVINCES.join(', ')}`
      };
    }

    return {
      valid: true,
      province: normalized
    };
  }

  /**
   * ==========================================================================
   * VALIDATIONS DONNÉES MÉNAGE
   * ==========================================================================
   */

  /**
   * Validation données complètes ménage
   */
  validateHouseholdData(householdData) {
    const errors = {};
    let isValid = true;

    // Taille ménage
    const size = parseInt(householdData.householdSize);
    if (!size || size < 1) {
      errors.householdSize = 'Taille ménage doit être >= 1';
      isValid = false;
    }
    if (size > 50) {
      errors.householdSize = 'Taille ménage semble trop élevée';
      isValid = false;
    }

    // Dépendants
    const dependents = parseInt(householdData.dependents || 0);
    if (dependents > size) {
      errors.dependents = 'Nombre dépendants ne peut dépasser taille ménage';
      isValid = false;
    }

    // Revenu mensuel
    const income = parseFloat(householdData.monthlyIncome || 0);
    if (income < 0) {
      errors.monthlyIncome = 'Revenu ne peut être négatif';
      isValid = false;
    }
    if (income > 50000000) { // 50M FCFA semble excessif
      errors.monthlyIncome = 'Revenu semble trop élevé';
      isValid = false;
    }

    // Type de logement
    if (!householdData.housingType) {
      errors.housingType = 'Type de logement requis';
      isValid = false;
    }

    return {
      valid: isValid,
      errors: isValid ? null : errors,
      data: householdData
    };
  }

  /**
   * Validation revenu (cohérence)
   */
  validateIncome(income, householdSize, occupationStatus) {
    income = parseFloat(income || 0);

    // Revenu négatif
    if (income < 0) {
      return {
        valid: false,
        error: 'Revenu ne peut être négatif'
      };
    }

    // Cohérence emploi/revenu
    if (occupationStatus?.toLowerCase().includes('chomeur') && income > 0) {
      return {
        valid: true,
        warning: 'Personne au chômage déclarant un revenu'
      };
    }

    // Seuil de pauvreté par personne
    const incomePerPerson = income / (householdSize || 1);
    const POVERTY_LINE = 150000; // FCFA

    if (incomePerPerson < POVERTY_LINE) {
      return {
        valid: true,
        warning: 'Revenu sous seuil de pauvreté',
        poverty: true
      };
    }

    return {
      valid: true,
      income: income
    };
  }

  /**
   * ==========================================================================
   * VALIDATIONS GPS & GÉOLOCALISATION
   * ==========================================================================
   */

  /**
   * Validation coordonnées GPS Gabon
   */
  validateGPSCoordinates(latitude, longitude, accuracy) {
    const errors = [];

    // Vérifier présence
    if (!latitude || !longitude) {
      return {
        valid: false,
        error: 'Coordonnées GPS requises'
      };
    }

    // Convertir en nombres
    lat = parseFloat(latitude);
    lng = parseFloat(longitude);
    acc = parseFloat(accuracy || 999);

    // Vérifier limites Gabon
    if (lat < this.GABON_BOUNDS.latitude.min || lat > this.GABON_BOUNDS.latitude.max) {
      errors.push(`Latitude hors limites Gabon (${this.GABON_BOUNDS.latitude.min} à ${this.GABON_BOUNDS.latitude.max})`);
    }

    if (lng < this.GABON_BOUNDS.longitude.min || lng > this.GABON_BOUNDS.longitude.max) {
      errors.push(`Longitude hors limites Gabon (${this.GABON_BOUNDS.longitude.min} à ${this.GABON_BOUNDS.longitude.max})`);
    }

    // Vérifier précision
    if (acc > 50) {
      errors.push('Précision GPS faible (>50m). Recommencer capture.');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : null,
      coordinates: {
        latitude: lat,
        longitude: lng,
        accuracy: acc
      }
    };
  }

  /**
   * ==========================================================================
   * VALIDATIONS ENQUÊTES (SURVEYS)
   * ==========================================================================
   */

  /**
   * Validation réponse selon type de question
   */
  validateSurveyResponse(question, value) {
    if (!question) {
      return { valid: false, error: 'Question invalide' };
    }

    // Question obligatoire sans réponse
    if (question.is_required && !value) {
      return {
        valid: false,
        error: 'Cette question est obligatoire'
      };
    }

    // Question optionnelle sans réponse
    if (!value) {
      return { valid: true };
    }

    // Validation selon type
    switch (question.question_type) {
      case 'TEXT':
      case 'TEXTAREA':
        return this.validateTextResponse(value, question.validation_rules);
      
      case 'NUMBER':
        return this.validateNumberResponse(value, question.validation_rules);
      
      case 'DECIMAL':
        return this.validateDecimalResponse(value, question.validation_rules);
      
      case 'PHONE':
        return this.validatePhone(value);
      
      case 'EMAIL':
        return this.validateEmail(value);
      
      case 'DATE':
        return this.validateDateResponse(value);
      
      case 'RADIO':
      case 'SELECT':
        return this.validateChoiceResponse(value, question.options);
      
      case 'CHECKBOX':
        return this.validateMultiChoiceResponse(value, question.options);
      
      case 'YES_NO':
        return this.validateYesNoResponse(value);
      
      case 'RATING':
        return this.validateRatingResponse(value, question.validation_rules);
      
      case 'LOCATION':
        return this.validateGPSCoordinates(value.latitude, value.longitude, value.accuracy);
      
      default:
        return { valid: true }; // Pas de validation spéciale
    }
  }

  /**
   * Validation réponse texte
   */
  validateTextResponse(value, rules = {}) {
    if (rules.max_length && value.length > rules.max_length) {
      return {
        valid: false,
        error: `Maximum ${rules.max_length} caractères`
      };
    }

    if (rules.min_length && value.length < rules.min_length) {
      return {
        valid: false,
        error: `Minimum ${rules.min_length} caractères`
      };
    }

    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      return {
        valid: false,
        error: 'Format invalide'
      };
    }

    return { valid: true, value };
  }

  /**
   * Validation réponse numérique
   */
  validateNumberResponse(value, rules = {}) {
    const num = parseInt(value);

    if (isNaN(num)) {
      return {
        valid: false,
        error: 'Nombre entier requis'
      };
    }

    if (rules.min_value !== undefined && num < rules.min_value) {
      return {
        valid: false,
        error: `Minimum: ${rules.min_value}`
      };
    }

    if (rules.max_value !== undefined && num > rules.max_value) {
      return {
        valid: false,
        error: `Maximum: ${rules.max_value}`
      };
    }

    return { valid: true, value: num };
  }

  /**
   * Validation réponse décimale
   */
  validateDecimalResponse(value, rules = {}) {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return {
        valid: false,
        error: 'Nombre décimal requis'
      };
    }

    if (rules.min_value !== undefined && num < rules.min_value) {
      return {
        valid: false,
        error: `Minimum: ${rules.min_value}`
      };
    }

    if (rules.max_value !== undefined && num > rules.max_value) {
      return {
        valid: false,
        error: `Maximum: ${rules.max_value}`
      };
    }

    return { valid: true, value: num };
  }

  /**
   * Validation choix unique
   */
  validateChoiceResponse(value, options = []) {
    if (!options.includes(value)) {
      return {
        valid: false,
        error: `Choix invalide. Options: ${options.join(', ')}`
      };
    }

    return { valid: true, value };
  }

  /**
   * Validation choix multiples
   */
  validateMultiChoiceResponse(values, options = []) {
    if (!Array.isArray(values)) {
      values = [values];
    }

    const invalid = values.filter(v => !options.includes(v));
    
    if (invalid.length > 0) {
      return {
        valid: false,
        error: `Choix invalides: ${invalid.join(', ')}`
      };
    }

    return { valid: true, value: values };
  }

  /**
   * Validation Oui/Non
   */
  validateYesNoResponse(value) {
    const normalized = String(value).toLowerCase();
    
    if (!['yes', 'no', 'oui', 'non', 'true', 'false', '1', '0'].includes(normalized)) {
      return {
        valid: false,
        error: 'Réponse Oui/Non requise'
      };
    }

    return { valid: true, value: normalized };
  }

  /**
   * Validation note (rating)
   */
  validateRatingResponse(value, rules = {}) {
    const num = parseInt(value);
    const min = rules.min_value || 1;
    const max = rules.max_value || 5;

    if (isNaN(num) || num < min || num > max) {
      return {
        valid: false,
        error: `Note entre ${min} et ${max} requise`
      };
    }

    return { valid: true, value: num };
  }

  /**
   * Validation date
   */
  validateDateResponse(value) {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        error: 'Date invalide'
      };
    }

    return {
      valid: true,
      value: date.toISOString().split('T')[0]
    };
  }

  /**
   * ==========================================================================
   * VALIDATIONS CROISÉES (CROSS-FIELD)
   * ==========================================================================
   */

  /**
   * Validation croisée des données formulaire
   */
  crossFieldValidation(formData) {
    const warnings = [];
    const errors = [];

    // Cohérence âge/scolarité
    if (formData.age && formData.educationLevel) {
      if (formData.age < 18 && formData.educationLevel === 'UNIVERSITAIRE') {
        warnings.push('Âge et niveau éducation semblent incohérents');
      }
    }

    // Cohérence emploi/revenu
    if (formData.occupationStatus === 'CHOMEUR' && formData.monthlyIncome > 0) {
      warnings.push('Personne au chômage avec revenu déclaré');
    }

    // Cohérence ménage
    if (formData.householdSize && formData.dependents) {
      if (formData.dependents > formData.householdSize) {
        errors.push('Nombre dépendants > taille ménage');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }
}

export default new ValidationService();