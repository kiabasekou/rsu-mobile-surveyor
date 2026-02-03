/**
 * =============================================================================
 * 🇬🇦 RSU GABON - USE AUTH HOOK
 * Standards Top 1% - Hook Personnalisé Authentification
 * =============================================================================
 * 
 * Hook React personnalisé pour gérer l'authentification.
 * Simplifie l'utilisation d'authService dans les composants.
 * 
 * Utilisation:
 * const { user, isAuthenticated, login, logout, loading } = useAuth();
 * 
 * Fichier: src/hooks/useAuth.js
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import authService from '../services/auth/authService';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Vérifie le statut d'authentification au chargement
   */
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion utilisateur
   */
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.login(username, password);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Erreur de connexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion utilisateur
   */
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rafraîchir les données utilisateur
   */
  const refreshUser = async () => {
    await checkAuthStatus();
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    refreshUser,
  };
}
