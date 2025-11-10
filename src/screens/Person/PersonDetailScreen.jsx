
// =============================================================================
// 1. PersonDetailScreen.jsx - NOUVEAU FICHIER
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
  Chip,
  List,
  Divider,
  Text,
  IconButton,
} from 'react-native-paper';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import apiClient from '../../services/api/apiClient';
import scoringService from '../../services/scoring/scoringService';

export default function PersonDetailScreen({ route, navigation }) {
  const { personId } = route.params || {};
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vulnerabilityScore, setVulnerabilityScore] = useState(null);

  useEffect(() => {
    if (personId) {
      loadPersonDetails();
    } else {
      setLoading(false);
    }
  }, [personId]);

  const loadPersonDetails = async () => {
    try {
      // Charger détails personne
      const response = await apiClient.get(`/identity/persons/${personId}/`);
      setPerson(response.data);

      // Calculer score vulnérabilité
      const score = await scoringService.calculateVulnerabilityScore(response.data);
      setVulnerabilityScore(score);

    } catch (error) {
      console.error('Erreur chargement personne:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la personne');
    } finally {
      setLoading(false);
    }
  };

  const getVulnerabilityColor = (score) => {
    if (score >= 80) return '#F44336'; // Rouge - Très vulnérable
    if (score >= 60) return '#FF9800'; // Orange - Vulnérable  
    if (score >= 40) return '#FFC107'; // Jaune - Modéré
    return '#4CAF50'; // Vert - Faible vulnérabilité
  };

  const handleEdit = () => {
    navigation.navigate('Enrollment', { 
      mode: 'edit', 
      personId: person.id,
      personData: person 
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement des détails...</Text>
      </View>
    );
  }

  if (!person) {
    return (
      <View style={styles.errorContainer}>
        <Text>Personne non trouvée</Text>
        <Button onPress={() => navigation.goBack()}>
          Retour
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header avec photo et nom */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text 
            size={80} 
            label={`${person.first_name?.[0] || ''}${person.last_name?.[0] || ''}`}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <Title style={styles.name}>
              {person.first_name} {person.last_name}
            </Title>
            <Paragraph style={styles.subtitle}>
              NIP: {person.nip || 'Non renseigné'}
            </Paragraph>
            {vulnerabilityScore && (
              <Chip 
                icon="alert-circle"
                style={[
                  styles.vulnerabilityChip,
                  { backgroundColor: getVulnerabilityColor(vulnerabilityScore.total_score) }
                ]}
                textStyle={{ color: '#fff' }}
              >
                Vulnérabilité: {vulnerabilityScore.total_score}%
              </Chip>
            )}
          </View>
          <IconButton
            icon="pencil"
            size={24}
            onPress={handleEdit}
            style={styles.editButton}
          />
        </Card.Content>
      </Card>

      {/* Informations personnelles */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Informations personnelles</Title>
          <List.Item
            title="Date de naissance"
            description={person.birth_date ? 
              format(new Date(person.birth_date), 'dd MMMM yyyy', { locale: fr }) : 
              'Non renseignée'
            }
            left={props => <List.Icon {...props} icon="calendar" />}
          />
          <Divider />
          <List.Item
            title="Genre"
            description={person.gender === 'M' ? 'Masculin' : person.gender === 'F' ? 'Féminin' : 'Non spécifié'}
            left={props => <List.Icon {...props} icon="account" />}
          />
          <Divider />
          <List.Item
            title="Téléphone"
            description={person.phone || 'Non renseigné'}
            left={props => <List.Icon {...props} icon="phone" />}
          />
          <Divider />
          <List.Item
            title="Email"
            description={person.email || 'Non renseigné'}
            left={props => <List.Icon {...props} icon="email" />}
          />
        </Card.Content>
      </Card>

      {/* Localisation */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Localisation</Title>
          <List.Item
            title="Province"
            description={person.province || 'Non renseignée'}
            left={props => <List.Icon {...props} icon="map" />}
          />
          <Divider />
          <List.Item
            title="Ville"
            description={person.city || 'Non renseignée'}
            left={props => <List.Icon {...props} icon="city" />}
          />
          <Divider />
          <List.Item
            title="Adresse"
            description={person.address || 'Non renseignée'}
            left={props => <List.Icon {...props} icon="home" />}
          />
        </Card.Content>
      </Card>

      {/* Score de vulnérabilité détaillé */}
      {vulnerabilityScore && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Évaluation de vulnérabilité</Title>
            <View style={styles.scoreDetails}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Économique</Text>
                <Chip style={styles.scoreChip}>
                  {vulnerabilityScore.economic_score}%
                </Chip>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Social</Text>
                <Chip style={styles.scoreChip}>
                  {vulnerabilityScore.social_score}%
                </Chip>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Géographique</Text>
                <Chip style={styles.scoreChip}>
                  {vulnerabilityScore.geographic_score}%
                </Chip>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Santé</Text>
                <Chip style={styles.scoreChip}>
                  {vulnerabilityScore.health_score}%
                </Chip>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Éducation</Text>
                <Chip style={styles.scoreChip}>
                  {vulnerabilityScore.education_score}%
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Actions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Actions</Title>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handleEdit}
              style={styles.actionButton}
              icon="pencil"
            >
              Modifier
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Survey', { personId: person.id })}
              style={styles.actionButton}
              icon="assignment"
            >
              Nouvelle enquête
            </Button>
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#2E7D32',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    marginBottom: 8,
  },
  vulnerabilityChip: {
    alignSelf: 'flex-start',
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#2E7D32',
  },
  scoreDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minWidth: '45%',
  },
  scoreLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#666',
  },
  scoreChip: {
    backgroundColor: '#E8F5E8',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  bottomPadding: {
    height: 20,
  },
});