// =============================================================================
// RSU GABON - LOGIN SCREEN COMPLET
// Fichier: src/screens/Auth/LoginScreen.jsx
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Avatar,
  Chip,
  HelperText,
  Divider,
  Surface,
  Text,
} from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authService from '../../services/auth/authService';
// validationService n'est pas utilisé et a été laissé en commentaire dans l'original. 
// Je le laisse ici pour cohérence mais vous pouvez le retirer s'il n'est pas utilisé.
// import validationService from '../../services/validation/validationService'; 

// Schema validation login
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email invalide')
    .required('Email requis'),
  password: Yup.string()
    .min(6, 'Mot de passe trop court')
    .required('Mot de passe requis'),
});

export default function LoginScreen({ onLogin, isConnected = true }) {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastLoginAttempt, setLastLoginAttempt] = useState(null);

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('saved_email');
      const savedRemember = await AsyncStorage.getItem('remember_me');

      if (savedEmail && savedRemember === 'true') {
        setRememberMe(true);
        // Les credentials seront pré-remplies via initialValues
      }
    } catch (error) {
      console.error('Erreur chargement credentials:', error);
    }
  };

  const handleLogin = async (values, { setSubmitting, setFieldError }) => {
    try {
      setLoading(true);
      setLastLoginAttempt(new Date());

      // Validation réseau pour auth serveur
      if (!isConnected) {
        Alert.alert(
          'Hors ligne',
          'Connexion internet requise pour la première connexion'
        );
        return;
      }

      // Tentative authentification
      const result = await onLogin({
        email: values.email.trim(),
        password: values.password,
      });

      if (result?.success) {
        // Sauvegarder email si "Se souvenir"
        if (rememberMe) {
          await AsyncStorage.setItem('saved_email', values.email.trim());
          await AsyncStorage.setItem('remember_me', 'true');
        } else {
          await AsyncStorage.removeItem('saved_email');
          await AsyncStorage.removeItem('remember_me');
        }

        console.log('✅ Login réussi - redirection Dashboard');

      } else {
        // Gestion erreurs spécifiques
        const errorMessage = result?.message || 'Erreur de connexion';

        if (errorMessage.includes('email')) {
          setFieldError('email', 'Email incorrect');
        } else if (errorMessage.includes('password')) {
          setFieldError('password', 'Mot de passe incorrect');
        } else {
          Alert.alert('Erreur de connexion', errorMessage);
        }
      }

    } catch (error) {
      console.error('Erreur login:', error);
      Alert.alert(
        'Erreur',
        'Impossible de se connecter. Vérifiez vos identifiants.'
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleTestCredentials = (setFieldValue) => {
    Alert.alert(
      'Identifiants de test disponibles',
      `🇬🇦 RSU GABON - Credentials Backend Django:

  ADMIN (Backend Réel):
  📧 Email: souare.ahmed@gmail.com
  🔑 Password: admin123

  ENQUÊTEUR (Test Mobile):
  📧 Email: enqueteur@rsu.gabon.ga  
  🔑 Password: test123

  ℹ️ Le backend Django tourne sur http://127.0.0.1:8000/`,
      [
        {
          text: 'Copier Admin',
          onPress: () => {
            setFieldValue('email', 'souare.ahmed@gmail.com');
            setFieldValue('password', 'admin123');
          }
        },
        {
          text: 'Copier Enquêteur',
          onPress: () => {
            setFieldValue('email', 'enqueteur@rsu.gabon.ga');
            setFieldValue('password', 'test123');
          }
        },
        { text: 'OK' }
      ]
    );
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Mot de passe oublié',
      'Contactez votre superviseur pour réinitialiser votre mot de passe.',
      [{ text: 'OK' }]
    );
  };

  const getInitialValues = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('saved_email');
      const savedRemember = await AsyncStorage.getItem('remember_me');

      return {
        email: (savedRemember === 'true' && savedEmail) ? savedEmail : '',
        password: '',
      };
    } catch {
      return { email: '', password: '' };
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header avec logo et titre */}
        <Surface style={styles.headerSurface}>
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/rsu-gabon-logo.png')}
              style={styles.logoImage} // CORRECTION : Utilisation du style déplacé
              resizeMode="contain"
            />
            <Title style={styles.appTitle}>RSU Gabon</Title>
            <Paragraph style={styles.appSubtitle}>
              Registre Social Unifié
            </Paragraph>
            <Paragraph style={styles.appDescription}>
              Application mobile pour enquêteurs terrain
            </Paragraph>
          </View>
        </Surface>

        {/* Statut connexion */}
        <View style={styles.connectionStatus}>
          <Chip
            icon={isConnected ? 'wifi' : 'wifi-off'}
            style={[
              styles.connectionChip,
              { backgroundColor: isConnected ? '#E8F5E8' : '#FFEBEE' }
            ]}
            textStyle={{
              color: isConnected ? '#2E7D32' : '#D32F2F',
              fontSize: 12
            }}
          >
            {isConnected ? 'En ligne' : 'Hors ligne'}
          </Chip>
        </View>

        {/* Formulaire de connexion */}
        <Card style={styles.loginCard}>
          <Card.Content>
            <Title style={styles.loginTitle}>Connexion</Title>

            <Formik
              // CORRECTION: Utilisation d'un état local pour les valeurs initiales pour éviter les problèmes de Formik et AsyncStorage
              initialValues={{ email: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={handleLogin}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
                setFieldValue,
              }) => {
                // Charger les valeurs sauvegardées au premier render
                // NOTE: Ce hook garantit que les valeurs initiales sont chargées APRES le montage du composant.
                React.useEffect(() => {
                  getInitialValues().then(initialValues => {
                    setFieldValue('email', initialValues.email);
                  });
                }, [setFieldValue]);

                return (
                  <View style={styles.form}>
                    <TextInput
                      mode="outlined"
                      label="Email *"
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      error={touched.email && errors.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.input}
                      left={<TextInput.Icon icon="email" />}
                      placeholder="enqueteur@rsu.gabon.ga"
                    />
                    <HelperText type="error" visible={touched.email && errors.email}>
                      {errors.email}
                    </HelperText>

                    <TextInput
                      mode="outlined"
                      label="Mot de passe *"
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      error={touched.password && errors.password}
                      secureTextEntry={!showPassword}
                      style={styles.input}
                      left={<TextInput.Icon icon="lock" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                      placeholder="Votre mot de passe"
                    />
                    <HelperText type="error" visible={touched.password && errors.password}>
                      {errors.password}
                    </HelperText>

                    {/* Options connexion */}
                    <View style={styles.loginOptions}>
                      <Button
                        mode="text"
                        onPress={() => setRememberMe(!rememberMe)}
                        style={styles.rememberButton}
                        icon={rememberMe ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        textColor={rememberMe ? '#2E7D32' : '#666'}
                      >
                        Se souvenir de moi
                      </Button>

                      <Button
                        mode="text"
                        onPress={handleForgotPassword}
                        style={styles.forgotButton}
                        textColor="#2E7D32"
                      >
                        Mot de passe oublié ?
                      </Button>
                    </View>

                    {/* Bouton connexion */}
                    <Button
                      mode="contained"
                      onPress={handleSubmit}
                      loading={loading || isSubmitting}
                      disabled={loading || isSubmitting || !isConnected}
                      style={styles.loginButton}
                      contentStyle={styles.loginButtonContent}
                      icon="login"
                    >
                      Se connecter
                    </Button>

                    <Divider style={styles.divider} />

                    {/* Aide */}
                    <View style={styles.helpSection}>
                      <Button
                        mode="outlined"
                        onPress={() => handleTestCredentials(setFieldValue)}
                        style={styles.helpButton}
                        icon="help-circle"
                      >
                        Identifiants de test
                      </Button>
                    </View>
                  </View>
                );
              }}
            </Formik>
          </Card.Content>
        </Card>

        {/* Informations projet */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.projectInfo}>
              <Paragraph style={styles.infoText}>
                🇬🇦 <Text style={styles.infoTextBold}>République Gabonaise</Text>
              </Paragraph>
              <Paragraph style={styles.infoText}>
                💰 Financement: <Text style={styles.infoTextBold}>Banque Mondiale €56.2M</Text>
              </Paragraph>
              <Paragraph style={styles.infoText}>
                🎯 Objectif: <Text style={styles.infoTextBold}>2M+ citoyens gabonais</Text>
              </Paragraph>
              <Paragraph style={styles.infoText}>
                🏆 Standards: <Text style={styles.infoTextBold}>Top 1% gestion projet digital</Text>
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Debug info en développement */}
        {__DEV__ && (
          <Card style={styles.debugCard}>
            <Card.Content>
              <Title style={styles.debugTitle}>Debug Info</Title>
              <Paragraph style={styles.debugText}>
                Dernière tentative: {lastLoginAttempt?.toLocaleTimeString() || 'Aucune'}
              </Paragraph>
              <Paragraph style={styles.debugText}>
                Réseau: {isConnected ? '✅ Connecté' : '❌ Déconnecté'}
              </Paragraph>
              <Paragraph style={styles.debugText}>
                Version: 1.0.0-mobile-mvp
              </Paragraph>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  headerSurface: {
    elevation: 4,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  // CORRECTION : Ajout du style logoImage manquant et nettoyage du style logo
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  logo: {
    backgroundColor: '#2E7D32',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  connectionStatus: {
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionChip: {
    alignSelf: 'center',
  },
  loginCard: {
    elevation: 4,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: '#2E7D32',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 4,
  },
  loginOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  rememberButton: {
    alignSelf: 'flex-start',
  },
  forgotButton: {
    alignSelf: 'flex-end',
  },
  loginButton: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#2E7D32',
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  helpSection: {
    alignItems: 'center',
  },
  helpButton: {
    borderColor: '#2E7D32',
  },
  infoCard: {
    elevation: 2,
    marginBottom: 16,
  },
  projectInfo: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
    color: '#666',
  },
  infoTextBold: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  debugCard: {
    elevation: 1,
    backgroundColor: '#FFECB3',
  },
  debugTitle: {
    fontSize: 16,
    color: '#F57C00',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#E65100',
    marginBottom: 2,
  },
});

// Credentials de test par défaut (pour développement)
// Ces variables sont en dehors de l'export par défaut, donc elles ne sont pas modifiées,
// mais je m'assure qu'elles restent à la fin du fichier.
export const TEST_CREDENTIALS = [
  {
    email: 'admin@rsu.ga',
    password: 'TestPass123!',
    userType: 'ADMIN'
  },
  {
    email: 'enqueteur@rsu.gabon.ga',
    password: 'test123',
    userType: 'SURVEYOR'
  },
  {
    email: 'testjwt@rsu.ga',
    password: 'TestPass123!',
    userType: 'ADMIN'
  }
];