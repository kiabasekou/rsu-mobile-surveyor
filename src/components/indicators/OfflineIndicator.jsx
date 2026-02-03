/**
 * =============================================================================
 * 🇬🇦 RSU GABON - OFFLINE INDICATOR COMPONENT
 * Standards Top 1% - Indicateur Statut Réseau
 * =============================================================================
 * 
 * Composant badge affichant le statut de connexion et la queue offline.
 * Surveillance temps réel du réseau avec NetInfo.
 * 
 * Fonctionnalités:
 * - Badge rouge/vert selon connexion
 * - Compteur items en attente
 * - Animation de synchronisation
 * - Action de sync manuelle
 * 
 * Utilisation:
 * <OfflineIndicator
 *   position="top-right"
 *   onSyncPress={() => console.log('Sync manuelle')}
 * />
 * 
 * Fichier: src/components/indicators/OfflineIndicator.jsx
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Badge,
  Surface,
  Paragraph,
  IconButton,
  Portal,
  Modal,
  Card,
  Title,
  Button,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { MaterialIcons } from '@expo/vector-icons';

import syncService from '../../services/sync/syncService';

/**
 * =============================================================================
 * COMPOSANT PRINCIPAL
 * =============================================================================
 */
export default function OfflineIndicator({
  position = 'top-right',
  showLabel = true,
  onSyncPress,
  autoSync = true,
}) {
  const [isConnected, setIsConnected] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);

  // Animation pulse
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Écouter les changements de connexion
    const unsubscribe = NetInfo.addEventListener(handleConnectionChange);

    // Charger le compteur initial
    loadPendingCount();

    // Intervalle de mise à jour
    const interval = setInterval(loadPendingCount, 10000); // Toutes les 10s

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Animation pulse si offline
    if (!isConnected && pendingCount > 0) {
      startPulseAnimation();
    }
  }, [isConnected, pendingCount]);

  /**
   * ==========================================================================
   * GESTION CONNEXION
   * ==========================================================================
   */

  /**
   * Gère les changements de statut de connexion
   */
  const handleConnectionChange = (state) => {
    const connected = state.isConnected && state.isInternetReachable !== false;
    setIsConnected(connected);

    if (connected && autoSync && pendingCount > 0) {
      // Auto-sync dès que la connexion est rétablie
      handleSync();
    }
  };

  /**
   * ==========================================================================
   * GESTION QUEUE OFFLINE
   * ==========================================================================
   */

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
   * Charge les détails des items en attente
   */
  const loadPendingItems = async () => {
    try {
      const items = await syncService.getQueue();
      setPendingItems(items);
    } catch (error) {
      console.error('Erreur chargement pending items:', error);
    }
  };

  /**
   * ==========================================================================
   * SYNCHRONISATION
   * ==========================================================================
   */

  /**
   * Lance la synchronisation
   */
  const handleSync = async () => {
    if (!isConnected) {
      Alert.alert(
        'Pas de Connexion',
        'Impossible de synchroniser sans connexion internet',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setSyncing(true);

      const result = await syncService.processQueue();

      if (result.success) {
        Alert.alert(
          'Synchronisation Réussie',
          `${result.synced} élément(s) synchronisé(s)`,
          [{ text: 'OK' }]
        );

        // Recharger le compteur
        await loadPendingCount();
      } else {
        Alert.alert(
          'Synchronisation Partielle',
          `${result.synced} réussi(s), ${result.failed} échoué(s)`,
          [{ text: 'OK' }]
        );
      }

      // Callback personnalisé
      if (onSyncPress) {
        onSyncPress(result);
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      Alert.alert('Erreur', 'Échec de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  /**
   * ==========================================================================
   * ANIMATIONS
   * ==========================================================================
   */

  /**
   * Animation pulse
   */
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * ==========================================================================
   * RENDU MODAL DÉTAILS
   * ==========================================================================
   */

  const renderDetailsModal = () => {
    return (
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Card>
            <Card.Content>
              <Title>Queue de Synchronisation</Title>
              <Paragraph style={styles.modalDescription}>
                {pendingCount} élément(s) en attente
              </Paragraph>

              <Divider style={styles.divider} />

              {pendingItems.length > 0 ? (
                pendingItems.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.queueItem}>
                    <MaterialIcons
                      name={getItemIcon(item.type)}
                      size={20}
                      color="#666"
                    />
                    <View style={styles.queueItemInfo}>
                      <Paragraph style={styles.queueItemType}>
                        {getItemTypeLabel(item.type)}
                      </Paragraph>
                      <Paragraph style={styles.queueItemDate}>
                        {new Date(item.timestamp).toLocaleString('fr-FR')}
                      </Paragraph>
                    </View>
                  </View>
                ))
              ) : (
                <Paragraph style={styles.emptyText}>Aucun élément en attente</Paragraph>
              )}

              {pendingItems.length > 5 && (
                <Paragraph style={styles.moreText}>
                  ... et {pendingItems.length - 5} autre(s)
                </Paragraph>
              )}
            </Card.Content>

            <Card.Actions>
              <Button onPress={() => setModalVisible(false)}>Fermer</Button>
              <Button
                mode="contained"
                onPress={() => {
                  setModalVisible(false);
                  handleSync();
                }}
                disabled={!isConnected || syncing}
              >
                Synchroniser
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    );
  };

  /**
   * ==========================================================================
   * RENDU BADGE
   * ==========================================================================
   */

  const renderBadge = () => {
    const badgeColor = isConnected ? '#4CAF50' : '#F44336';
    const statusText = isConnected ? 'En ligne' : 'Hors ligne';

    return (
      <TouchableOpacity
        onPress={() => {
          loadPendingItems();
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.badge,
            { transform: [{ scale: !isConnected ? pulseAnim : 1 }] },
          ]}
        >
          <Surface style={[styles.surface, { backgroundColor: badgeColor }]}>
            <View style={styles.badgeContent}>
              {/* Indicateur connexion */}
              <View style={styles.statusIndicator}>
                <MaterialIcons
                  name={isConnected ? 'wifi' : 'wifi-off'}
                  size={20}
                  color="#FFF"
                />
                {showLabel && (
                  <Paragraph style={styles.statusText}>{statusText}</Paragraph>
                )}
              </View>

              {/* Compteur items en attente */}
              {pendingCount > 0 && (
                <View style={styles.counterContainer}>
                  <Badge style={styles.counterBadge}>{pendingCount}</Badge>
                </View>
              )}

              {/* Bouton sync */}
              {isConnected && pendingCount > 0 && (
                <IconButton
                  icon={syncing ? 'loading' : 'sync'}
                  size={20}
                  iconColor="#FFF"
                  onPress={handleSync}
                  disabled={syncing}
                  style={styles.syncButton}
                />
              )}
            </View>

            {/* Animation sync */}
            {syncing && (
              <ActivityIndicator
                size="small"
                color="#FFF"
                style={styles.syncingIndicator}
              />
            )}
          </Surface>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  /**
   * ==========================================================================
   * RENDU PRINCIPAL
   * ==========================================================================
   */

  const positionStyles = getPositionStyles(position);

  return (
    <>
      <View style={[styles.container, positionStyles]}>
        {renderBadge()}
      </View>
      {renderDetailsModal()}
    </>
  );
}

/**
 * =============================================================================
 * HELPERS
 * =============================================================================
 */

/**
 * Retourne les styles de position
 */
function getPositionStyles(position) {
  const baseStyle = {
    position: 'absolute',
    zIndex: 1000,
  };

  switch (position) {
    case 'top-left':
      return { ...baseStyle, top: 10, left: 10 };
    case 'top-right':
      return { ...baseStyle, top: 10, right: 10 };
    case 'bottom-left':
      return { ...baseStyle, bottom: 10, left: 10 };
    case 'bottom-right':
      return { ...baseStyle, bottom: 10, right: 10 };
    default:
      return { ...baseStyle, top: 10, right: 10 };
  }
}

/**
 * Retourne l'icône selon le type d'item
 */
function getItemIcon(type) {
  const icons = {
    CREATE_PERSON: 'person-add',
    UPDATE_PERSON: 'person',
    CREATE_HOUSEHOLD: 'home',
    SUBMIT_SURVEY: 'assignment',
    UPLOAD_DOCUMENT: 'upload-file',
  };
  return icons[type] || 'description';
}

/**
 * Retourne le libellé du type d'item
 */
function getItemTypeLabel(type) {
  const labels = {
    CREATE_PERSON: 'Nouvelle Personne',
    UPDATE_PERSON: 'Mise à Jour Personne',
    CREATE_HOUSEHOLD: 'Nouveau Ménage',
    SUBMIT_SURVEY: 'Enquête',
    UPLOAD_DOCUMENT: 'Document',
  };
  return labels[type] || type;
}

/**
 * =============================================================================
 * STYLES
 * =============================================================================
 */
const styles = StyleSheet.create({
  container: {
    // Position définie dynamiquement
  },
  badge: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  surface: {
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  counterContainer: {
    marginLeft: 8,
  },
  counterBadge: {
    backgroundColor: '#FFF',
    color: '#000',
  },
  syncButton: {
    margin: 0,
    marginLeft: 4,
  },
  syncingIndicator: {
    position: 'absolute',
    right: 8,
  },
  modal: {
    margin: 20,
  },
  modalDescription: {
    color: '#666',
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  queueItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  queueItemType: {
    fontWeight: 'bold',
  },
  queueItemDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  moreText: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
});
