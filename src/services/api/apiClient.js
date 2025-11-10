// =============================================================================
// CONFIGURATION API CLIENT - COMMUNICATION BACKEND
// Fichier: src/services/api/apiClient.js - MISE À JOUR
// =============================================================================

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ CONFIGURATION BACKEND
const BACKEND_CONFIG = {
  // Adresse backend Django
  baseURL: 'http://192.168.1.69:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// ✅ Créer instance axios
const apiClient = axios.create(BACKEND_CONFIG);

// ✅ Intercepteur Request (ajouter token)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    } catch (error) {
      console.error('Erreur intercepteur request:', error);
      return config;
    }
  },
  (error) => {
    console.error('Erreur request:', error);
    return Promise.reject(error);
  }
);

// ✅ Intercepteur Response (gestion erreurs)
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error(`❌ API Error: ${error.response?.status} ${originalRequest?.url}`);

    // Gestion token expiré
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tentative refresh token
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${BACKEND_CONFIG.baseURL}/api/v1/auth/token/refresh/`, {
            refresh: refreshToken
          });

          const newToken = response.data.access;
          await AsyncStorage.setItem('auth_token', newToken);
          
          // Retry requête originale
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Erreur refresh token:', refreshError);
        // Rediriger vers login
        await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
      }
    }

    return Promise.reject(error);
  }
);

// ✅ Fonctions utilitaires
export const apiUtils = {
  /**
   * Test connectivité backend
   */
  async testConnection() {
    try {
      const response = await apiClient.get('/api/', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.log('Backend non accessible:', error.message);
      return false;
    }
  },

  /**
   * Configuration base URL dynamique
   */
  setBaseURL(url) {
    apiClient.defaults.baseURL = url;
    console.log('📍 Base URL mise à jour:', url);
  },

  /**
   * Ajout token manuellement
   */
  async setAuthToken(token) {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await AsyncStorage.setItem('auth_token', token);
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      await AsyncStorage.removeItem('auth_token');
    }
  },

  /**
   * Obtenir configuration actuelle
   */
  getConfig() {
    return {
      baseURL: apiClient.defaults.baseURL,
      timeout: apiClient.defaults.timeout,
      headers: apiClient.defaults.headers,
    };
  }
};

export default apiClient;