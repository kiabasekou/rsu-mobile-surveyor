// =============================================================================
// 🇬🇦 RSU GABON - SCORING SERVICE COMPLET
// Fichier: src/services/scoring/scoringService.js
// Calcul scoring vulnérabilité multi-dimensionnel
// =============================================================================

/**
 * Service de calcul du score de vulnérabilité
 * Algorithme basé sur 5 dimensions avec pondération
 * Conforme aux standards Banque Mondiale - ID4D Principles
 */

class ScoringService {
  constructor() {
    // Pondérations des dimensions (total = 100%)
    this.WEIGHTS = {
      economic: 0.30,      // 30% - Situation économique
      housing: 0.25,       // 25% - Conditions de logement
      health: 0.20,        // 20% - Santé
      education: 0.15,     // 15% - Éducation
      social: 0.10,        // 10% - Capital social
    };

    // Seuils de classification
    this.THRESHOLDS = {
      CRITICAL: 75,   // Score >= 75 : Vulnérabilité critique
      HIGH: 50,       // Score >= 50 : Vulnérabilité élevée
      MODERATE: 25,   // Score >= 25 : Vulnérabilité modérée
      LOW: 0,         // Score < 25 : Vulnérabilité faible
    };

    // Facteurs de risque par catégorie
    this.RISK_FACTORS = {
      economic: [
        'unemployment', 'low_income', 'no_savings',
        'multiple_dependents', 'informal_work', 'debt'
      ],
      housing: [
        'no_electricity', 'no_water', 'overcrowding',
        'precarious_housing', 'no_sanitation', 'flood_risk'
      ],
      health: [
        'chronic_illness', 'disability', 'no_health_insurance',
        'malnutrition', 'no_medical_access', 'pregnancy_risk'
      ],
      education: [
        'no_education', 'school_dropout', 'illiteracy',
        'children_out_of_school', 'no_vocational_training'
      ],
      social: [
        'social_isolation', 'single_parent', 'elderly_alone',
        'no_family_support', 'discrimination', 'displaced'
      ]
    };
  }

  /**
   * Calcul du score de vulnérabilité global
   * @param {Object} personData - Données de la personne
   * @param {Object} householdData - Données du ménage
   * @returns {Object} Score et détails complets
   */
  calculateVulnerabilityScore(personData, householdData) {
    try {
      console.log('🔍 Calcul score vulnérabilité...');

      // 1. Calculer scores par dimension
      const dimensionScores = this.calculateDimensionScores(personData, householdData);

      // 2. Calculer score global pondéré
      const globalScore = this.calculateWeightedScore(dimensionScores);

      // 3. Déterminer niveau de risque
      const riskLevel = this.determineRiskLevel(globalScore);

      // 4. Identifier facteurs de risque
      const riskFactors = this.identifyRiskFactors(personData, householdData);

      // 5. Générer recommandations
      const recommendations = this.generateRecommendations(riskLevel, riskFactors);

      const result = {
        score: Math.round(globalScore),
        level: riskLevel,
        dimensions: dimensionScores,
        factors: riskFactors,
        recommendations,
        calculatedAt: new Date().toISOString(),
      };

      console.log('✅ Score calculé:', result.score, '-', result.level);

      return result;

    } catch (error) {
      console.error('❌ Erreur calcul score:', error);
      throw new Error('Impossible de calculer le score de vulnérabilité');
    }
  }

  /**
   * Calcul des scores par dimension
   */
  calculateDimensionScores(personData, householdData) {
    return {
      economic: this.calculateEconomicScore(personData, householdData),
      housing: this.calculateHousingScore(householdData),
      health: this.calculateHealthScore(personData, householdData),
      education: this.calculateEducationScore(personData, householdData),
      social: this.calculateSocialScore(personData, householdData),
    };
  }

