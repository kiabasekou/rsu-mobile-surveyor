// =============================================================================
// RSU GABON - APPLICATION MOBILE - IMPORTS CORRIGÉS ET THÈME FINALISÉ
// Fichier: rsu-mobile-surveyor/App.jsx (VERSION FINALE CORRIGÉE)
// =============================================================================

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  Provider as PaperProvider, 
  MD3LightTheme, // ✅ CHANGEMENT: Utilisation du thème clair comme base
  configureFonts,
} from 'react-native-paper';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Services
import authService from './src/services/auth/authService';
import syncService from './src/services/sync/syncService';

// Imports Screens
import LoginScreen from './src/screens/Auth/LoginScreen.jsx';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen.jsx';
import EnrollmentFormScreen from './src/screens/Enrollment/EnrollmentFormScreen.jsx';
import PersonListScreen from './src/screens/Person/PersonListScreen.jsx';
import PersonDetailScreen from './src/screens/Person/PersonDetailScreen.jsx';
import SurveyFormScreen from './src/screens/Survey/SurveyFormScreen.jsx';
import OfflineQueueScreen from './src/screens/Sync/OfflineQueueScreen.jsx';
import ProfileScreen from './src/screens/Profile/ProfileScreen.jsx';

// Configuration Sentry conditionnelle
const SENTRY_DSN = __DEV__ ? null : 'https://your-real-sentry-dsn@sentry.io/project-id';

// Sentry init conditionnel (désactivé pour la démo)
if (SENTRY_DSN) {
  // Sentry.init({
  //   dsn: SENTRY_DSN,
  //   environment: __DEV__ ? 'development' : 'production',
  // });
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// COULEURS OFFICIELLES RSU GABON:
const RSU_COLORS = {
  primary: '#2E7D32',       // Vert principal
  secondary: '#FDD835',      // Jaune/doré
  accent: '#1976D2',         // Bleu
  background: '#F5F5F5',    // Gris clair (pour l'écran principal)
  surface: '#FFFFFF',      // Blanc (pour cartes et surfaces)
  text: '#212121',          // Noir
  onPrimary: '#FFFFFF',    // Texte sur vert
  onSecondary: '#000000',  // Texte sur jaune
};

// 🌟 CRÉATION DU THÈME CLAIR PERSONNALISÉ (MD3 Light)
const customTheme = {
  ...MD3LightTheme, // Hériter du thème clair par défaut
  version: 3,
  colors: {
    ...MD3LightTheme.colors, // Conserver les autres couleurs par défaut
    primary: RSU_COLORS.primary,
    onPrimary: RSU_COLORS.onPrimary,
    secondary: RSU_COLORS.secondary,
    onSecondary: RSU_COLORS.onSecondary,
    accent: RSU_COLORS.accent,
    background: RSU_COLORS.background,
    surface: RSU_COLORS.surface,
    error: '#D32F2F', // Un rouge standard pour les erreurs
  },
  // Vous pouvez ajouter des polices personnalisées ici si nécessaire
  // fonts: configureFonts({}), 
};


// NAVIGATION PRINCIPALE CORRIGÉE
function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Enrollment':
              iconName = 'person_add';
              break;
            case 'PersonList':
              iconName = 'groups';
              break;
            case 'Survey':
              iconName = 'description';
              break;
            case 'Sync':
              iconName = 'sync';
              break;
            case 'Profile':
              iconName = 'account_circle';
              break;
            default:
              iconName = 'dashboard';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: RSU_COLORS.primary, // Utilisation de la couleur RSU
        tabBarInactiveTintColor: RSU_COLORS.text, // Utilisation de la couleur RSU
        tabBarStyle: {
          backgroundColor: RSU_COLORS.surface,
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          elevation: 8,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: RSU_COLORS.primary, // Utilisation de la couleur RSU
        },
        headerTintColor: RSU_COLORS.onPrimary, // Utilisation de la couleur RSU (blanc)
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      {/* ... (Tab.Screen definitions restent inchangées) ... */}
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Tableau de bord',
          headerTitle: '🇬🇦 RSU Gabon',
        }}
      />
      <Tab.Screen 
        name="Enrollment" 
        component={EnrollmentFormScreen}
        options={{
          title: 'Inscription',
          headerTitle: 'Nouvelle inscription',
        }}
      />
      <Tab.Screen 
        name="PersonList" 
        component={PersonListScreen}
        options={{
          title: 'Personnes',
          headerTitle: 'Liste des personnes',
        }}
      />
      <Tab.Screen 
        name="Survey" 
        component={SurveyFormScreen}
        options={{
          title: 'Enquêtes',
          headerTitle: 'Enquêtes terrain',
        }}
      />
      <Tab.Screen 
        name="Sync" 
        component={OfflineQueueScreen}
        options={{
          title: 'Sync',
          headerTitle: 'Synchronisation',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profil',
          headerTitle: 'Mon profil',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    initializeApp();
    setupNetworkListener();
  }, []);

  const initializeApp = async () => {
    try {
      // Vérifier authentication existante
      const userData = await authService.getCurrentUser();
      
      if (userData && userData.token) {
        setIsAuthenticated(true);
        setUser(userData);
        
        // Démarrer services en arrière-plan
        await syncService.initialize();
        
        console.log('✅ App initialisée - Utilisateur connecté:', userData.email);
      } else {
        console.log('ℹ️ App initialisée - Aucun utilisateur connecté');
      }
    } catch (error) {
      console.error('❌ Erreur initialisation app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupNetworkListener = () => {
    // Écouter les changements de connectivité
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('🌐 État réseau:', state.isConnected ? 'Connecté' : 'Déconnecté');
      setIsConnected(state.isConnected);
      
      // Démarrer sync automatique si retour en ligne
      if (state.isConnected && isAuthenticated) {
        syncService.syncPendingData().catch(console.error);
      }
    });

    return unsubscribe;
  };

  const handleLogin = async (credentials) => {
    try {
      setIsLoading(true);
      
      const userData = await authService.login(credentials);
      
      if (userData && userData.token) {
        setIsAuthenticated(true);
        setUser(userData);
        
        // Initialiser services post-login
        await syncService.initialize();
        
        console.log('✅ Login réussi:', userData.email);
        return { success: true };
      } else {
        // Le service d'authentification devrait idéalement renvoyer un message d'erreur plus précis
        throw new Error('Identifiants incorrects'); 
      }
    } catch (error) {
      console.error('❌ Erreur login:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur de connexion' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      await syncService.clearData();
      
      setIsAuthenticated(false);
      setUser(null);
      
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  };

  // Composant Text wrapper pour éviter erreurs
  const LoadingScreen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: RSU_COLORS.background }}>
      <Text style={{ fontSize: 18, color: RSU_COLORS.primary }}>
        🇬🇦 RSU Gabon - Chargement...
      </Text>
    </View>
  );

  // Affichage conditionnel
  if (isLoading) {
    return (
      <PaperProvider theme={customTheme}>
        <LoadingScreen />
      </PaperProvider>
    );
  }

  return (
    // ✅ Utilisation du thème personnalisé ici
    <PaperProvider theme={customTheme}>
      <NavigationContainer>
        {isAuthenticated ? (
          <AppNavigator />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen 
                  {...props} 
                  onLogin={handleLogin}
                  isConnected={isConnected}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}

// MÉTADONNÉES APP
console.log('🇬🇦 RSU GABON Mobile App - Version 1.0.0-mobile-mvp');
console.log('💰 Financement: Banque Mondiale €56.2M');
console.log('🎯 Objectif: 2M+ citoyens gabonais');
console.log('🏆 Standards: Top 1% gestion projet digital');