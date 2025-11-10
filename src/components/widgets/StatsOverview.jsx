
// =============================================================================
// C. STATS OVERVIEW WIDGET (components/widgets/StatsOverview.jsx)
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

export const StatsOverview = ({
  stats,
  onStatPress,
  layout = 'horizontal',
}) => {
  const renderStat = (stat, index) => (
    <Card
      key={stat.key || index}
      style={[styles.statCard, layout === 'vertical' && styles.statCardVertical]}
      onPress={() => onStatPress?.(stat)}
    >
      <Card.Content style={styles.statContent}>
        <Icon name={stat.icon} size={32} color={stat.color || '#2E7D32'} />
        <View style={styles.statInfo}>
          <Title style={styles.statValue}>{stat.value}</Title>
          <Paragraph style={styles.statLabel}>{stat.label}</Paragraph>
        </View>
        {stat.trend && (
          <View style={styles.statTrend}>
            <Icon
              name={stat.trend > 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={stat.trend > 0 ? '#4CAF50' : '#F44336'}
            />
            <Paragraph style={styles.trendValue}>
              {Math.abs(stat.trend)}%
            </Paragraph>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (layout === 'grid') {
    return (
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => renderStat(stat, index))}
      </View>
    );
  }

  return (
    <View style={[
      styles.statsContainer,
      layout === 'vertical' && styles.statsVertical
    ]}>
      {stats.map((stat, index) => renderStat(stat, index))}
    </View>
  );
};