  /**
   * DIMENSION 1 : Score économique (0-100)
   */
  calculateEconomicScore(person, household) {
    let score = 0;

    // Revenu par personne
    const income = parseFloat(household.monthlyIncome || 0);
    const householdSize = parseInt(household.householdSize || 1);
    const incomePerPerson = income / householdSize;

    // Seuils de pauvreté Gabon (FCFA)
    const POVERTY_LINE = 150000;      // Seuil pauvreté absolue
    const VULNERABILITY_LINE = 300000; // Seuil vulnérabilité

    if (incomePerPerson === 0) {
      score += 40; // Aucun revenu
    } else if (incomePerPerson < POVERTY_LINE) {
      score += 35; // Extrême pauvreté
    } else if (incomePerPerson < VULNERABILITY_LINE) {
      score += 25; // Vulnérabilité économique
    } else {
      score += 10; // Revenu suffisant
    }

    // Statut d'emploi
    const occupation = person.occupationStatus?.toLowerCase() || '';
    if (occupation.includes('chomeur') || occupation.includes('unemployed')) {
      score += 25;
    } else if (occupation.includes('informel') || occupation.includes('informal')) {
      score += 15;
    } else if (occupation.includes('journalier') || occupation.includes('daily')) {
      score += 20;
    } else {
      score += 5;
    }

    // Dépendants
    const dependents = parseInt(household.dependents || 0);
    if (dependents >= 5) {
      score += 20;
    } else if (dependents >= 3) {
      score += 15;
    } else if (dependents >= 1) {
      score += 10;
    }

    // Épargne/actifs
    if (!household.hasSavings) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * DIMENSION 2 : Score logement (0-100)
   */
  calculateHousingScore(household) {
    let score = 0;

    // Type de logement
    const housingType = household.housingType?.toLowerCase() || '';
    if (housingType.includes('precaire') || housingType.includes('precarious')) {
      score += 30;
    } else if (housingType.includes('case') || housingType.includes('traditional')) {
      score += 20;
    } else if (housingType.includes('location') || housingType.includes('rent')) {
      score += 15;
    } else {
      score += 5;
    }

    // Accès électricité
    if (!household.hasElectricity || household.hasElectricity === 'no') {
      score += 20;
    }

    // Accès eau potable
    if (!household.hasRunningWater || household.hasRunningWater === 'no') {
      score += 20;
    }

    // Surpeuplement
    const householdSize = parseInt(household.householdSize || 1);
    const rooms = parseInt(household.numberOfRooms || 1);
    const personsPerRoom = householdSize / rooms;
    
    if (personsPerRoom >= 4) {
      score += 15;
    } else if (personsPerRoom >= 3) {
      score += 10;
    } else if (personsPerRoom >= 2) {
      score += 5;
    }

    // Assainissement
    if (!household.hasToilet) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * DIMENSION 3 : Score santé (0-100)
   */
  calculateHealthScore(person, household) {
    let score = 0;

    // Maladie chronique
    if (person.hasChronicIllness || household.hasChronicIllness) {
      score += 25;
    }

    // Handicap
    if (person.hasDisability || household.hasDisability) {
      score += 20;
    }

    // Accès aux soins
    if (!household.hasHealthInsurance) {
      score += 20;
    }

    // Malnutrition
    if (household.hasMalnutrition) {
      score += 20;
    }

    // Distance centre de santé
    const healthDistance = parseInt(household.healthCenterDistance || 0);
    if (healthDistance >= 10) {
      score += 15;
    } else if (healthDistance >= 5) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * DIMENSION 4 : Score éducation (0-100)
   */
  calculateEducationScore(person, household) {
    let score = 0;

    // Niveau d'éducation chef de ménage
    const education = person.educationLevel?.toLowerCase() || '';
    if (education.includes('aucun') || education.includes('none')) {
      score += 30;
    } else if (education.includes('primaire') || education.includes('primary')) {
      score += 20;
    } else if (education.includes('secondaire') || education.includes('secondary')) {
      score += 10;
    }

    // Analphabétisme
    if (person.isIlliterate) {
      score += 25;
    }

    // Enfants déscolarisés
    const childrenOutOfSchool = parseInt(household.childrenOutOfSchool || 0);
    if (childrenOutOfSchool >= 2) {
      score += 25;
    } else if (childrenOutOfSchool === 1) {
      score += 15;
    }

    // Frais de scolarité impayés
    if (household.hasUnpaidSchoolFees) {
      score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * DIMENSION 5 : Score social (0-100)
   */
  calculateSocialScore(person, household) {
    let score = 0;

    // Isolement social
    if (household.isSociallyIsolated) {
      score += 30;
    }

    // Parent seul
    if (household.isSingleParent) {
      score += 25;
    }

    // Personne âgée seule
    const age = this.calculateAge(person.birthDate);
    if (age >= 65 && householdSize === 1) {
      score += 25;
    }

    // Pas de soutien familial
    if (!household.hasFamilySupport) {
      score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * Calcul du score global pondéré
   */
  calculateWeightedScore(dimensionScores) {
    return (
      dimensionScores.economic * this.WEIGHTS.economic +
      dimensionScores.housing * this.WEIGHTS.housing +
      dimensionScores.health * this.WEIGHTS.health +
      dimensionScores.education * this.WEIGHTS.education +
      dimensionScores.social * this.WEIGHTS.social
    );
  }

  /**
   * Détermination du niveau de risque
   */
  determineRiskLevel(score) {
    if (score >= this.THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (score >= this.THRESHOLDS.HIGH) return 'HIGH';
    if (score >= this.THRESHOLDS.MODERATE) return 'MODERATE';
    return 'LOW';
  }

  /**
   * Identification des facteurs de risque
   */
  identifyRiskFactors(person, household) {
    const factors = [];

    // Facteurs économiques
    const income = parseFloat(household.monthlyIncome || 0);
    if (income < 150000) factors.push('extreme_poverty');
    if (person.occupationStatus?.includes('chomeur')) factors.push('unemployment');
    if ((household.dependents || 0) >= 3) factors.push('multiple_dependents');

    // Facteurs logement
    if (!household.hasElectricity) factors.push('no_electricity');
    if (!household.hasRunningWater) factors.push('no_water');
    if (household.housingType?.includes('precaire')) factors.push('precarious_housing');

    // Facteurs santé
    if (person.hasChronicIllness) factors.push('chronic_illness');
    if (person.hasDisability) factors.push('disability');
    if (!household.hasHealthInsurance) factors.push('no_health_insurance');

    // Facteurs éducation
    if (person.educationLevel?.includes('aucun')) factors.push('no_education');
    if ((household.childrenOutOfSchool || 0) > 0) factors.push('children_out_of_school');

    // Facteurs sociaux
    if (household.isSingleParent) factors.push('single_parent');
    if (household.isSociallyIsolated) factors.push('social_isolation');

    return factors;
  }

  /**
   * Génération de recommandations
   */
  generateRecommendations(riskLevel, factors) {
    const recommendations = [];

    switch (riskLevel) {
      case 'CRITICAL':
        recommendations.push('Priorité 1: Assistance immédiate requise');
        recommendations.push('Inscription urgente aux programmes sociaux');
        recommendations.push('Suivi rapproché mensuel');
        break;
      
      case 'HIGH':
        recommendations.push('Priorité 2: Intervention nécessaire');
        recommendations.push('Évaluation approfondie des besoins');
        recommendations.push('Orientation vers programmes adaptés');
        break;
      
      case 'MODERATE':
        recommendations.push('Priorité 3: Surveillance régulière');
        recommendations.push('Accès aux services de prévention');
        break;
      
      case 'LOW':
        recommendations.push('Suivi standard');
        break;
    }

    // Recommandations spécifiques par facteur
    if (factors.includes('unemployment')) {
      recommendations.push('Programme insertion professionnelle');
    }
    if (factors.includes('no_education')) {
      recommendations.push('Programme alphabétisation');
    }
    if (factors.includes('children_out_of_school')) {
      recommendations.push('Aide à la scolarisation');
    }
    if (factors.includes('chronic_illness')) {
      recommendations.push('Couverture santé prioritaire');
    }

    return recommendations;
  }

  /**
   * Calcul de l'âge à partir de la date de naissance
   */
  calculateAge(birthDate) {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Export du score pour l'API
   */
  exportForAPI(score) {
    return {
      vulnerability_score: score.score,
      risk_level: score.level,
      dimension_scores: score.dimensions,
      vulnerability_factors: score.factors,
      recommendations: score.recommendations,
      calculated_at: score.calculatedAt,
    };
  }
}

export default new ScoringService();