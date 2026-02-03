/**
 * =============================================================================
 * 🇬🇦 RSU GABON - USE OFFLINE HOOK
 * Standards Top 1% - Hook Personnalisé Mode Offline
 * =============================================================================
 * 
 * Hook React personnalisé pour gérer le mode offline.
 * Surveillance connexion réseau et queue de synchronisation.
 * 
 * Utilisation:
 * const { isConnected, pendingCount, sync } = useOffline();
 * 
 * Fichier: src/hooks/useOffline.js
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import syncService from '../services/sync/syncService';

export default function useOffline(options = {}) {
  const {
    autoSync = true,
    syncInterval = 30000, // 30 secondes
  } = options;

  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    // Écouter les changements de connexion
    const unsubscribe = NetInfo.addEventListener(handleConnectionChange);

    // Charger le compteur initial
    loadPendingCount();

    // Intervalle de mise à jour
    const interval = setInterval(loadPendingCount, syncInterval);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Auto-sync si connexion rétablie
    if (isConnected && isInternetReachable && autoSync && pendingCount > 0 && !syncing) {
      syncQueue();
    }
  }, [isConnected, isInternetReachable, pendingCount]);

  /**
   * Gère les changements de statut de connexion
   */
  const handleConnectionChange = (state) => {
    setIsConnected(state.isConnected);
    setIsInternetReachable(state.isInternetReachable !== false);
    setConnectionType(state.type);
  };

  /**
   * Charge le nombre d'items en attente
   */
  const loadPendingCount = async () => {
    try {
      const count = await syncService.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Erreur chargement pending count:', error);
    }
  };

  /**
   * Synchronise la queue
   */
  const syncQueue = async () => {
    if (!isConnected || !isInternetReachable) {
      return {
        success: false,
        error: 'Pas de connexion internet',
      };
    }

    try {
      setSyncing(true);

      const result = await syncService.processQueue();
      
      setLastSyncTime(new Date());
      await loadPendingCount();

      return result;
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Ajoute un item à la queue
   */
  const addToQueue = async (item) => {
    try {
      await syncService.addToQueue(item);
      await loadPendingCount();
      return { success: true };
    } catch (error) {
      console.error('Erreur ajout queue:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  /**
   * Récupère la queue complète
   */
  const getQueue = async () => {
    try {
      return await syncService.getQueue();
    } catch (error) {
      console.error('Erreur récupération queue:', error);
      return [];
    }
  };

  return {
    isConnected,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable,
    connectionType,
    pendingCount,
    syncing,
    lastSyncTime,
    syncQueue,
    addToQueue,
    getQueue,
    refreshPendingCount: loadPendingCount,
  };
}
