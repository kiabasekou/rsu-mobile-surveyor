// =============================================================================
// 3. ENROLLMENT FORM (screens/Enrollment/EnrollmentFormScreen.jsx)
// =============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  RadioButton,
  Chip,
  ProgressBar,
  Avatar,
  HelperText,
  Divider,
} from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-native-date-picker';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Services
import enrollmentService from '../../services/enrollment/enrollmentService';
import validationService from '../../services/validation/validationService';
import scoringService from '../../services/scoring/scoringService';
import gpsService from '../../services/gps/gpsService';

// Données Gabon
import { GABON_PROVINCES, VULNERABILITY_FACTORS } from '../../constants/gabonData';

const EnrollmentSchema = Yup.object().shape({
  // Identité de base
  firstName: Yup.string()
    .min(2, 'Prénom trop court')
    .required('Prénom requis'),
  lastName: Yup.string()
    .min(2, 'Nom trop court')
    .required('Nom requis'),
  nip: Yup.string()
    .matches(/^[0-9]{10}$/, 'NIP doit contenir 10 chiffres')
    .required('NIP requis'),
  birthDate: Yup.date()
    .max(new Date(), 'Date de naissance ne peut être dans le futur')
    .required('Date de naissance requise'),
  gender: Yup.string()
    .oneOf(['M', 'F'], 'Genre requis')
    .required('Genre requis'),
  phone: Yup.string()
    .matches(/^(\+241|241)?[0-9]{8}$/, 'Format téléphone gabonais invalide')
    .required('Téléphone requis'),
  province: Yup.string()
    .oneOf(Object.keys(GABON_PROVINCES), 'Province invalide')
    .required('Province requise'),
    
  // Informations socio-économiques
  educationLevel: Yup.string().required('Niveau éducation requis'),
  occupationStatus: Yup.string().required('Statut professionnel requis'),
  monthlyIncome: Yup.number()
    .min(0, 'Revenu ne peut être négatif')
    .required('Revenu mensuel requis'),
});

const FORM_STEPS = [
  { key: 'identity', title: 'Identité', icon: 'account' },
  { key: 'location', title: 'Localisation', icon: 'map-marker' },
  { key: 'socioeconomic', title: 'Socio-Économique', icon: 'currency-usd' },
  { key: 'household', title: 'Ménage', icon: 'home-group' },
  { key: 'vulnerability', title: 'Vulnérabilité', icon: 'shield-alert' },
  { key: 'validation', title: 'Validation', icon: 'check-circle' },
];

