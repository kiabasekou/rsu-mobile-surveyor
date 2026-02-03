/**
 * =============================================================================
 * 🇬🇦 RSU GABON - SCORING SERVICE
 * Standards Top 1% - Calcul Scores de Vulnérabilité
 * =============================================================================
 * 
 * Service de calcul des scores de vulnérabilité avec intégration API Django.
 * Utilise l'algorithme de pondération configurable du backend.
 * 
 * Endpoints Backend Utilisés:
 * - POST /api/v1/services/vulnerability-assessments/calculate/
 * - GET /api/v1/services/vulnerability-assessments/weighting-profile/
 * - POST /api/v1/services/vulnerability-assessments/bulk_calculate/
 * 
 * Fichier: src/services/scoring/scoringService.js
 * =============================================================================
 */

import apiClient from '../api/apiClient';
import storageService from '../storage/storageService';
import { Alert } from 'react-native';

class ScoringService {
  /**
   * Profil de pondération par défaut (fallback offline)
   * Synchronisé avec backend Django
   */
  DEFAULT_WEIGHTING_PROFILE = {
    household_composition_weight: 30.0,
    economic_vulnerability_weight: 35.0,
    social_vulnerability_weight: 20.0,
    health_vulnerability_weight: 15.0,
  };

  /**
   * Seuils de classification des risques
   * Synchronisé avec backend Django
   */
  RISK_THRESHOLDS = {
    CRITICAL: 80.0,
    HIGH: 60.0,
    MODERATE: 40.0,
    LOW: 0.0,
  };

  constructor() {
    this.cachedWeightingProfile = null;
  }

  /**
   * ==========================================================================
   * CALCUL DE VULNÉRABILITÉ (API)
   * ==========================================================================
   */

