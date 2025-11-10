
// =============================================================================
// 2. SurveyFormScreen.jsx - NOUVEAU FICHIER  
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
  TextInput,
  RadioButton,
  Checkbox,
  ProgressBar,
  Chip,
  List,
  Divider,
} from 'react-native-paper';

import apiClient from '../../services/api/apiClient';
import validationService from '../../services/validation/validationService';

const SURVEY_TEMPLATES = {
  vulnerability_assessment: {
    title: 'Évaluation de vulnérabilité',
    description: 'Enquête complète sur la situation socio-économique',
    sections: [
      {
        title: 'Situation économique',
        questions: [
          { id: 'income_monthly', type: 'number', label: 'Revenus mensuels (FCFA)', required: true },
          { id: 'employment_status', type: 'radio', label: 'Statut emploi', options: ['Employé', 'Chômeur', 'Indépendant', 'Retraité'], required: true },
          { id: 'household_size', type: 'number', label: 'Taille du ménage', required: true },
        ]
      },
      {
        title: 'Conditions de logement',
        questions: [
          { id: 'housing_type', type: 'radio', label: 'Type de logement', options: ['Maison', 'Appartement', 'Chambre', 'Autre'], required: true },
          { id: 'water_access', type: 'radio', label: 'Accès à l\'eau', options: ['Robinet', 'Puits', 'Rivière', 'Autre'], required: true },
          { id: 'electricity_access', type: 'checkbox', label: 'Accès électricité', required: false },
        ]
      },
      {
        title: 'Santé et éducation',
        questions: [
          { id: 'health_issues', type: 'checkbox', label: 'Problèmes de santé chroniques', required: false },
          { id: 'education_level', type: 'radio', label: 'Niveau d\'éducation', options: ['Aucun', 'Primaire', 'Secondaire', 'Supérieur'], required: true },
          { id: 'children_school', type: 'number', label: 'Enfants scolarisés', required: false },
        ]
      }
    ]
  },
  basic_registration: {
    title: 'Inscription de base',
    description: 'Collecte des informations essentielles',
    sections: [
      {
        title: 'Informations de base',
        questions: [
          { id: 'confirm_identity', type: 'checkbox', label: 'Confirmer identité', required: true },
          { id: 'contact_preferred', type: 'radio', label: 'Contact préféré', options: ['Téléphone', 'SMS', 'Email', 'Visite'], required: true },
          { id: 'emergency_contact', type: 'text', label: 'Contact d\'urgence', required: false },
        ]
      }
    ]
  },
  program_eligibility: {
    title: 'Éligibilité aux programmes',
    description: 'Évaluation pour les programmes sociaux',
    sections: [
      {
        title: 'Critères d\'éligibilité',
        questions: [
          { id: 'disability_status', type: 'checkbox', label: 'Situation de handicap', required: false },
          { id: 'pregnant_women', type: 'number', label: 'Femmes enceintes dans le ménage', required: false },
          { id: 'elderly_count', type: 'number', label: 'Personnes âgées (65+)', required: false },
          { id: 'children_under5', type: 'number', label: 'Enfants de moins de 5 ans', required: false },
        ]
      }
    ]
  }
};