export default function EnrollmentFormScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vulnerabilityScore, setVulnerabilityScore] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  // Données du formulaire
  const [personData, setPersonData] = useState({
    firstName: '',
    lastName: '',
    nip: '',
    birthDate: new Date('1990-01-01'),
    gender: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    village: '',
  });

  const [householdData, setHouseholdData] = useState({
    householdSize: '',
    dependents: '',
    monthlyIncome: '',
    hasElectricity: '',
    hasRunningWater: '',
    housingType: '',
    hasSavings: '',
    hasFoodSecurity: ''
  });

  // Calcul automatique du score vulnérabilité
  useEffect(() => {
    if (currentStep === 4) { // Étape vulnérabilité
      const result = scoringService.calculateLocalVulnerabilityScore(
        personData,
        householdData
      );
      setVulnerabilityScore(result);
    }
  }, [currentStep, personData, householdData]);

  // Validation temps réel
  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'nip':
        const nipValidation = validationService.validateNIP(value);
        if (!nipValidation.valid) {
          newErrors.nip = nipValidation.error;
        } else {
          delete newErrors.nip;
        }
        break;

      case 'phone':
        const phoneValidation = validationService.validatePhone(value);
        if (!phoneValidation.valid) {
          newErrors.phone = phoneValidation.error;
        } else {
          delete newErrors.phone;
        }
        break;

      case 'birthDate':
        const birthValidation = validationService.validateBirthDate(value);
        if (!birthValidation.valid) {
          newErrors.birthDate = birthValidation.error;
        } else {
          delete newErrors.birthDate;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  // Capturer GPS
  const captureGPS = async () => {
    setGpsLoading(true);
    try {
      const location = await gpsService.getCurrentPosition();
      setGpsData(location);
      
      // Mettre à jour les données de géolocalisation
      setPersonData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
        gpsAccuracy: location.accuracy,
        gpsTimestamp: location.timestamp,
      }));

      Alert.alert('GPS Capturé', `Coordonnées: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
    } catch (error) {
      Alert.alert('Erreur GPS', 'Impossible de capturer la position GPS');
      console.error('GPS Error:', error);
    } finally {
      setGpsLoading(false);
    }
  };

  // Navigation entre étapes
  const nextStep = () => {
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Soumission finale
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const enrollmentData = {
        person: personData,
        household: householdData,
        vulnerabilityScore: vulnerabilityScore,
        gpsData: gpsData,
        timestamp: new Date().toISOString(),
      };

      const result = await enrollmentService.submitEnrollment(enrollmentData);
      
      if (result.success) {
        Alert.alert(
          'Inscription Réussie',
          `RSU-ID: ${result.rsuId}\nScore vulnérabilité: ${vulnerabilityScore?.score}`,
          [
            {
              text: 'Nouvelle Inscription',
              onPress: resetForm,
            },
            {
              text: 'Retour Accueil',
              onPress: () => navigation.navigate('Dashboard'),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de soumettre l\'inscription');
      console.error('Submit Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPersonData({
      firstName: '',
      lastName: '',
      nip: '',
      birthDate: new Date('1990-01-01'),
      gender: '',
      phone: '',
      email: '',
      province: '',
      district: '',
      village: '',
    });
    setHouseholdData({
      householdSize: '',
      dependents: '',
      monthlyIncome: '',
      hasElectricity: '',
      hasRunningWater: '',
      housingType: '',
      hasSavings: '',
      hasFoodSecurity: ''
    });
    setCurrentStep(0);
    setVulnerabilityScore(null);
    setGpsData(null);
    setErrors({});
  };

  // Rendu des différentes étapes
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Identité
        return (
          <View>
            <Title style={styles.stepTitle}>👤 Informations Identité</Title>
            
            <TextInput
              label="Prénom *"
              value={personData.firstName}
              onChangeText={(value) => {
                setPersonData(prev => ({ ...prev, firstName: value }));
                validateField('firstName', value);
              }}
              error={errors.firstName}
              style={styles.input}
              mode="outlined"
            />
            <HelperText type="error" visible={errors.firstName}>
              {errors.firstName}
            </HelperText>

            <TextInput
              label="Nom de famille *"
              value={personData.lastName}
              onChangeText={(value) => {
                setPersonData(prev => ({ ...prev, lastName: value }));
                validateField('lastName', value);
              }}
              error={errors.lastName}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="NIP (Numéro d'Identification Personnelle) *"
              value={personData.nip}
              onChangeText={(value) => {
                setPersonData(prev => ({ ...prev, nip: value }));
                validateField('nip', value);
              }}
              error={errors.nip}
              keyboardType="numeric"
              maxLength={10}
              style={styles.input}
              mode="outlined"
              placeholder="1234567890"
            />
            <HelperText type="error" visible={errors.nip}>
              {errors.nip}
            </HelperText>

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.input}
              icon="calendar"
            >
              Date de naissance: {format(personData.birthDate, 'dd/MM/yyyy', { locale: fr })}
            </Button>

            <DatePicker
              modal
              open={showDatePicker}
              date={personData.birthDate}
              mode="date"
              maximumDate={new Date()}
              minimumDate={new Date('1900-01-01')}
              onConfirm={(date) => {
                setShowDatePicker(false);
                setPersonData(prev => ({ ...prev, birthDate: date }));
                validateField('birthDate', date);
              }}
              onCancel={() => setShowDatePicker(false)}
              title="Sélectionner date de naissance"
              confirmText="Confirmer"
              cancelText="Annuler"
            />

            <Title style={styles.sectionTitle}>Genre *</Title>
            <RadioButton.Group
              onValueChange={(value) => setPersonData(prev => ({ ...prev, gender: value }))}
              value={personData.gender}
            >
              <View style={styles.radioRow}>
                <View style={styles.radioItem}>
                  <RadioButton value="M" />
                  <Paragraph>Masculin</Paragraph>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="F" />
                  <Paragraph>Féminin</Paragraph>
                </View>
              </View>
            </RadioButton.Group>

            <TextInput
              label="Téléphone *"
              value={personData.phone}
              onChangeText={(value) => {
                setPersonData(prev => ({ ...prev, phone: value }));
                validateField('phone', value);
              }}
              error={errors.phone}
              keyboardType="phone-pad"
              style={styles.input}
              mode="outlined"
              placeholder="+241 01 23 45 67"
            />
            <HelperText type="error" visible={errors.phone}>
              {errors.phone}
            </HelperText>
          </View>
        );

      case 1: // Localisation
        return (
          <View>
            <Title style={styles.stepTitle}>📍 Localisation</Title>
            
            <Title style={styles.sectionTitle}>Province *</Title>
            <View style={styles.chipContainer}>
              {Object.entries(GABON_PROVINCES).map(([code, data]) => (
                <Chip
                  key={code}
                  selected={personData.province === code}
                  onPress={() => setPersonData(prev => ({ ...prev, province: code }))}
                  style={styles.chip}
                  mode={personData.province === code ? 'flat' : 'outlined'}
                >
                  {data.name}
                </Chip>
              ))}
            </View>

            <TextInput
              label="District/Département"
              value={personData.district}
              onChangeText={(value) => setPersonData(prev => ({ ...prev, district: value }))}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Village/Quartier"
              value={personData.village}
              onChangeText={(value) => setPersonData(prev => ({ ...prev, village: value }))}
              style={styles.input}
              mode="outlined"
            />

            <Divider style={styles.divider} />

            <Title style={styles.sectionTitle}>🗺️ Coordonnées GPS</Title>
            {gpsData ? (
              <Card style={styles.gpsCard}>
                <Card.Content>
                  <Paragraph>✅ Position capturée</Paragraph>
                  <Paragraph>📍 Lat: {gpsData.latitude.toFixed(6)}</Paragraph>
                  <Paragraph>📍 Lon: {gpsData.longitude.toFixed(6)}</Paragraph>
                  <Paragraph>🎯 Précision: {gpsData.accuracy}m</Paragraph>
                </Card.Content>
              </Card>
            ) : (
              <Button
                mode="contained"
                onPress={captureGPS}
                loading={gpsLoading}
                disabled={gpsLoading}
                style={styles.gpsButton}
                icon="crosshairs-gps"
              >
                {gpsLoading ? 'Capture GPS...' : 'Capturer Position GPS'}
              </Button>
            )}
          </View>
        );

      case 2: // Socio-économique
        return (
          <View>
            <Title style={styles.stepTitle}>💰 Informations Socio-Économiques</Title>
            
            <Title style={styles.sectionTitle}>Niveau d'éducation *</Title>
            <RadioButton.Group
              onValueChange={(value) => setPersonData(prev => ({ ...prev, educationLevel: value }))}
              value={personData.educationLevel}
            >
              {[
                { value: 'NONE', label: 'Aucune' },
                { value: 'PRIMARY', label: 'Primaire' },
                { value: 'SECONDARY', label: 'Secondaire' },
                { value: 'HIGH_SCHOOL', label: 'Baccalauréat' },
                { value: 'UNIVERSITY', label: 'Universitaire' },
              ].map(item => (
                <View key={item.value} style={styles.radioRow}>
                  <RadioButton value={item.value} />
                  <Paragraph>{item.label}</Paragraph>
                </View>
              ))}
            </RadioButton.Group>

            <Title style={styles.sectionTitle}>Statut professionnel *</Title>
            <RadioButton.Group
              onValueChange={(value) => setPersonData(prev => ({ ...prev, occupationStatus: value }))}
              value={personData.occupationStatus}
            >
              {[
                { value: 'UNEMPLOYED', label: 'Sans emploi' },
                { value: 'INFORMAL', label: 'Secteur informel' },
                { value: 'FORMAL_PRIVATE', label: 'Salarié privé' },
                { value: 'PUBLIC_SERVANT', label: 'Fonctionnaire' },
                { value: 'SELF_EMPLOYED', label: 'Entrepreneur' },
                { value: 'RETIRED', label: 'Retraité' },
                { value: 'STUDENT', label: 'Étudiant' },
              ].map(item => (
                <View key={item.value} style={styles.radioRow}>
                  <RadioButton value={item.value} />
                  <Paragraph>{item.label}</Paragraph>
                </View>
              ))}
            </RadioButton.Group>

            <TextInput
              label="Revenu mensuel (FCFA) *"
              value={personData.monthlyIncome}
              onChangeText={(value) => setPersonData(prev => ({ ...prev, monthlyIncome: value }))}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              placeholder="150000"
            />
          </View>
        );

      case 3: // Ménage
        return (
          <View>
            <Title style={styles.stepTitle}>🏠 Composition du Ménage</Title>
            
            <TextInput
              label="Taille du ménage *"
              value={householdData.householdSize}
              onChangeText={(value) => setHouseholdData(prev => ({ ...prev, householdSize: value }))}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              placeholder="4"
            />

            <TextInput
              label="Nombre de personnes à charge"
              value={householdData.dependents}
              onChangeText={(value) => setHouseholdData(prev => ({ ...prev, dependents: value }))}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              placeholder="2"
            />

            <TextInput
              label="Revenu total ménage (FCFA)"
              value={householdData.monthlyIncome}
              onChangeText={(value) => setHouseholdData(prev => ({ ...prev, monthlyIncome: value }))}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              placeholder="300000"
            />

            <Title style={styles.sectionTitle}>Conditions de vie</Title>
            
            <Paragraph>Électricité dans le logement ?</Paragraph>
            <RadioButton.Group
              onValueChange={(value) => setHouseholdData(prev => ({ ...prev, hasElectricity: value }))}
              value={householdData.hasElectricity}
            >
              <View style={styles.radioRow}>
                <View style={styles.radioItem}>
                  <RadioButton value="yes" />
                  <Paragraph>Oui</Paragraph>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="no" />
                  <Paragraph>Non</Paragraph>
                </View>
              </View>
            </RadioButton.Group>

            <Paragraph>Eau courante ?</Paragraph>
            <RadioButton.Group
              onValueChange={(value) => setHouseholdData(prev => ({ ...prev, hasRunningWater: value }))}
              value={householdData.hasRunningWater}
            >
              <View style={styles.radioRow}>
                <View style={styles.radioItem}>
                  <RadioButton value="yes" />
                  <Paragraph>Oui</Paragraph>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="no" />
                  <Paragraph>Non</Paragraph>
                </View>
              </View>
            </RadioButton.Group>

            <Title style={styles.sectionTitle}>Type de logement</Title>
            <RadioButton.Group
              onValueChange={(value) => setHouseholdData(prev => ({ ...prev, housingType: value }))}
              value={householdData.housingType}
            >
              {[
                { value: 'OWNED_MODERN', label: 'Propriétaire - moderne' },
                { value: 'OWNED_TRADITIONAL', label: 'Propriétaire - traditionnel' },
                { value: 'RENTED', label: 'Locataire' },
                { value: 'SHARED', label: 'Logé gratuitement' },
                { value: 'PRECARIOUS', label: 'Habitat précaire' },
              ].map(item => (
                <View key={item.value} style={styles.radioRow}>
                  <RadioButton value={item.value} />
                  <Paragraph>{item.label}</Paragraph>
                </View>
              ))}
            </RadioButton.Group>
          </View>
        );

      case 4: // Vulnérabilité
        return (
          <View>
            <Title style={styles.stepTitle}>🛡️ Évaluation Vulnérabilité</Title>
            
            {vulnerabilityScore && (
              <Card style={[
                styles.scoreCard,
                { backgroundColor: vulnerabilityScore.level === 'CRITICAL' ? '#FFEBEE' : 
                                   vulnerabilityScore.level === 'HIGH' ? '#FFF3E0' :
                                   vulnerabilityScore.level === 'MODERATE' ? '#E8F5E8' : '#F3E5F5' }
              ]}>
                <Card.Content>
                  <Title style={styles.scoreTitle}>
                    Score de Vulnérabilité: {vulnerabilityScore.score}/100
                  </Title>
                  <Paragraph style={styles.scoreLevel}>
                    Niveau: {vulnerabilityScore.levelLabel}
                  </Paragraph>
                  
                  <Divider style={styles.scoreDivider} />
                  
                  <Title style={styles.dimensionsTitle}>Détail par dimension:</Title>
                  {Object.entries(vulnerabilityScore.dimensions).map(([key, value]) => (
                    <View key={key} style={styles.dimensionRow}>
                      <Paragraph>{key}: {value.toFixed(1)}/100</Paragraph>
                      <ProgressBar 
                        progress={value / 100} 
                        style={styles.progressBar}
                        color={value > 70 ? '#F44336' : value > 50 ? '#FF9800' : '#4CAF50'}
                      />
                    </View>
                  ))}
                  
                  {vulnerabilityScore.factors.length > 0 && (
                    <View style={styles.factorsSection}>
                      <Title style={styles.factorsTitle}>Facteurs identifiés:</Title>
                      <View style={styles.chipContainer}>
                        {vulnerabilityScore.factors.map((factor, index) => (
                          <Chip 
                            key={index} 
                            mode="outlined"
                            style={styles.factorChip}
                          >
                            {factor}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  )}
                </Card.Content>
              </Card>
            )}

            <Paragraph style={styles.vulnerabilityNote}>
              💡 Ce score est calculé automatiquement selon les critères du RSU Gabon.
              Il détermine l'éligibilité aux programmes sociaux gouvernementaux.
            </Paragraph>
          </View>
        );

      case 5: // Validation
        return (
          <View>
            <Title style={styles.stepTitle}>✅ Validation et Soumission</Title>
            
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Title>Résumé de l'inscription</Title>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Nom complet:</Paragraph>
                  <Paragraph style={styles.summaryValue}>
                    {personData.firstName} {personData.lastName}
                  </Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>NIP:</Paragraph>
                  <Paragraph style={styles.summaryValue}>{personData.nip}</Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Province:</Paragraph>
                  <Paragraph style={styles.summaryValue}>
                    {GABON_PROVINCES[personData.province]?.name || personData.province}
                  </Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Téléphone:</Paragraph>
                  <Paragraph style={styles.summaryValue}>{personData.phone}</Paragraph>
                </View>
                
                {vulnerabilityScore && (
                  <View style={styles.summaryRow}>
                    <Paragraph style={styles.summaryLabel}>Score vulnérabilité:</Paragraph>
                    <Paragraph style={[
                      styles.summaryValue,
                      { color: vulnerabilityScore.level === 'CRITICAL' ? '#F44336' : 
                               vulnerabilityScore.level === 'HIGH' ? '#FF9800' : '#4CAF50' }
                    ]}>
                      {vulnerabilityScore.score}/100 ({vulnerabilityScore.levelLabel})
                    </Paragraph>
                  </View>
                )}
                
                {gpsData && (
                  <View style={styles.summaryRow}>
                    <Paragraph style={styles.summaryLabel}>GPS:</Paragraph>
                    <Paragraph style={styles.summaryValue}>
                      ✅ Coordonnées capturées
                    </Paragraph>
                  </View>
                )}
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              icon="check-circle"
            >
              {isSubmitting ? 'Soumission en cours...' : 'Soumettre Inscription'}
            </Button>

            <Paragraph style={styles.submitNote}>
              ⚠️ Une fois soumise, cette inscription sera synchronisée avec le serveur RSU central.
            </Paragraph>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* En-tête avec progression */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>
          {FORM_STEPS[currentStep].title}
        </Title>
        <ProgressBar 
          progress={(currentStep + 1) / FORM_STEPS.length} 
          style={styles.progressBar}
          color="#2E7D32"
        />
        <Paragraph style={styles.progressText}>
          Étape {currentStep + 1} sur {FORM_STEPS.length}
        </Paragraph>
      </View>

      {/* Contenu du formulaire */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <Button
          mode="outlined"
          onPress={prevStep}
          disabled={currentStep === 0}
          style={styles.navButton}
        >
          Précédent
        </Button>
        
        {currentStep < FORM_STEPS.length - 1 ? (
          <Button
            mode="contained"
            onPress={nextStep}
            style={styles.navButton}
          >
            Suivant
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  divider: {
    marginVertical: 20,
  },
  gpsCard: {
    marginVertical: 10,
    backgroundColor: '#E8F5E8',
  },
  gpsButton: {
    marginVertical: 10,
  },
  scoreCard: {
    marginVertical: 16,
    elevation: 4,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreLevel: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreDivider: {
    marginVertical: 12,
  },
  dimensionsTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  dimensionRow: {
    marginBottom: 8,
  },
  factorsSection: {
    marginTop: 16,
  },
  factorsTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  factorChip: {
    margin: 2,
  },
  vulnerabilityNote: {
    fontStyle: 'italic',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontWeight: 'bold',
    flex: 1,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
  },
  submitButton: {
    marginVertical: 10,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  navigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 8,
  },
  navButton: {
    flex: 0.45,
  },
});// Formulaire 6 �tapes + scoring IA 