  /**
   * Calcule le score de vulnérabilité pour une personne (via API)
   * 
   * @param {string} personId - UUID de la personne
   * @param {boolean} forceRecalculate - Forcer le recalcul même si existant
   * @returns {Promise<Object>} - Résultat complet de l'évaluation
   */
  async calculateVulnerabilityScore(personId, forceRecalculate = false) {
    try {
      const response = await apiClient.post(
        '/services/vulnerability-assessments/calculate/',
        {
          person_id: personId,
          force_recalculate: forceRecalculate,
        }
      );

      if (response.data) {
        // Sauvegarder en cache local
        await this._cacheAssessment(personId, response.data);
        
        return {
          success: true,
          assessment: response.data,
        };
      }

      return {
        success: false,
        error: 'Réponse API invalide',
      };
    } catch (error) {
      console.error('Erreur calcul vulnérabilité:', error);
      
      // Fallback: vérifier cache local
      const cached = await this._getCachedAssessment(personId);
      if (cached) {
        return {
          success: true,
          assessment: cached,
          fromCache: true,
        };
      }

      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Calcul en lot (bulk) pour plusieurs personnes
   * 
   * @param {Array<string>} personIds - Liste des UUIDs
   * @returns {Promise<Object>} - Résultats bulk
   */
  async bulkCalculateScores(personIds) {
    try {
      const response = await apiClient.post(
        '/services/vulnerability-assessments/bulk_calculate/',
        {
          person_ids: personIds,
          force_recalculate: false,
        }
      );

      return {
        success: true,
        results: response.data,
      };
    } catch (error) {
      console.error('Erreur calcul bulk:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * ==========================================================================
   * CALCUL LOCAL (OFFLINE MODE)
   * ==========================================================================
   */

  /**
   * Calcule le score localement (mode offline)
   * Utilise les mêmes règles que le backend Django
   * 
   * @param {Object} personData - Données de la personne
   * @param {Object} householdData - Données du ménage
   * @returns {Object} - Score calculé localement
   */
  async calculateScoreLocally(personData, householdData) {
    try {
      // Récupérer le profil de pondération
      const weights = await this.getWeightingProfile();

      // Calcul des composantes
      const householdScore = this._calculateHouseholdCompositionScore(householdData);
      const economicScore = this._calculateEconomicVulnerabilityScore(personData, householdData);
      const socialScore = this._calculateSocialVulnerabilityScore(personData);
      const healthScore = this._calculateHealthVulnerabilityScore(personData, householdData);

      // Score final pondéré
      const totalScore = (
        householdScore * (weights.household_composition_weight / 100) +
        economicScore * (weights.economic_vulnerability_weight / 100) +
        socialScore * (weights.social_vulnerability_weight / 100) +
        healthScore * (weights.health_vulnerability_weight / 100)
      );

      // Déterminer le niveau de risque
      const riskLevel = this._determineRiskLevel(totalScore);

      // Générer recommandations
      const recommendations = this._generateRecommendations(
        totalScore,
        householdScore,
        economicScore,
        socialScore,
        healthScore
      );

      return {
        vulnerability_score: parseFloat(totalScore.toFixed(2)),
        risk_level: riskLevel,
        household_composition_score: parseFloat(householdScore.toFixed(2)),
        economic_vulnerability_score: parseFloat(economicScore.toFixed(2)),
        social_vulnerability_score: parseFloat(socialScore.toFixed(2)),
        health_vulnerability_score: parseFloat(healthScore.toFixed(2)),
        recommendations: recommendations,
        calculated_offline: true,
      };
    } catch (error) {
      console.error('Erreur calcul local:', error);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * CALCUL DES COMPOSANTES (ALGORITHMES)
   * ==========================================================================
   */

  /**
   * Score de composition du ménage (0-100)
   */
  _calculateHouseholdCompositionScore(householdData) {
    let score = 0;
    const maxScore = 100;

    if (!householdData) return 0;

    // Taille du ménage (max 30 points)
    const householdSize = householdData.household_size || 0;
    if (householdSize >= 10) {
      score += 30;
    } else if (householdSize >= 7) {
      score += 25;
    } else if (householdSize >= 5) {
      score += 20;
    } else if (householdSize >= 3) {
      score += 10;
    }

    // Membres vulnérables (max 40 points)
    if (householdData.has_disabled_members) score += 15;
    if (householdData.has_elderly_members) score += 10;
    if (householdData.has_children_under_5) score += 10;
    if (householdData.has_pregnant_women) score += 5;

    // Ratio de dépendance (max 30 points)
    const dependencyRatio = householdData.dependency_ratio || 0;
    if (dependencyRatio >= 2.0) {
      score += 30;
    } else if (dependencyRatio >= 1.5) {
      score += 20;
    } else if (dependencyRatio >= 1.0) {
      score += 10;
    }

    return Math.min(score, maxScore);
  }

  /**
   * Score de vulnérabilité économique (0-100)
   */
  _calculateEconomicVulnerabilityScore(personData, householdData) {
    let score = 0;
    const maxScore = 100;

    // Situation d'emploi (max 40 points)
    const employmentStatus = personData.employment_status?.toUpperCase();
    if (employmentStatus === 'UNEMPLOYED') {
      score += 40;
    } else if (employmentStatus === 'INFORMAL') {
      score += 30;
    } else if (employmentStatus === 'TEMPORARY') {
      score += 20;
    }

    // Revenu par personne (max 40 points)
    const income = householdData?.total_monthly_income || 0;
    const householdSize = householdData?.household_size || 1;
    const incomePerPerson = income / householdSize;

    if (incomePerPerson < 50000) {
      score += 40; // Pauvreté extrême
    } else if (incomePerPerson < 100000) {
      score += 30; // Pauvreté
    } else if (incomePerPerson < 150000) {
      score += 20; // Vulnérable
    } else if (incomePerPerson < 200000) {
      score += 10; // Limite
    }

    // Conditions de logement (max 20 points)
    const housingType = householdData?.housing_type;
    if (housingType === 'PRECARIOUS' || housingType === 'HOMELESS') {
      score += 20;
    } else if (housingType === 'SHARED') {
      score += 10;
    }

    return Math.min(score, maxScore);
  }

  /**
   * Score de vulnérabilité sociale (0-100)
   */
  _calculateSocialVulnerabilityScore(personData) {
    let score = 0;
    const maxScore = 100;

    // Niveau d'éducation (max 30 points)
    const educationLevel = personData.education_level?.toUpperCase();
    if (educationLevel === 'NONE') {
      score += 30;
    } else if (educationLevel === 'PRIMARY') {
      score += 20;
    } else if (educationLevel === 'SECONDARY') {
      score += 10;
    }

    // Genre et contexte (max 20 points)
    if (personData.gender === 'F') {
      score += 10; // Femmes souvent plus vulnérables
      if (personData.marital_status === 'WIDOWED' || 
          personData.marital_status === 'DIVORCED') {
        score += 10;
      }
    }

    // Statut civil (max 20 points)
    if (personData.marital_status === 'WIDOWED') {
      score += 15;
    } else if (personData.marital_status === 'DIVORCED' || 
               personData.marital_status === 'SEPARATED') {
      score += 10;
    }

    // Handicap (max 30 points)
    if (personData.disability_status === 'YES') {
      score += 30;
    } else if (personData.disability_status === 'PARTIAL') {
      score += 15;
    }

    return Math.min(score, maxScore);
  }

  /**
   * Score de vulnérabilité santé (0-100)
   */
  _calculateHealthVulnerabilityScore(personData, householdData) {
    let score = 0;
    const maxScore = 100;

    // Handicap personnel (max 40 points)
    if (personData.disability_status === 'YES') {
      score += 40;
    } else if (personData.disability_status === 'PARTIAL') {
      score += 20;
    }

    // Âge (max 30 points)
    const age = personData.age || 0;
    if (age >= 70) {
      score += 30;
    } else if (age >= 60) {
      score += 20;
    } else if (age <= 5) {
      score += 25;
    }

    // Membres handicapés dans ménage (max 30 points)
    if (householdData?.has_disabled_members) {
      score += 30;
    }

    return Math.min(score, maxScore);
  }

  /**
   * ==========================================================================
   * DÉTERMINATION NIVEAU DE RISQUE
   * ==========================================================================
   */

  /**
   * Détermine le niveau de risque selon le score
   */
  _determineRiskLevel(score) {
    if (score >= this.RISK_THRESHOLDS.CRITICAL) {
      return 'CRITICAL';
    } else if (score >= this.RISK_THRESHOLDS.HIGH) {
      return 'HIGH';
    } else if (score >= this.RISK_THRESHOLDS.MODERATE) {
      return 'MODERATE';
    } else {
      return 'LOW';
    }
  }

  /**
   * Génère des recommandations selon les scores
   */
  _generateRecommendations(totalScore, householdScore, economicScore, socialScore, healthScore) {
    const recommendations = [];

    // Recommandations économiques
    if (economicScore >= 60) {
      recommendations.push('CASH_TRANSFER_PROGRAM');
      recommendations.push('VOCATIONAL_TRAINING');
    }

    // Recommandations santé
    if (healthScore >= 50) {
      recommendations.push('HEALTH_INSURANCE');
      recommendations.push('DISABILITY_SUPPORT');
    }

    // Recommandations éducation
    if (socialScore >= 50) {
      recommendations.push('EDUCATION_SUPPORT');
      recommendations.push('LITERACY_PROGRAM');
    }

    // Recommandations ménage
    if (householdScore >= 60) {
      recommendations.push('HOUSING_ASSISTANCE');
      recommendations.push('CHILDCARE_SUPPORT');
    }

    // Intervention urgente si critique
    if (totalScore >= this.RISK_THRESHOLDS.CRITICAL) {
      recommendations.push('PRIORITY_PROGRAM_ENROLLMENT');
      recommendations.push('INTENSIVE_CASE_MANAGEMENT');
    }

    return recommendations;
  }

  /**
   * ==========================================================================
   * PROFIL DE PONDÉRATION
   * ==========================================================================
   */

  /**
   * Récupère le profil de pondération (API ou cache)
   */
  async getWeightingProfile() {
    try {
      // Vérifier cache
      if (this.cachedWeightingProfile) {
        return this.cachedWeightingProfile;
      }

      // Récupérer depuis API
      const response = await apiClient.get(
        '/services/vulnerability-assessments/weighting-profile/'
      );

      if (response.data) {
        this.cachedWeightingProfile = response.data;
        return response.data;
      }

      // Fallback: profil par défaut
      return this.DEFAULT_WEIGHTING_PROFILE;
    } catch (error) {
      console.warn('Utilisation profil pondération par défaut:', error.message);
      return this.DEFAULT_WEIGHTING_PROFILE;
    }
  }

  /**
   * ==========================================================================
   * CACHE LOCAL
   * ==========================================================================
   */

  /**
   * Sauvegarde une évaluation en cache
   */
  async _cacheAssessment(personId, assessment) {
    try {
      const key = `assessment_${personId}`;
      await storageService.setItem(key, JSON.stringify(assessment));
    } catch (error) {
      console.error('Erreur sauvegarde cache assessment:', error);
    }
  }

  /**
   * Récupère une évaluation depuis le cache
   */
  async _getCachedAssessment(personId) {
    try {
      const key = `assessment_${personId}`;
      const cached = await storageService.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Erreur lecture cache assessment:', error);
      return null;
    }
  }

  /**
   * ==========================================================================
   * HELPERS
   * ==========================================================================
   */

  /**
   * Retourne la couleur associée au niveau de risque
   */
  getRiskLevelColor(riskLevel) {
    const colors = {
      CRITICAL: '#D32F2F', // Rouge foncé
      HIGH: '#F57C00',     // Orange
      MODERATE: '#FBC02D', // Jaune
      LOW: '#388E3C',      // Vert
    };
    return colors[riskLevel] || '#9E9E9E';
  }

  /**
   * Retourne le libellé du niveau de risque
   */
  getRiskLevelLabel(riskLevel) {
    const labels = {
      CRITICAL: 'Critique',
      HIGH: 'Élevé',
      MODERATE: 'Modéré',
      LOW: 'Faible',
    };
    return labels[riskLevel] || 'Inconnu';
  }

  /**
   * Retourne l'icône du niveau de risque
   */
  getRiskLevelIcon(riskLevel) {
    const icons = {
      CRITICAL: 'alert-circle',
      HIGH: 'alert',
      MODERATE: 'alert-triangle',
      LOW: 'check-circle',
    };
    return icons[riskLevel] || 'help-circle';
  }
}

export default new ScoringService();
