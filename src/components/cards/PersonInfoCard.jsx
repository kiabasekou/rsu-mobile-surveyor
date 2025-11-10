
// =============================================================================
// B. PERSON INFO CARD (components/cards/PersonInfoCard.jsx)
// =============================================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  ProgressBar,
  Avatar,
  Chip,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


export const PersonInfoCard = ({
  person,
  onPress,
  showDetails = true,
  actions = [],
}) => {
  return (
    <Card style={styles.personCard} onPress={onPress}>
      <Card.Content>
        <View style={styles.personHeader}>
          <Avatar.Text
            size={60}
            label={`${person.first_name[0]}${person.last_name[0]}`}
            style={styles.personAvatar}
          />
          <View style={styles.personInfo}>
            <Title style={styles.personName}>
              {person.first_name} {person.last_name}
            </Title>
            <Paragraph style={styles.personDetails}>
              {person.rsu_id && `RSU-ID: ${person.rsu_id}`}
            </Paragraph>
            <Paragraph style={styles.personDetails}>
              NIP: {person.nip} • {person.phone}
            </Paragraph>
            {showDetails && (
              <Paragraph style={styles.personLocation}>
                📍 {person.province} • {person.district || 'District N/A'}
              </Paragraph>
            )}
          </View>
          <View style={styles.personStatus}>
            <Chip
              mode="outlined"
              style={[
                styles.statusChip,
                person.verification_status === 'VERIFIED' && styles.verifiedChip,
                person.verification_status === 'PENDING' && styles.pendingChip,
              ]}
            >
              {person.verification_status === 'VERIFIED' ? 'Vérifié' :
               person.verification_status === 'PENDING' ? 'En attente' : 'À vérifier'}
            </Chip>
          </View>
        </View>

        {actions.length > 0 && (
          <View style={styles.personActions}>
            {actions.map((action, index) => (
              <Chip
                key={index}
                mode="outlined"
                onPress={action.onPress}
                style={styles.actionChip}
                icon={action.icon}
              >
                {action.label}
              </Chip>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};
