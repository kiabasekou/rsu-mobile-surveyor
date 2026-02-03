/**
 * =============================================================================
 * 🇬🇦 RSU GABON - FORM WIZARD COMPONENT
 * Standards Top 1% - Wizard Multi-Étapes
 * =============================================================================
 * 
 * Composant réutilisable pour formulaires en plusieurs étapes.
 * Gestion automatique de la navigation, validation, et progression.
 * 
 * Fonctionnalités:
 * - Navigation étapes fluide
 * - Validation par étape
 * - Sauvegarde progressive
 * - Indicateur de progression
 * - Boutons Précédent/Suivant intelligents
 * 
 * Utilisation:
 * <FormWizard
 *   steps={[
 *     { label: 'Étape 1', component: Step1Component, validate: validateStep1 },
 *     { label: 'Étape 2', component: Step2Component, validate: validateStep2 },
 *   ]}
 *   onComplete={(data) => console.log('Données finales:', data)}
 *   onStepChange={(step) => console.log('Changement vers étape:', step)}
 * />
 * 
 * Fichier: src/components/forms/FormWizard.jsx
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ProgressBar,
  Divider,
  IconButton,
  Surface,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * =============================================================================
 * COMPOSANT PRINCIPAL
 * =============================================================================
 */
export default function FormWizard({
  steps = [],
  initialData = {},
  onComplete,
  onStepChange,
  onCancel,
  autoSave = true,
  showStepIndicator = true,
  allowBackNavigation = true,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [stepValidation, setStepValidation] = useState({});
  const [loading, setLoading] = useState(false);

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const currentStepConfig = steps[currentStep];

  useEffect(() => {
    // Callback de changement d'étape
    if (onStepChange) {
      onStepChange(currentStep);
    }

    // Sauvegarde automatique
    if (autoSave && currentStep > 0) {
      saveProgress();
    }
  }, [currentStep]);

  /**
   * ==========================================================================
   * NAVIGATION ÉTAPES
   * ==========================================================================
   */

  /**
   * Avance à l'étape suivante
   */
  const goToNextStep = async () => {
    // Valider l'étape actuelle
    const isValid = await validateCurrentStep();
    
    if (!isValid) {
      Alert.alert(
        'Validation Échouée',
        'Veuillez corriger les erreurs avant de continuer.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Dernier étape: soumission finale
    if (isLastStep) {
      await handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Retourne à l'étape précédente
   */
  const goToPreviousStep = () => {
    if (!isFirstStep && allowBackNavigation) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Saute à une étape spécifique
   */
  const jumpToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStep(stepIndex);
    }
  };

  /**
   * ==========================================================================
   * VALIDATION
   * ==========================================================================
   */

  /**
   * Valide l'étape actuelle
   */
  const validateCurrentStep = async () => {
    const validateFn = currentStepConfig.validate;

    if (!validateFn) {
      // Pas de validation définie, considérer comme valide
      return true;
    }

    try {
      setLoading(true);

      // Appeler la fonction de validation
      const result = await validateFn(formData);

      // Résultat peut être boolean ou { valid: boolean, errors: {} }
      if (typeof result === 'boolean') {
        setStepValidation({
          ...stepValidation,
          [currentStep]: { valid: result },
        });
        return result;
      } else {
        setStepValidation({
          ...stepValidation,
          [currentStep]: result,
        });
        return result.valid;
      }
    } catch (error) {
      console.error('Erreur validation étape:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * ==========================================================================
   * GESTION DONNÉES
   * ==========================================================================
   */

  /**
   * Met à jour les données du formulaire
   */
  const updateFormData = (stepData) => {
    setFormData({
      ...formData,
      ...stepData,
    });
  };

  /**
   * Sauvegarde la progression
   */
  const saveProgress = async () => {
    try {
      // TODO: Implémenter sauvegarde locale (AsyncStorage)
      console.log('📦 Progression sauvegardée:', {
        step: currentStep,
        data: formData,
      });
    } catch (error) {
      console.error('Erreur sauvegarde progression:', error);
    }
  };

  /**
   * ==========================================================================
   * SOUMISSION FINALE
   * ==========================================================================
   */

  /**
   * Gère la soumission finale du formulaire
   */
  const handleComplete = async () => {
    try {
      setLoading(true);

      // Valider toutes les étapes une dernière fois
      const allValid = await validateAllSteps();

      if (!allValid) {
        Alert.alert(
          'Formulaire Incomplet',
          'Certaines étapes contiennent des erreurs. Veuillez les corriger.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Callback de complétion
      if (onComplete) {
        await onComplete(formData);
      }

      Alert.alert(
        'Succès',
        'Formulaire soumis avec succès',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la soumission',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Valide toutes les étapes
   */
  const validateAllSteps = async () => {
    for (let i = 0; i < totalSteps; i++) {
      const stepConfig = steps[i];
      if (stepConfig.validate) {
        const result = await stepConfig.validate(formData);
        const isValid = typeof result === 'boolean' ? result : result.valid;
        
        if (!isValid) {
          return false;
        }
      }
    }
    return true;
  };

  /**
   * ==========================================================================
   * ANNULATION
   * ==========================================================================
   */

  /**
   * Gère l'annulation du formulaire
   */
  const handleCancel = () => {
    Alert.alert(
      'Confirmer Annulation',
      'Êtes-vous sûr de vouloir annuler ? Les données non sauvegardées seront perdues.',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Annuler',
          style: 'destructive',
          onPress: () => {
            if (onCancel) {
              onCancel();
            }
          },
        },
      ]
    );
  };

  /**
   * ==========================================================================
   * RENDU INDICATEUR ÉTAPES
   * ==========================================================================
   */

  const renderStepIndicator = () => {
    if (!showStepIndicator) return null;

    return (
      <Surface style={styles.stepIndicatorContainer}>
        <View style={styles.stepIndicator}>
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isValid = stepValidation[index]?.valid === true;

            return (
              <View key={index} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isActive && styles.stepCircleActive,
                    isCompleted && styles.stepCircleCompleted,
                  ]}
                >
                  {isCompleted ? (
                    <MaterialIcons name="check" size={20} color="#FFF" />
                  ) : (
                    <Paragraph style={styles.stepNumber}>{index + 1}</Paragraph>
                  )}
                </View>
                <Paragraph style={styles.stepLabel}>{step.label}</Paragraph>
                
                {index < totalSteps - 1 && (
                  <View
                    style={[
                      styles.stepConnector,
                      isCompleted && styles.stepConnectorCompleted,
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      </Surface>
    );
  };

  /**
   * ==========================================================================
   * RENDU BARRE DE PROGRESSION
   * ==========================================================================
   */

  const renderProgressBar = () => {
    const progress = (currentStep + 1) / totalSteps;

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressInfo}>
          <Paragraph>
            Étape {currentStep + 1} sur {totalSteps}
          </Paragraph>
          <Paragraph>{Math.round(progress * 100)}%</Paragraph>
        </View>
        <ProgressBar progress={progress} style={styles.progressBar} />
      </View>
    );
  };

  /**
   * ==========================================================================
   * RENDU CONTENU ÉTAPE
   * ==========================================================================
   */

  const renderStepContent = () => {
    const StepComponent = currentStepConfig.component;

    if (!StepComponent) {
      return (
        <View style={styles.errorContainer}>
          <Paragraph>Erreur: Composant d'étape non défini</Paragraph>
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <StepComponent
          data={formData}
          onDataChange={updateFormData}
          validation={stepValidation[currentStep]}
        />
      </View>
    );
  };

  /**
   * ==========================================================================
   * RENDU BOUTONS NAVIGATION
   * ==========================================================================
   */

  const renderNavigationButtons = () => {
    return (
      <View style={styles.navigationButtons}>
        {/* Bouton Annuler */}
        <Button
          mode="text"
          onPress={handleCancel}
          disabled={loading}
          style={styles.cancelButton}
        >
          Annuler
        </Button>

        <View style={styles.navigationButtonsRight}>
          {/* Bouton Précédent */}
          {!isFirstStep && allowBackNavigation && (
            <Button
              mode="outlined"
              onPress={goToPreviousStep}
              disabled={loading}
              icon="arrow-left"
              style={styles.navButton}
            >
              Précédent
            </Button>
          )}

          {/* Bouton Suivant / Soumettre */}
          <Button
            mode="contained"
            onPress={goToNextStep}
            loading={loading}
            disabled={loading}
            icon={isLastStep ? 'check' : 'arrow-right'}
            style={styles.navButton}
          >
            {isLastStep ? 'Soumettre' : 'Suivant'}
          </Button>
        </View>
      </View>
    );
  };

  /**
   * ==========================================================================
   * RENDU PRINCIPAL
   * ==========================================================================
   */

  return (
    <View style={styles.container}>
      {/* Indicateur d'étapes */}
      {renderStepIndicator()}

      {/* Barre de progression */}
      {renderProgressBar()}

      {/* Contenu scrollable */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{currentStepConfig.label}</Title>
            {currentStepConfig.description && (
              <Paragraph style={styles.description}>{currentStepConfig.description}</Paragraph>
            )}
            <Divider style={styles.divider} />
            {renderStepContent()}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Boutons de navigation */}
      {renderNavigationButtons()}
    </View>
  );
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
  stepIndicatorContainer: {
    elevation: 4,
    padding: 16,
    backgroundColor: '#FFF',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#2196F3',
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepNumber: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  stepConnector: {
    position: 'absolute',
    top: 20,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E0E0E0',
  },
  stepConnectorCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressBarContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  stepContent: {
    minHeight: 200,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    marginRight: 8,
  },
  navigationButtonsRight: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  navButton: {
    marginLeft: 8,
  },
});
