/**
 * =============================================================================
 * 🇬🇦 RSU GABON - HOUSEHOLD FORM SCREEN
 * Standards Top 1% - Formulaire Complet Ménage
 * =============================================================================
 * 
 * Écran de saisie complète d'un ménage avec toutes les informations requises.
 * Mapping exact avec le modèle Django Household.
 * 
 * Fonctionnalités:
 * - Formulaire multi-sections (wizard)
 * - Validation temps réel
 * - Capture GPS obligatoire
 * - Sauvegarde offline
 * - Sync avec API Django
 * 
 * Fichier: src/screens/Enrollment/HouseholdFormScreen.jsx
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  HelperText,
  RadioButton,
  Checkbox,
  Divider,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';

import gpsService from '../../services/gps/gpsService';
import apiClient from '../../services/api/apiClient';
import syncService from '../../services/sync/syncService';
import { GABON_PROVINCES } from '../../constants/gabonData';

/**
 * =============================================================================
 * SCHÉMA DE VALIDATION
 * =============================================================================
 */
const HouseholdValidationSchema = Yup.object().shape({
  // Informations générales
  household_type: Yup.string()
    .required('Type de ménage requis')
    .oneOf(['NUCLEAR', 'EXTENDED', 'SINGLE_PARENT', 'SINGLE_PERSON', 'COLLECTIVE']),
  
  household_size: Yup.number()
    .required('Taille du ménage requise')
    .min(1, 'Minimum 1 personne')
    .max(50, 'Maximum 50 personnes'),

  // Logement
  housing_type: Yup.string()
    .required('Type de logement requis')
    .oneOf(['OWNED', 'RENTED', 'SHARED', 'PRECARIOUS', 'HOMELESS']),

  water_access: Yup.string()
    .required('Accès à l\'eau requis')
    .oneOf(['PIPED_HOME', 'PUBLIC_TAP', 'WELL', 'RIVER', 'VENDOR', 'NONE']),

  electricity_access: Yup.string()
    .required('Accès électricité requis')
    .oneOf(['GRID', 'GENERATOR', 'SOLAR', 'NONE']),

  // Localisation
  province: Yup.string()
    .required('Province requise')
    .oneOf(GABON_PROVINCES),

  commune: Yup.string()
    .required('Commune requise'),

  quartier: Yup.string()
    .required('Quartier/Village requis'),

  // GPS (obligatoire)
  latitude: Yup.number()
    .required('Coordonnées GPS requises')
    .min(-4.0, 'Latitude hors limites Gabon')
    .max(2.3, 'Latitude hors limites Gabon'),

  longitude: Yup.number()
    .required('Coordonnées GPS requises')
    .min(8.5, 'Longitude hors limites Gabon')
    .max(14.8, 'Longitude hors limites Gabon'),

  // Revenu
  total_monthly_income: Yup.number()
    .min(0, 'Revenu ne peut être négatif'),
});

/**
 * =============================================================================
 * COMPOSANT PRINCIPAL
 * =============================================================================
 */