export default function SurveyFormScreen({ route, navigation }) {
  const { personId, surveyType = 'vulnerability_assessment' } = route.params || {};
  const [selectedTemplate, setSelectedTemplate] = useState(surveyType);
  const [responses, setResponses] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [person, setPerson] = useState(null);

  const template = SURVEY_TEMPLATES[selectedTemplate];
  const totalSections = template?.sections?.length || 0;
  const progress = totalSections > 0 ? (currentSection + 1) / totalSections : 0;

  useEffect(() => {
    if (personId) {
      loadPersonData();
    }
  }, [personId]);

  const loadPersonData = async () => {
    try {
      const response = await apiClient.get(`/identity/persons/${personId}/`);
      setPerson(response.data);
    } catch (error) {
      console.error('Erreur chargement personne:', error);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateCurrentSection = () => {
    const currentSectionData = template.sections[currentSection];
    const requiredQuestions = currentSectionData.questions.filter(q => q.required);
    
    for (const question of requiredQuestions) {
      if (!responses[question.id]) {
        Alert.alert('Champ requis', `Le champ "${question.label}" est obligatoire`);
        return false;
      }
    }
    return true;
  };

  const handleNextSection = () => {
    if (validateCurrentSection()) {
      if (currentSection < totalSections - 1) {
        setCurrentSection(currentSection + 1);
      } else {
        handleSubmitSurvey();
      }
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmitSurvey = async () => {
    try {
      setLoading(true);

      const surveyData = {
        person_id: personId,
        survey_type: selectedTemplate,
        responses: responses,
        completed_at: new Date().toISOString(),
      };

      await apiClient.post('/surveys/responses/', surveyData);
      
      Alert.alert(
        'Enquête terminée',
        'L\'enquête a été sauvegardée avec succès',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Erreur sauvegarde enquête:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'enquête');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (question) => {
    const value = responses[question.id];

    switch (question.type) {
      case 'text':
        return (
          <TextInput
            mode="outlined"
            label={question.label + (question.required ? ' *' : '')}
            value={value || ''}
            onChangeText={(text) => handleResponseChange(question.id, text)}
            style={styles.input}
          />
        );

      case 'number':
        return (
          <TextInput
            mode="outlined"
            label={question.label + (question.required ? ' *' : '')}
            value={value?.toString() || ''}
            onChangeText={(text) => handleResponseChange(question.id, parseInt(text) || 0)}
            keyboardType="numeric"
            style={styles.input}
          />
        );

      case 'radio':
        return (
          <View style={styles.radioGroup}>
            <Paragraph style={styles.questionLabel}>
              {question.label + (question.required ? ' *' : '')}
            </Paragraph>
            <RadioButton.Group
              onValueChange={(value) => handleResponseChange(question.id, value)}
              value={value || ''}
            >
              {question.options.map((option, index) => (
                <RadioButton.Item
                  key={index}
                  label={option}
                  value={option}
                  style={styles.radioItem}
                />
              ))}
            </RadioButton.Group>
          </View>
        );

      case 'checkbox':
        return (
          <View style={styles.checkboxContainer}>
            <Checkbox.Item
              label={question.label + (question.required ? ' *' : '')}
              status={value ? 'checked' : 'unchecked'}
              onPress={() => handleResponseChange(question.id, !value)}
            />
          </View>
        );

      default:
        return null;
    }
  };

  if (!template) {
    return (
      <View style={styles.errorContainer}>
        <Paragraph>Template d'enquête non trouvé</Paragraph>
        <Button onPress={() => navigation.goBack()}>Retour</Button>
      </View>
    );
  }

  const currentSectionData = template.sections[currentSection];

  return (
    <View style={styles.container}>
      {/* Header avec progression */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Title style={styles.surveyTitle}>{template.title}</Title>
            {person && (
              <Paragraph style={styles.personInfo}>
                Pour: {person.first_name} {person.last_name}
              </Paragraph>
            )}
          </View>
          <View style={styles.progressContainer}>
            <Paragraph style={styles.progressText}>
              Section {currentSection + 1} sur {totalSections}
            </Paragraph>
            <ProgressBar progress={progress} color="#2E7D32" style={styles.progressBar} />
          </View>
        </Card.Content>
      </Card>

      {/* Section actuelle */}
      <ScrollView style={styles.contentContainer}>
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>{currentSectionData.title}</Title>
            
            {currentSectionData.questions.map((question, index) => (
              <View key={question.id} style={styles.questionContainer}>
                {renderQuestion(question)}
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Boutons navigation */}
      <Card style={styles.navigationCard}>
        <Card.Content>
          <View style={styles.navigationButtons}>
            <Button
              mode="outlined"
              onPress={handlePreviousSection}
              disabled={currentSection === 0}
              style={styles.navButton}
            >
              Précédent
            </Button>
            
            <Button
              mode="contained"
              onPress={handleNextSection}
              loading={loading}
              disabled={loading}
              style={styles.navButton}
            >
              {currentSection === totalSections - 1 ? 'Terminer' : 'Suivant'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const surveyStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 4,
  },
  headerContent: {
    marginBottom: 12,
  },
  surveyTitle: {
    fontSize: 20,
    color: '#2E7D32',
  },
  personInfo: {
    color: '#666',
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionCard: {
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#2E7D32',
  },
  questionContainer: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  questionLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  radioGroup: {
    marginBottom: 8,
  },
  radioItem: {
    paddingVertical: 4,
  },
  checkboxContainer: {
    marginBottom: 8,
  },
  navigationCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
});
