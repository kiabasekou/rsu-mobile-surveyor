/**
 * =============================================================================
 * 🇬🇦 RSU GABON - STORAGE SERVICE
 * Standards Top 1% - Gestion AsyncStorage
 * =============================================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  /**
   * Sauvegarde un item
   */
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Erreur setItem:', error);
      return false;
    }
  }

  /**
   * Récupère un item
   */
  async getItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Erreur getItem:', error);
      return null;
    }
  }

  /**
   * Supprime un item
   */
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erreur removeItem:', error);
      return false;
    }
  }

  /**
   * Récupère toutes les clés
   */
  async getAllKeys() {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Erreur getAllKeys:', error);
      return [];
    }
  }

  /**
   * Vide tout le storage
   */
  async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Erreur clear:', error);
      return false;
    }
  }
}

export default new StorageService();