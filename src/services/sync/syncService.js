// =============================================================================
// CORRECTION 2 : SYNCSERVICE INITIALIZE METHOD
// Fichier: src/services/sync/syncService.js - CORRECTION COMPLÈTE
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiClient from '../api/apiClient';

class SyncService {
  constructor() {
    this.isInitialized = false;
    this.syncQueue = [];
    this.isOnline = false;
    this.autoSyncEnabled = true;
    this.syncInProgress = false;
  }

  /**
   * ✅ MÉTHODE INITIALIZE - CORRECTION CRITIQUE
   */
  async initialize() {
    try {
      console.log('🔄 Initialisation SyncService...');
      
      // 1. Charger queue persistante
      await this.loadPendingQueue();
      
      // 2. Écouter changements réseau
      this.setupNetworkListener();
      
      // 3. Vérifier état réseau initial
      const networkState = await NetInfo.fetch();
      this.isOnline = networkState.isConnected;
      
      // 4. Démarrer sync auto si en ligne
      if (this.isOnline && this.autoSyncEnabled) {
        setTimeout(() => this.syncPendingData(), 2000);
      }
      
      this.isInitialized = true;
      console.log('✅ SyncService initialisé avec succès');
      
    } catch (error) {
      console.error('❌ Erreur initialisation SyncService:', error);
    }
  }

  /**
   * Charger queue depuis storage persistant
   */
  async loadPendingQueue() {
    try {
      const savedQueue = await AsyncStorage.getItem('sync_queue');
      if (savedQueue) {
        this.syncQueue = JSON.parse(savedQueue);
        console.log(`📦 ${this.syncQueue.length} éléments chargés en queue`);
      }
    } catch (error) {
      console.error('Erreur chargement queue:', error);
    }
  }

  /**
   * Sauvegarder queue
   */
  async saveQueue() {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Erreur sauvegarde queue:', error);
    }
  }

  /**
   * Écouter changements réseau
   */
  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected;
      
      console.log(`🌐 Réseau: ${this.isOnline ? 'Connecté' : 'Déconnecté'}`);
      
      // Auto-sync quand retour en ligne
      if (!wasOnline && this.isOnline && this.autoSyncEnabled) {
        setTimeout(() => this.syncPendingData(), 1000);
      }
    });
  }

  /**
   * Ajouter élément à la queue
   */
  async addToQueue(type, data, metadata = {}) {
    try {
      const queueItem = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        metadata,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 3,
      };

      this.syncQueue.push(queueItem);
      await this.saveQueue();

      console.log(`📝 Ajouté en queue: ${type} (${queueItem.id})`);

      // Tentative sync immédiate si en ligne
      if (this.isOnline && this.autoSyncEnabled && !this.syncInProgress) {
        setTimeout(() => this.syncPendingData(), 500);
      }

      return queueItem.id;
    } catch (error) {
      console.error('Erreur ajout queue:', error);
      throw error;
    }
  }

  /**
   * Synchroniser données en attente
   */
  async syncPendingData() {
    if (this.syncInProgress) {
      console.log('⏳ Sync déjà en cours, ignoré');
      return;
    }

    if (!this.isOnline) {
      console.log('📡 Hors ligne, sync reportée');
      return;
    }

    if (this.syncQueue.length === 0) {
      console.log('✅ Queue vide, rien à synchroniser');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log(`🔄 Début sync: ${this.syncQueue.length} éléments`);

      const itemsToSync = [...this.syncQueue];
      const syncResults = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const item of itemsToSync) {
        try {
          await this.syncSingleItem(item);
          
          // Supprimer de la queue si succès
          this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
          syncResults.success++;
          
        } catch (error) {
          console.error(`❌ Erreur sync ${item.id}:`, error);
          
          // Incrémenter tentatives
          const queueItem = this.syncQueue.find(q => q.id === item.id);
          if (queueItem) {
            queueItem.attempts++;
            queueItem.lastError = error.message;
            queueItem.lastAttempt = new Date().toISOString();

            // Supprimer si trop de tentatives
            if (queueItem.attempts >= queueItem.maxAttempts) {
              this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
              console.log(`🗑️ Supprimé après ${queueItem.maxAttempts} tentatives: ${item.id}`);
            }
          }
          
          syncResults.failed++;
          syncResults.errors.push({ id: item.id, error: error.message });
        }
      }

      await this.saveQueue();

      console.log(`✅ Sync terminée: ${syncResults.success} succès, ${syncResults.failed} échecs`);
      return syncResults;

    } catch (error) {
      console.error('❌ Erreur sync globale:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Synchroniser un élément individuel
   */
  async syncSingleItem(item) {
    switch (item.type) {
      case 'enrollment':
        return await this.syncEnrollment(item);
      case 'survey':
        return await this.syncSurvey(item);
      case 'update':
        return await this.syncUpdate(item);
      default:
        throw new Error(`Type sync non supporté: ${item.type}`);
    }
  }

  /**
   * Sync inscription
   */
  async syncEnrollment(item) {
    const response = await apiClient.post('/identity/persons/', item.data);
    console.log(`✅ Inscription synchronisée: ${response.data.id}`);
    return response.data;
  }

  /**
   * Sync enquête
   */
  async syncSurvey(item) {
    const response = await apiClient.post('/surveys/responses/', item.data);
    console.log(`✅ Enquête synchronisée: ${response.data.id}`);
    return response.data;
  }

  /**
   * Sync mise à jour
   */
  async syncUpdate(item) {
    const { id, ...updateData } = item.data;
    const response = await apiClient.patch(`/identity/persons/${id}/`, updateData);
    console.log(`✅ Mise à jour synchronisée: ${id}`);
    return response.data;
  }

  /**
   * Obtenir données en attente
   */
  async getPendingData() {
    return [...this.syncQueue];
  }

  /**
   * Obtenir nombre d'éléments en attente
   */
  async getPendingCount() {
    return this.syncQueue.length;
  }

  /**
   * Supprimer élément de la queue
   */
  async removeFromQueue(itemId) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== itemId);
    await this.saveQueue();
    console.log(`🗑️ Supprimé de la queue: ${itemId}`);
  }

  /**
   * Vider toute la queue
   */
  async clearData() {
    this.syncQueue = [];
    await AsyncStorage.removeItem('sync_queue');
    console.log('🧹 Queue vidée');
  }

  /**
   * Activer/désactiver auto-sync
   */
  enableAutoSync() {
    this.autoSyncEnabled = true;
    console.log('🔄 Auto-sync activé');
  }

  disableAutoSync() {
    this.autoSyncEnabled = false;
    console.log('⏸️ Auto-sync désactivé');
  }

  /**
   * État du service
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      autoSyncEnabled: this.autoSyncEnabled,
      syncInProgress: this.syncInProgress,
    };
  }
}

// ✅ EXPORT SINGLETON AVEC INITIALIZE
const syncService = new SyncService();
export default syncService;