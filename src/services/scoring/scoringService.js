// =============================================================================
// 4. SCORING SERVICE (services/scoring/scoringService.js)
// =============================================================================
import { GABON_PROVINCES } from '../../constants/gabonData';

class ScoringService {
  // Calcul score vulnérabilité local (algorithme simplifié pour mobile)
  calculateLocalVulnerabilityScore(personData, householdData) {
    const scores = {
      economic: this.calculateEconomicScore(personData, householdData),
      social: this.calculateSocialScore(personData),
      demographic: this.calculateDemographicScore(personData, householdData),
      geographic: this.calculateGeographicScore(personData),
      resilience: this.calculateResilienceScore(householdData),
    };

    // Pondération selon standards RSU Gabon
    const weights = {
      economic: 0.30,
      social: 0.25,
      demographic: 0.20,
      geographic: 0.15,
      resilience: 0.10,
    };

    const totalScore = Object.keys(scores).reduce((total, dimension) => {
      return total + (scores[dimension] * weights[dimension]);
    }, 0);

    const level = this.determineVulnerabilityLevel(totalScore);
    const factors = this.identifyVulnerabilityFactors(personData, householdData, scores);

    return {
      score: Math.round(totalScore * 100) / 100,
      level: level.code,
      levelLabel: level.label,
      dimensions: {
        'Économique': Math.round(scores.economic * 100) / 100,
        'Social': Math.round(scores.social * 100) / 100,
        'Démographique': Math.round(scores.demographic * 100) / 100,
        'Géographique': Math.round(scores.geographic * 100) / 100,
        'Résilience': Math.round(scores.resilience * 100) / 100,
      },
      factors,
      timestamp: new Date().toISOString(),
    };
  }

  // Score économique (0-100)
  calculateEconomicScore(personData, householdData) {
    let score = 0;

    // Statut emploi
    const occupationScores = {
      'UNEMPLOYED': 90,
      'INFORMAL': 70,
      'FORMAL_PRIVATE': 40,
      'PUBLIC_SERVANT': 20,
      'SELF_EMPLOYED': 50,
      'RETIRED': 60,
      'STUDENT': 30,
    };
    score += occupationScores[personData.occupationStatus] || 50;

    // Revenu mensuel (FCFA)
    const income = parseFloat(personData.monthlyIncome) || 0;
    if (income < 50000) score += 40;
    else if (income < 100000) score += 30;
    else if (income < 200000) score += 20;
    else if (income < 400000) score += 10;

    // Conditions logement
    if (householdData.hasElectricity === 'no') score += 15;
    if (householdData.hasRunningWater === 'no') score += 15;

    // Type logement
    const housingScores = {
      'PRECARIOUS': 25,
      'SHARED': 15,
      'RENTED': 10,
      'OWNED_TRADITIONAL': 5,
      'OWNED_MODERN': 0,
    };
    score += housingScores[householdData.housingType] || 10;

    return Math.min(score, 100);
  }

  // Score social (0-100)
  calculateSocialScore(personData) {
    let score = 0;

    // Niveau éducation
    const educationScores = {
      'NONE': 40,
      'INCOMPLETE_PRIMARY': 35,
      'PRIMARY': 25,
      'SECONDARY': 15,
      'HIGH_SCHOOL': 10,
      'TECHNICAL': 5,
      'UNIVERSITY': 0,
      'POSTGRADUATE': 0,
    };
    score += educationScores[personData.educationLevel] || 20;

    // Âge (vulnérabilité selon âge)
    const birthDate = new Date(personData.birthDate);
    const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (age < 5 || age > 65) score += 20;
    else if (age < 18 || age > 55) score += 10;

    // Genre (femmes plus vulnérables en moyenne)
    if (personData.gender === 'F') score += 10;

    return Math.min(score, 100);
  }

  // Score démographique (0-100)
  calculateDemographicScore(personData, householdData) {
    let score = 0;

    // Taille ménage
    const householdSize = parseInt(householdData.householdSize) || 1;
    if (householdSize > 8) score += 25;
    else if (householdSize > 6) score += 20;
    else if (householdSize > 4) score += 10;

    // Ratio dépendants
    const dependents = parseInt(householdData.dependents) || 0;
    const ratio = dependents / householdSize;
    if (ratio > 0.7) score += 25;
    else if (ratio > 0.5) score += 15;
    else if (ratio > 0.3) score += 5;

    // Revenu par personne
    const totalIncome = parseFloat(householdData.monthlyIncome) || 0;
    const incomePerPerson = totalIncome / householdSize;
    if (incomePerPerson < 25000) score += 30;
    else if (incomePerPerson < 50000) score += 20;
    else if (incomePerPerson < 100000) score += 10;

    return Math.min(score, 100);
  }

  // Score géographique (0-100)
  calculateGeographicScore(personData) {
    const provinceVulnerability = {
      'NYANGA': 80,        // Province la plus isolée
      'OGOOUE_IVINDO': 70,
      'OGOOUE_LOLO': 70,
      'NGOUNIE': 60,
      'HAUT_OGOOUE': 50,
      'MOYEN_OGOOUE': 40,
      'WOLEU_NTEM': 40,
      'OGOOUE_MARITIME': 30,
      'ESTUAIRE': 20,      // Province avec Libreville
    };

    return provinceVulnerability[personData.province] || 50;
  }

  // Score résilience (0-100)
  calculateResilienceScore(householdData) {
    let score = 50; // Score base

    // Épargne
    if (householdData.hasSavings === 'no') score += 25;
    else if (householdData.hasSavings === 'yes') score -= 15;

    // Sécurité alimentaire
    if (householdData.hasFoodSecurity === 'no') score += 25;
    else if (householdData.hasFoodSecurity === 'yes') score -= 15;

    return Math.min(Math.max(score, 0), 100);
  }

  // Déterminer niveau vulnérabilité
  determineVulnerabilityLevel(score) {
    if (score >= 75) return { code: 'CRITICAL', label: 'Critique' };
    if (score >= 50) return { code: 'HIGH', label: 'Élevée' };
    if (score >= 25) return { code: 'MODERATE', label: 'Modérée' };
    return { code: 'LOW', label: 'Faible' };
  }

  // Identifier facteurs spécifiques
  identifyVulnerabilityFactors(personData, householdData, scores) {
    const factors = [];

    if (scores.economic > 60) {
      factors.push('Précarité économique');
      if (personData.occupationStatus === 'UNEMPLOYED') {
        factors.push('Sans emploi');
      }
    }

    if (scores.social > 60) {
      factors.push('Vulnérabilité sociale');
      if (personData.educationLevel === 'NONE') {
        factors.push('Aucune éducation');
      }
    }

    if (scores.demographic > 60) {
      factors.push('Charge familiale élevée');
    }

    if (scores.geographic > 60) {
      factors.push('Zone géographique isolée');
    }

    if (householdData.hasElectricity === 'no') {
      factors.push('Pas d\'électricité');
    }

    if (householdData.hasRunningWater === 'no') {
      factors.push('Pas d\'eau courante');
    }

    const householdSize = parseInt(householdData.householdSize) || 1;
    if (householdSize > 6) {
      factors.push('Ménage nombreux');
    }

    return factors;
  }
}

export default new ScoringService();

