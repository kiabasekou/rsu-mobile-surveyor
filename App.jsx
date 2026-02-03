// =============================================================================
// RSU GABON - APPLICATION MOBILE
// Fichier: App.jsx - Version finale corrigée et optimisée
// =============================================================================

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

// Services
import authService from './src/services/auth/authService';
import syncService from './src/services/sync/syncService';

// Screens
import LoginScreen from './src/screens/Auth/LoginScreen.jsx';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen.jsx';
import EnrollmentFormScreen from './src/screens/Enrollment/EnrollmentFormScreen.jsx';
import PersonListScreen from './src/screens/Person/PersonListScreen.jsx';
import SurveyFormScreen from './src/screens/Survey/SurveyFormScreen.jsx';
import OfflineQueueScreen from './src/screens/Sync/OfflineQueueScreen.jsx';
import ProfileScreen from './src/screens/Profile/ProfileScreen.jsx';
import HouseholdFormScreen from './src/screens/Enrollment/HouseholdFormScreen.jsx';
import MapViewScreen from './src/screens/Map/MapViewScreen.jsx';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Couleurs officielles RSU Gabon
const RSU_COLORS = {
  primary: '#2E7D32',
  secondary: '#FDD835',
  accent: '#1976D2',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  onPrimary: '#FFFFFF',
  onSecondary: '#000000',
  error: '#D32F2F',
};

// Thème Paper adapté
const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: RSU_COLORS.primary,
    secondary: RSU_COLORS.secondary,
    accent: RSU_COLORS.accent,
    background: RSU_COLORS.background,
    surface: RSU_COLORS.surface,
    error: RSU_COLORS.error,
  },
};

// Navigation onglets (utilisateur connecté)
function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'dashboard',
            Enrollment: 'person-add',
            PersonList: 'group',
            Survey: 'description',
            Sync: 'sync',
            Profile: 'account-circle',
          };
          return (
            <MaterialIcons
              name={icons[route.name] || 'help-outline'}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: RSU_COLORS.primary,
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: RSU_COLORS.primary },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#fff' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Enrollment" component={EnrollmentFormScreen} options={{ title: 'Inscription' }} />
      <Tab.Screen name="PersonList" component={PersonListScreen} options={{ title: 'Ménages' }} />
      <Tab.Screen name="Survey" component={SurveyFormScreen} options={{ title: 'Enquêtes' }} />
      <Tab.Screen name="Sync" component={OfflineQueueScreen} options={{ title: 'Synchronisation' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Désactiver certains warnings verbeux en développement (optionnel)
  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreLogs([
        'Non-serializable values were found in the navigation state',
        'Sending...',
        // Ajoute d'autres warnings si besoin
      ]);
    }
  }, []);

  // Initialisation + écoute réseau
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData?.token) {
          setIsAuthenticated(true);
          await syncService.initialize();
        }
      } catch (error) {
        console.error('Erreur initialisation app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Écoute connexion réseau + auto-sync
    const unsubscribeNet = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected && isAuthenticated) {
        syncService.syncPendingData().catch(console.error);
      }
    });

    return () => unsubscribeNet();
  }, [isAuthenticated]); // ← dépendance correcte

  // Gestion login (passée au composant LoginScreen)
  const handleLogin = async (credentials) => {
    try {
      const userData = await authService.login(credentials);
      if (userData?.token) {
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: 'Identifiants invalides' };
    } catch (error) {
      return { success: false, message: error.message || 'Erreur connexion' };
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: RSU_COLORS.background }}>
        <ActivityIndicator size="large" color={RSU_COLORS.primary} />
        <Text style={{ marginTop: 12, color: RSU_COLORS.primary, fontSize: 16 }}>
          🇬🇦 RSU Gabon - Chargement...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={customTheme}>
        <NavigationContainer>
          {isAuthenticated ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs" component={AppNavigator} />
              <Stack.Screen name="HouseholdForm" component={HouseholdFormScreen} options={{ title: 'Nouveau Ménage' }} />
              <Stack.Screen name="MapView" component={MapViewScreen} options={{ title: 'Carte' }} />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login">
                {props => <LoginScreen {...props} onLogin={handleLogin} isConnected={isConnected} />}
              </Stack.Screen>
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

// Métadonnées (commentées pour ne pas polluer la console)
// console.log('🇬🇦 RSU GABON Mobile App - v1.0.0-mobile-mvp');
// console.log('🎯 Objectif : 2M+ citoyens gabonais recensés');