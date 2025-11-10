// =============================================================================
// RSU GABON - PROFILE SCREEN
// Fichier: src/screens/Profile/ProfileScreen.jsx
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  List,
  Divider,
  TextInput,
  Switch,
  Chip,
  IconButton,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import authService from '../../services/auth/authService';
import syncService from '../../services/sync/syncService';
import apiClient from '../../services/api/apiClient';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    totalSurveys: 0,
    pendingSync: 0,
  });
  const [settings, setSettings] = useState({
    autoSync: true,
    notifications: true,
    gpsTracking: true,
    offlineMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadProfileData();
    loadUserStats();
    loadSettings();
  }, []);

  const loadProfileData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setEditData({
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
      });
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Statistiques locales
      const pendingCount = await syncService.getPendingCount();
      
      // Tentative récupération stats serveur
      try {
        const response = await apiClient.get('/profile/surveyor-stats/');
        setStats({
          totalEnrollments: response.data.total_enrollments || 0,
          totalSurveys: response.data.total_surveys || 0,
          pendingSync: pendingCount,
        });
      } catch {
        // Fallback stats locales
        setStats(prev => ({ ...prev, pendingSync: pendingCount }));
      }
    } catch (error) {
      console.error('Erreur stats utilisateur:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('user_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('user_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Appliquer les paramètres
      if (newSettings.autoSync) {
        syncService.enableAutoSync();
      } else {
        syncService.disableAutoSync();
      }
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const updatedData = await authService.updateProfile(editData);
      setUser(updatedData);
      setEditing(false);
      
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              // L'app sera automatiquement redirigée vers login
            } catch (error) {
              console.error('Erreur déconnexion:', error);
            }
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Vider le cache',
      'Cela supprimera toutes les données locales non synchronisées. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await syncService.clearData();
              await loadUserStats();
              Alert.alert('Succès', 'Cache vidé avec succès');
            } catch (error) {
              console.error('Erreur vidage cache:', error);
              Alert.alert('Erreur', 'Impossible de vider le cache');
            }
          }
        }
      ]
    );
  };

  const handleTestGPS = async () => {
    try {
      setLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Permission GPS requise pour les enquêtes');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      Alert.alert(
        'Test GPS réussi',
        `Coordonnées: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}\nPrécision: ${location.coords.accuracy}m`
      );
    } catch (error) {
      console.error('Erreur test GPS:', error);
      Alert.alert('Erreur GPS', 'Impossible d\'obtenir la position');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Chargement du profil...</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header profil */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={80} 
              label={`${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              {editing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    mode="outlined"
                    label="Prénom"
                    value={editData.first_name}
                    onChangeText={(text) => setEditData(prev => ({ ...prev, first_name: text }))}
                    style={styles.editInput}
                  />
                  <TextInput
                    mode="outlined"
                    label="Nom"
                    value={editData.last_name}
                    onChangeText={(text) => setEditData(prev => ({ ...prev, last_name: text }))}
                    style={styles.editInput}
                  />
                </View>
              ) : (
                <>
                  <Title style={styles.userName}>
                    {user?.first_name} {user?.last_name}
                  </Title>
                  <Paragraph style={styles.userRole}>
                    Enquêteur terrain RSU Gabon
                  </Paragraph>
                  <Paragraph style={styles.userEmail}>
                    {user?.email}
                  </Paragraph>
                </>
              )}
            </View>
            <IconButton
              icon={editing ? 'close' : 'pencil'}
              size={24}
              onPress={editing ? handleCancelEdit : handleEditProfile}
              style={styles.editButton}
            />
          </View>

          {editing && (
            <View style={styles.editActions}>
              <Button
                mode="outlined"
                onPress={handleCancelEdit}
                style={styles.editActionButton}
              >
                Annuler
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                loading={loading}
                style={styles.editActionButton}
              >
                Sauvegarder
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Statistiques */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Statistiques</Title>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Title style={styles.statNumber}>{stats.totalEnrollments}</Title>
              <Paragraph style={styles.statLabel}>Inscriptions</Paragraph>
            </View>
            <View style={styles.statItem}>
              <Title style={styles.statNumber}>{stats.totalSurveys}</Title>
              <Paragraph style={styles.statLabel}>Enquêtes</Paragraph>
            </View>
            <View style={styles.statItem}>
              <Title style={styles.statNumber}>{stats.pendingSync}</Title>
              <Paragraph style={styles.statLabel}>En attente</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Paramètres */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Paramètres</Title>
          
          <List.Item
            title="Synchronisation automatique"
            description="Synchroniser les données dès que possible"
            left={props => <List.Icon {...props} icon="sync" />}
            right={() => (
              <Switch
                value={settings.autoSync}
                onValueChange={(value) => handleSettingChange('autoSync', value)}
              />
            )}
          />
          <Divider />

          <List.Item
            title="Notifications"
            description="Recevoir les notifications de l'application"
            left={props => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={settings.notifications}
                onValueChange={(value) => handleSettingChange('notifications', value)}
              />
            )}
          />
          <Divider />

          <List.Item
            title="Suivi GPS"
            description="Activer la géolocalisation pour les enquêtes"
            left={props => <List.Icon {...props} icon="map-marker" />}
            right={() => (
              <Switch
                value={settings.gpsTracking}
                onValueChange={(value) => handleSettingChange('gpsTracking', value)}
              />
            )}
          />
          <Divider />

          <List.Item
            title="Mode hors ligne"
            description="Privilégier le mode hors ligne"
            left={props => <List.Icon {...props} icon="wifi-off" />}
            right={() => (
              <Switch
                value={settings.offlineMode}
                onValueChange={(value) => handleSettingChange('offlineMode', value)}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Actions système */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Actions</Title>
          
          <Button
            mode="outlined"
            onPress={handleTestGPS}
            style={styles.actionButton}
            icon="map-marker-check"
          >
            Tester GPS
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Sync')}
            style={styles.actionButton}
            icon="sync"
          >
            Gérer synchronisation
          </Button>

          <Button
            mode="outlined"
            onPress={handleClearCache}
            style={styles.actionButton}
            icon="delete-sweep"
          >
            Vider le cache
          </Button>
        </Card.Content>
      </Card>

      {/* Informations système */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Informations</Title>
          
          <List.Item
            title="Version de l'app"
            description="1.0.0-mobile-mvp"
            left={props => <List.Icon {...props} icon="information" />}
          />
          <Divider />

          <List.Item
            title="Dernière synchronisation"
            description={user?.last_sync ? 
              format(new Date(user.last_sync), 'dd/MM/yyyy HH:mm', { locale: fr }) : 
              'Jamais'
            }
            left={props => <List.Icon {...props} icon="clock" />}
          />
          <Divider />

          <List.Item
            title="Serveur"
            description="RSU Gabon Backend"
            left={props => <List.Icon {...props} icon="server" />}
          />
        </Card.Content>
      </Card>

      {/* Bouton déconnexion */}
      <Card style={styles.logoutCard}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            icon="logout"
            buttonColor="#F44336"
          >
            Se déconnecter
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#2E7D32',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    marginBottom: 4,
  },
  userRole: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  userEmail: {
    color: '#888',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  editContainer: {
    flex: 1,
  },
  editInput: {
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  editActionButton: {
    minWidth: 100,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#2E7D32',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  actionButton: {
    marginBottom: 8,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  logoutCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  logoutButton: {
    paddingVertical: 4,
  },
  bottomPadding: {
    height: 20,
  },
});