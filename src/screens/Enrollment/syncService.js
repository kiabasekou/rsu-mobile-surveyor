// =============================================================================
// 6. SYNC SERVICE (services/sync/syncService.js)
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import NetInfo from '@react-native-community/netinfo';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.syncPendingData();
      }
    });
  }

  async getPendingCount() {
    try {
      const queue = await AsyncStorage.getItem('offline_queue');
      const data = queue ? JSON.parse(queue) : [];
      return data.filter(item => item.status === 'pending').length;
    } catch (error) {
      console.error('Erreur count pending:', error);
      return 0;
    }
  }

  async getPendingData() {
    try {
      const queue = await AsyncStorage.getItem('offline_queue');
      const data = queue ? JSON.parse(queue) : [];
      return data.filter(item => item.status === 'pending');
    } catch (error) {
      console.error('Erreur get pending:', error);
      return [];
    }
  }

  async syncPendingData() {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;
      const pendingData = await this.getPendingData();
      
      if (pendingData.length === 0) {
        this.isSyncing = false;
        return { success: 0, failed: 0 };
      }

      let successCount = 0;
      let failedCount = 0;

      for (const item of pendingData) {
        try {
          await this.syncItem(item);
          await this.markAsSynced(item.id);
          successCount++;
        } catch (error) {
          console.error(`Erreur sync item ${item.id}:`, error);
          await this.markAsFailed(item.id, error.message);
          failedCount++;
        }
      }

      this.isSyncing = false;
      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('Erreur sync générale:', error);
      this.isSyncing = false;
      throw error;
    }
  }

  async syncItem(item) {
    switch (item.type) {
      case 'enrollment':
        return await this.syncEnrollment(item.data);
      case 'survey':
        return await this.syncSurvey(item.data);
      default:
        throw new Error(`Type non supporté: ${item.type}`);
    }
  }

  async syncEnrollment(data) {
    const response = await apiClient.post('/enrollment/submit/', {
      person: data.person,
      household: data.household,
      vulnerability_assessment: data.vulnerabilityScore,
      gps_data: data.gpsData,
    });
    
    return response.data;
  }

  async markAsSynced(itemId) {
    const queue = await AsyncStorage.getItem('offline_queue');
    const data = queue ? JSON.parse(queue) : [];
    
    const updatedData = data.map(item => 
      item.id === itemId 
        ? { ...item, status: 'synced', syncedAt: new Date().toISOString() }
        : item
    );
    
    await AsyncStorage.setItem('offline_queue', JSON.stringify(updatedData));
  }

  async markAsFailed(itemId, error) {
    const queue = await AsyncStorage.getItem('offline_queue');
    const data = queue ? JSON.parse(queue) : [];
    
    const updatedData = data.map(item => 
      item.id === itemId 
        ? { ...item, status: 'failed', error: error, lastAttempt: new Date().toISOString() }
        : item
    );
    
    await AsyncStorage.setItem('offline_queue', JSON.stringify(updatedData));
  }

  async clearSyncedData() {
    const queue = await AsyncStorage.getItem('offline_queue');
    const data = queue ? JSON.parse(queue) : [];
    
    const filteredData = data.filter(item => item.status !== 'synced');
    await AsyncStorage.setItem('offline_queue', JSON.stringify(filteredData));
    
    return data.length - filteredData.length; // Nombre d'éléments supprimés
  }
}

export default new SyncService();