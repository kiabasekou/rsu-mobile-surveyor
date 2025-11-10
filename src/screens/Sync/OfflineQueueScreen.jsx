
// =============================================================================
// 3. OfflineQueueScreen.jsx - NOUVEAU FICHIER
// =============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Chip,
  List,
  Divider,
  ProgressBar,
  Text,
  IconButton,
} from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import syncService from '../../services/sync/syncService';

export default function OfflineQueueScreen({ navigation }) {
  const [queueData, setQueueData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQueueData();
    checkNetworkStatus();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return unsubscribe;
  }, []);

  const loadQueueData = async () => {
    try {
      const data = await syncService.getPendingData();
      setQueueData(data);
    } catch (error) {
      console.error('Erreur chargement queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNetworkStatus = async () => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQueueData();
    setRefreshing(false);
  };

  const handleSyncAll = async () => {
    if (!isConnected) {
      Alert.alert('Hors ligne', 'Connexion internet requise pour synchroniser');
      return;
    }

    try {
      setSyncing(true);
      await syncService.syncPendingData();
      await loadQueueData();
      
      Alert.alert('Succès', 'Synchronisation terminée avec succès');
    } catch (error) {
      console.error('Erreur sync:', error);
      Alert.alert('Erreur', 'Échec de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncItem = async (item) => {
    if (!isConnected) {
      Alert.alert('Hors ligne', 'Connexion internet requise');
      return;
    }

    try {
      await syncService.syncSingleItem(item.id);
      await loadQueueData();
    } catch (error) {
      console.error('Erreur sync item:', error);
      Alert.alert('Erreur', 'Échec de la synchronisation');
    }
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      'Confirmer suppression',
      'Êtes-vous sûr de vouloir supprimer cet élément de la queue ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await syncService.removeFromQueue(item.id);
              await loadQueueData();
            } catch (error) {
              console.error('Erreur suppression:', error);
            }
          }
        }
      ]
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'enrollment': return 'person-add';
      case 'survey': return 'assignment';
      case 'update': return 'edit';
      default: return 'sync';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'enrollment': return 'Inscription';
      case 'survey': return 'Enquête';
      case 'update': return 'Mise à jour';
      default: return 'Synchronisation';
    }
  };

  const renderQueueItem = ({ item }) => (
    <Card style={styles.itemCard}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <Avatar.Icon 
            size={40} 
            icon={getTypeIcon(item.type)}
            style={styles.itemIcon}
          />
          <View style={styles.itemInfo}>
            <Title style={styles.itemTitle}>
              {getTypeLabel(item.type)}
            </Title>
            <Paragraph style={styles.itemDescription}>
              {item.description || `${item.type} - ${item.id}`}
            </Paragraph>
            <Paragraph style={styles.itemDate}>
              {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </Paragraph>
          </View>
          <View style={styles.itemActions}>
            <Chip 
              icon="clock" 
              style={styles.statusChip}
              textStyle={{ fontSize: 12 }}
            >
              En attente
            </Chip>
            <View style={styles.actionButtons}>
              <IconButton
                icon="sync"
                size={20}
                onPress={() => handleSyncItem(item)}
                disabled={!isConnected}
                style={styles.actionButton}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteItem(item)}
                style={styles.deleteButton}
              />
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header avec statut */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Title style={styles.headerTitle}>
              Queue de synchronisation
            </Title>
            <View style={styles.statusContainer}>
              <Chip 
                icon={isConnected ? 'wifi' : 'wifi-off'}
                style={[
                  styles.connectionChip,
                  { backgroundColor: isConnected ? '#E8F5E8' : '#FFEBEE' }
                ]}
              >
                {isConnected ? 'En ligne' : 'Hors ligne'}
              </Chip>
              <Chip 
                icon="database"
                style={styles.countChip}
              >
                {queueData.length} élément(s)
              </Chip>
            </View>
          </View>
          
          {queueData.length > 0 && (
            <Button
              mode="contained"
              onPress={handleSyncAll}
              disabled={!isConnected || syncing}
              loading={syncing}
              style={styles.syncButton}
              icon="sync"
            >
              Synchroniser tout
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Liste des éléments */}
      {queueData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Avatar.Icon 
            size={80} 
            icon="check-circle"
            style={styles.emptyIcon}
          />
          <Title style={styles.emptyTitle}>
            Aucune donnée en attente
          </Title>
          <Paragraph style={styles.emptyText}>
            Toutes vos données sont synchronisées !
          </Paragraph>
        </View>
      ) : (
        <FlatList
          data={queueData}
          renderItem={renderQueueItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2E7D32']}
            />
          }
        />
      )}
    </View>
  );
}

const queueStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  headerContent: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    color: '#2E7D32',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  connectionChip: {
    alignSelf: 'flex-start',
  },
  countChip: {
    backgroundColor: '#E3F2FD',
  },
  syncButton: {
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemCard: {
    marginBottom: 12,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemIcon: {
    backgroundColor: '#2E7D32',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemDescription: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
  },
  itemDate: {
    color: '#888',
    fontSize: 12,
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  statusChip: {
    backgroundColor: '#FFF3E0',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#E3F2FD',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    backgroundColor: '#4CAF50',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
});