export default function HouseholdFormScreen({ route, navigation }) {
  const { personId, initialData } = route.params || {};

  const [currentStep, setCurrentStep] = useState(1);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const TOTAL_STEPS = 5;

  /**
   * Valeurs initiales du formulaire
   */
  const initialValues = initialData || {
    // Informations générales
    household_type: 'NUCLEAR',
    household_size: 1,
    
    // Logement
    housing_type: 'RENTED',
    rooms_count: 1,
    water_access: 'PUBLIC_TAP',
    electricity_access: 'GRID',
    sanitation_type: 'FLUSH_TOILET',
    cooking_fuel: 'FIREWOOD',
    
    // Membres vulnérables
    has_disabled_members: false,
    has_elderly_members: false,
    has_pregnant_women: false,
    has_children_under_5: false,
    
    // Localisation
    province: '',
    department: '',
    commune: '',
    quartier: '',
    address_details: '',
    latitude: null,
    longitude: null,
    gps_accuracy: null,
    
    // Économique
    total_monthly_income: 0,
    main_income_source: 'EMPLOYMENT',
    owns_land: false,
    owns_livestock: false,
    
    // Biens
    owns_bicycle: false,
    owns_motorcycle: false,
    owns_car: false,
    owns_tv: false,
    owns_refrigerator: false,
    owns_phone: false,
  };

  /**
   * ==========================================================================
   * CAPTURE GPS
   * ==========================================================================
   */
  const captureGPS = async (setFieldValue) => {
    try {
      setGpsLoading(true);

      const position = await gpsService.getCurrentPosition();

      setFieldValue('latitude', position.latitude);
      setFieldValue('longitude', position.longitude);
      setFieldValue('gps_accuracy', position.accuracy);

      Alert.alert(
        'GPS Capturé',
        `Précision: ${position.accuracy.toFixed(1)}m`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Erreur GPS',
        'Impossible de capturer la position. Vérifiez que le GPS est activé.',
        [{ text: 'OK' }]
      );
    } finally {
      setGpsLoading(false);
    }
  };

  /**
   * ==========================================================================
   * SOUMISSION FORMULAIRE
   * ==========================================================================
   */
  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      // Validation GPS
      if (!values.latitude || !values.longitude) {
        Alert.alert('GPS Requis', 'Veuillez capturer les coordonnées GPS du ménage');
        return;
      }

      // Préparer les données
      const householdData = {
        ...values,
        head_of_household: personId, // Lier au chef de ménage
        created_by: await getCurrentUserId(),
      };

      // Tentative envoi API
      try {
        const response = await apiClient.post('/identity/households/', householdData);

        if (response.data) {
          Alert.alert(
            'Succès',
            'Ménage enregistré avec succès',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      } catch (apiError) {
        // Échec API: sauvegarder offline
        console.log('Sauvegarde offline du ménage');
        
        await syncService.addToQueue({
          type: 'CREATE_HOUSEHOLD',
          data: householdData,
          timestamp: new Date().toISOString(),
        });

        Alert.alert(
          'Sauvegardé Offline',
          'Le ménage sera synchronisé dès que la connexion sera rétablie',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erreur soumission ménage:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * ==========================================================================
   * NAVIGATION WIZARD
   * ==========================================================================
   */
  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * ==========================================================================
   * RENDU SECTIONS
   * ==========================================================================
   */

  const renderStep1GeneralInfo = (formik) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>1. Informations Générales</Title>

        {/* Type de ménage */}
        <Paragraph style={styles.label}>Type de Ménage *</Paragraph>
        <RadioButton.Group
          onValueChange={(value) => formik.setFieldValue('household_type', value)}
          value={formik.values.household_type}
        >
          <RadioButton.Item label="Nucléaire (parents + enfants)" value="NUCLEAR" />
          <RadioButton.Item label="Élargi (famille étendue)" value="EXTENDED" />
          <RadioButton.Item label="Monoparental" value="SINGLE_PARENT" />
          <RadioButton.Item label="Personne seule" value="SINGLE_PERSON" />
          <RadioButton.Item label="Collectif (non familial)" value="COLLECTIVE" />
        </RadioButton.Group>

        {/* Taille du ménage */}
        <TextInput
          label="Nombre de Personnes *"
          value={String(formik.values.household_size)}
          onChangeText={(text) => formik.setFieldValue('household_size', parseInt(text) || 0)}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.input}
          error={formik.touched.household_size && formik.errors.household_size}
        />
        {formik.touched.household_size && formik.errors.household_size && (
          <HelperText type="error">{formik.errors.household_size}</HelperText>
        )}

        {/* Membres vulnérables */}
        <Divider style={styles.divider} />
        <Paragraph style={styles.label}>Membres Vulnérables</Paragraph>

        <Checkbox.Item
          label="Personnes handicapées"
          status={formik.values.has_disabled_members ? 'checked' : 'unchecked'}
          onPress={() => formik.setFieldValue('has_disabled_members', !formik.values.has_disabled_members)}
        />

        <Checkbox.Item
          label="Personnes âgées (60+ ans)"
          status={formik.values.has_elderly_members ? 'checked' : 'unchecked'}
          onPress={() => formik.setFieldValue('has_elderly_members', !formik.values.has_elderly_members)}
        />

        <Checkbox.Item
          label="Femmes enceintes"
          status={formik.values.has_pregnant_women ? 'checked' : 'unchecked'}
          onPress={() => formik.setFieldValue('has_pregnant_women', !formik.values.has_pregnant_women)}
        />

        <Checkbox.Item
          label="Enfants < 5 ans"
          status={formik.values.has_children_under_5 ? 'checked' : 'unchecked'}
          onPress={() => formik.setFieldValue('has_children_under_5', !formik.values.has_children_under_5)}
        />
      </Card.Content>
    </Card>
  );

  const renderStep2Housing = (formik) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>2. Logement</Title>

        {/* Type de logement */}
        <Paragraph style={styles.label}>Type de Logement *</Paragraph>
        <RadioButton.Group
          onValueChange={(value) => formik.setFieldValue('housing_type', value)}
          value={formik.values.housing_type}
        >
          <RadioButton.Item label="Propriétaire" value="OWNED" />
          <RadioButton.Item label="Locataire" value="RENTED" />
          <RadioButton.Item label="Logé gratuitement" value="SHARED" />
          <RadioButton.Item label="Précaire" value="PRECARIOUS" />
          <RadioButton.Item label="Sans abri" value="HOMELESS" />
        </RadioButton.Group>

        {/* Nombre de pièces */}
        <TextInput
          label="Nombre de Pièces"
          value={String(formik.values.rooms_count)}
          onChangeText={(text) => formik.setFieldValue('rooms_count', parseInt(text) || 0)}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.input}
        />

        {/* Accès eau */}
        <Paragraph style={styles.label}>Accès à l'Eau *</Paragraph>
        <RadioButton.Group
          onValueChange={(value) => formik.setFieldValue('water_access', value)}
          value={formik.values.water_access}
        >
          <RadioButton.Item label="Robinet à domicile" value="PIPED_HOME" />
          <RadioButton.Item label="Borne fontaine" value="PUBLIC_TAP" />
          <RadioButton.Item label="Puits" value="WELL" />
          <RadioButton.Item label="Rivière/Source" value="RIVER" />
          <RadioButton.Item label="Vendeur d'eau" value="VENDOR" />
          <RadioButton.Item label="Aucun accès" value="NONE" />
        </RadioButton.Group>

        {/* Accès électricité */}
        <Paragraph style={styles.label}>Accès Électricité *</Paragraph>
        <RadioButton.Group
          onValueChange={(value) => formik.setFieldValue('electricity_access', value)}
          value={formik.values.electricity_access}
        >
          <RadioButton.Item label="Réseau SEEG" value="GRID" />
          <RadioButton.Item label="Groupe électrogène" value="GENERATOR" />
          <RadioButton.Item label="Panneaux solaires" value="SOLAR" />
          <RadioButton.Item label="Aucun accès" value="NONE" />
        </RadioButton.Group>
      </Card.Content>
    </Card>
  );

  const renderStep3Location = (formik) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>3. Localisation</Title>

        {/* Province */}
        <Paragraph style={styles.label}>Province *</Paragraph>
        <RadioButton.Group
          onValueChange={(value) => formik.setFieldValue('province', value)}
          value={formik.values.province}
        >
          {GABON_PROVINCES.map((prov) => (
            <RadioButton.Item key={prov} label={prov} value={prov} />
          ))}
        </RadioButton.Group>

        {/* Commune */}
        <TextInput
          label="Commune *"
          value={formik.values.commune}
          onChangeText={(text) => formik.setFieldValue('commune', text)}
          mode="outlined"
          style={styles.input}
          error={formik.touched.commune && formik.errors.commune}
        />

        {/* Quartier */}
        <TextInput
          label="Quartier/Village *"
          value={formik.values.quartier}
          onChangeText={(text) => formik.setFieldValue('quartier', text)}
          mode="outlined"
          style={styles.input}
          error={formik.touched.quartier && formik.errors.quartier}
        />

        {/* Adresse détaillée */}
        <TextInput
          label="Adresse Détaillée (optionnel)"
          value={formik.values.address_details}
          onChangeText={(text) => formik.setFieldValue('address_details', text)}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        {/* Capture GPS */}
        <Divider style={styles.divider} />
        <Paragraph style={styles.label}>Coordonnées GPS *</Paragraph>

        {formik.values.latitude && formik.values.longitude ? (
          <View style={styles.gpsInfo}>
            <Chip icon="check-circle" style={styles.gpsChip}>
              GPS Capturé ✓
            </Chip>
            <Paragraph>Lat: {formik.values.latitude.toFixed(6)}</Paragraph>
            <Paragraph>Lng: {formik.values.longitude.toFixed(6)}</Paragraph>
            <Paragraph>Précision: {formik.values.gps_accuracy?.toFixed(1)}m</Paragraph>
          </View>
        ) : (
          <HelperText type="error">GPS non capturé</HelperText>
        )}

        <Button
          mode="contained"
          icon="crosshairs-gps"
          onPress={() => captureGPS(formik.setFieldValue)}
          loading={gpsLoading}
          style={styles.button}
        >
          {formik.values.latitude ? 'Recapturer GPS' : 'Capturer GPS'}
        </Button>
      </Card.Content>
    </Card>
  );

  const renderStep4Economic = (formik) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>4. Situation Économique</Title>

        {/* Revenu mensuel */}
        <TextInput
          label="Revenu Mensuel Total (FCFA)"
          value={String(formik.values.total_monthly_income)}
          onChangeText={(text) => formik.setFieldValue('total_monthly_income', parseInt(text) || 0)}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.input}
        />

        {/* Source principale */}
        <Paragraph style={styles.label}>Source Principale de Revenu</Paragraph>
        <RadioButton.Group
          onValueChange={(value) => formik.setFieldValue('main_income_source', value)}
          value={formik.values.main_income_source}
        >
          <RadioButton.Item label="Emploi salarié" value="EMPLOYMENT" />
          <RadioButton.Item label="Activité indépendante" value="SELF_EMPLOYED" />
          <RadioButton.Item label="Agriculture" value="AGRICULTURE" />
          <RadioButton.Item label="Aide sociale" value="SOCIAL_ASSISTANCE" />
          <RadioButton.Item label="Transferts familiaux" value="FAMILY_SUPPORT" />
          <RadioButton.Item label="Aucune" value="NONE" />
        </RadioButton.Group>

        {/* Possessions */}
        <Divider style={styles.divider} />
        <Paragraph style={styles.label}>Biens Possédés</Paragraph>

        <View style={styles.checkboxGrid}>
          <Checkbox.Item
            label="Terrain"
            status={formik.values.owns_land ? 'checked' : 'unchecked'}
            onPress={() => formik.setFieldValue('owns_land', !formik.values.owns_land)}
          />
          <Checkbox.Item
            label="Bétail"
            status={formik.values.owns_livestock ? 'checked' : 'unchecked'}
            onPress={() => formik.setFieldValue('owns_livestock', !formik.values.owns_livestock)}
          />
          <Checkbox.Item
            label="Vélo"
            status={formik.values.owns_bicycle ? 'checked' : 'unchecked'}
            onPress={() => formik.setFieldValue('owns_bicycle', !formik.values.owns_bicycle)}
          />
          <Checkbox.Item
            label="Moto"
            status={formik.values.owns_motorcycle ? 'checked' : 'unchecked'}
            onPress={() => formik.setFieldValue('owns_motorcycle', !formik.values.owns_motorcycle)}
          />
          <Checkbox.Item
            label="Voiture"
            status={formik.values.owns_car ? 'checked' : 'unchecked'}
            onPress={() => formik.setFieldValue('owns_car', !formik.values.owns_car)}
          />
          <Checkbox.Item
            label="Télévision"
            status={formik.values.owns_tv ? 'checked' : 'unchecked'}
            onPress={() => formik.setFieldValue('owns_tv', !formik.values.owns_tv)}
          />
          <Checkbox.Item
            label="Réfrigérateur"
            status={formik.values.owns_refrigerator ? 'checked' : 'unchecked'}
            onPress={() => formik.setFieldValue('owns_refrigerator', !formik.values.owns_refrigerator)}
          />
          <Checkbox.Item
            label="Téléphone"
            status={formik.values.owns_phone ? 'checked' : 'unchecked'}
            onPress={() => formik.setFieldValue('owns_phone', !formik.values.owns_phone)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderStep5Review = (formik) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>5. Récapitulatif</Title>
        <Paragraph>Veuillez vérifier les informations avant de soumettre.</Paragraph>

        <Divider style={styles.divider} />

        <View style={styles.summaryItem}>
          <Paragraph style={styles.summaryLabel}>Type:</Paragraph>
          <Paragraph style={styles.summaryValue}>{formik.values.household_type}</Paragraph>
        </View>

        <View style={styles.summaryItem}>
          <Paragraph style={styles.summaryLabel}>Taille:</Paragraph>
          <Paragraph style={styles.summaryValue}>{formik.values.household_size} personne(s)</Paragraph>
        </View>

        <View style={styles.summaryItem}>
          <Paragraph style={styles.summaryLabel}>Logement:</Paragraph>
          <Paragraph style={styles.summaryValue}>{formik.values.housing_type}</Paragraph>
        </View>

        <View style={styles.summaryItem}>
          <Paragraph style={styles.summaryLabel}>Province:</Paragraph>
          <Paragraph style={styles.summaryValue}>{formik.values.province}</Paragraph>
        </View>

        <View style={styles.summaryItem}>
          <Paragraph style={styles.summaryLabel}>Commune:</Paragraph>
          <Paragraph style={styles.summaryValue}>{formik.values.commune}</Paragraph>
        </View>

        <View style={styles.summaryItem}>
          <Paragraph style={styles.summaryLabel}>GPS:</Paragraph>
          <Paragraph style={styles.summaryValue}>
            {formik.values.latitude && formik.values.longitude ? '✓ Capturé' : '✗ Manquant'}
          </Paragraph>
        </View>

        <View style={styles.summaryItem}>
          <Paragraph style={styles.summaryLabel}>Revenu:</Paragraph>
          <Paragraph style={styles.summaryValue}>
            {formik.values.total_monthly_income.toLocaleString()} FCFA/mois
          </Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  /**
   * ==========================================================================
   * RENDU PRINCIPAL
   * ==========================================================================
   */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={HouseholdValidationSchema}
        onSubmit={handleSubmit}
      >
        {(formik) => (
          <>
            {/* Barre de progression */}
            <View style={styles.progressContainer}>
              <Paragraph>Étape {currentStep} sur {TOTAL_STEPS}</Paragraph>
              <ProgressBar progress={currentStep / TOTAL_STEPS} style={styles.progressBar} />
            </View>

            {/* Contenu scrollable */}
            <ScrollView style={styles.scrollView}>
              {currentStep === 1 && renderStep1GeneralInfo(formik)}
              {currentStep === 2 && renderStep2Housing(formik)}
              {currentStep === 3 && renderStep3Location(formik)}
              {currentStep === 4 && renderStep4Economic(formik)}
              {currentStep === 5 && renderStep5Review(formik)}
            </ScrollView>

            {/* Boutons de navigation */}
            <View style={styles.navigationButtons}>
              {currentStep > 1 && (
                <Button
                  mode="outlined"
                  onPress={previousStep}
                  style={styles.navButton}
                >
                  Précédent
                </Button>
              )}

              {currentStep < TOTAL_STEPS && (
                <Button
                  mode="contained"
                  onPress={nextStep}
                  style={styles.navButton}
                >
                  Suivant
                </Button>
              )}

              {currentStep === TOTAL_STEPS && (
                <Button
                  mode="contained"
                  onPress={formik.handleSubmit}
                  loading={submitting}
                  disabled={!formik.isValid || submitting}
                  style={styles.navButton}
                >
                  Enregistrer Ménage
                </Button>
              )}
            </View>
          </>
        )}
      </Formik>
    </KeyboardAvoidingView>
  );
}

/**
 * =============================================================================
 * HELPERS
 * =============================================================================
 */
async function getCurrentUserId() {
  // TODO: Récupérer l'ID utilisateur depuis authService
  return 'current_user_id';
}

/**
 * =============================================================================
 * STYLES
 * =============================================================================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressBar: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  input: {
    marginVertical: 8,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  gpsInfo: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  gpsChip: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
  summaryValue: {
    color: '#666',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
