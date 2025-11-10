// =============================================================================
// 5. ENROLLMENT SERVICE (services/enrollment/enrollmentService.js)
// =============================================================================
import apiClient from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import NetInfo from '@react-native-community/netinfo';

class EnrollmentService {
  async submitEnrollment(enrollmentData) {
    try {
      const networkState = await NetInfo.fetch();
      
      if (networkState.isConnected) {
        // Soumission en ligne
        return await this.submitOnline(enrollmentData);
      } else {
        // Sauvegarde hors ligne
        return await this.saveOffline(enrollmentData);
      }
    } catch (error) {
      console.error('Erreur soumission inscription:', error);
      // Fallback vers sauvegarde offline
      return await this.saveOffline(enrollmentData);
    }
  }

  async submitOnline(data) {
    try {
      // Préparer données pour l'API backend
      const payload = {
        person: {
          first_name: data.person.firstName,
          last_name: data.person.lastName,
          nip: data.person.nip,
          birth_date: data.person.birthDate.toISOString().split('T')[0],
          gender: data.person.gender,
          phone: data.person.phone,
          email: data.person.email || '',
          province: data.person.province,
          district: data.person.district || '',
          village: data.person.village || '',
          education_level: data.person.educationLevel,
          occupation_status: data.person.occupationStatus,
          monthly_income: parseFloat(data.person.monthlyIncome) || 0,
          latitude: data.gpsData?.latitude,
          longitude: data.gpsData?.longitude,
          gps_accuracy: data.gpsData?.accuracy,
        },
        household: {
          household_size: parseInt(data.household.householdSize) || 1,
          dependents: parseInt(data.household.dependents) || 0,
          total_monthly_income: parseFloat(data.household.monthlyIncome) || 0,
          has_electricity: data.household.hasElectricity === 'yes',
          has_running_water: data.household.hasRunningWater === 'yes',
          housing_type: data.household.housingType,
          province: data.person.province,
        },
        vulnerability_assessment: {
          vulnerability_score: data.vulnerabilityScore?.score,
          risk_level: data.vulnerabilityScore?.level,
          vulnerability_factors: data.vulnerabilityScore?.factors || [],
        }
      };

      // Appeler l'API d'inscription
      const response = await apiClient.post('/enrollment/submit/', payload);
      
      return {
        success: true,
        rsuId: response.data.rsu_id,
        message: 'Inscription soumise avec succès',
        data: response.data,
      };
    } catch (error) {
      console.error('Erreur soumission online:', error);
      throw new Error(error.response?.data?.message || 'Erreur serveur');
    }
  }

  async saveOffline(data) {
    try {
      const offlineId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const offlineEntry = {
        id: offlineId,
        type: 'enrollment',
        data: data,
        timestamp: timestamp,
        status: 'pending',
      };

      // Récupérer queue existante
      const existingQueue = await AsyncStorage.getItem('offline_queue');
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      
      // Ajouter nouvelle entrée
      queue.push(offlineEntry);
      
      // Sauvegarder
      await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));

      return {
        success: true,
        rsuId: `OFFLINE-${offlineId.substring(0, 8)}`,
        message: 'Inscription sauvegardée hors ligne',
        offline: true,
      };
    } catch (error) {
      console.error('Erreur sauvegarde offline:', error);
      throw new Error('Impossible de sauvegarder hors ligne');
    }
  }

  // Rechercher doublons potentiels
  async searchDuplicates(personData) {
    try {
      const response = await apiClient.post('/identity/persons/search_duplicates/', {
        first_name: personData.firstName,
        last_name: personData.lastName,
        nip: personData.nip,
        phone: personData.phone,
      });

      return response.data.duplicates || [];
    } catch (error) {
      console.error('Erreur recherche doublons:', error);
      return [];
    }
  }

  // Valider NIP via RBPP
  async validateNIP(nip) {
    try {
      const response = await apiClient.post('/identity/validate-nip/', { nip });
      return response.data;
    } catch (error) {
      console.error('Erreur validation NIP:', error);
      return { valid: false, error: 'Impossible de valider le NIP' };
    }
  }
}

export default new EnrollmentService();

