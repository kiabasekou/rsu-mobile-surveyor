

// =============================================================================
// D. FORM FIELD WRAPPER (components/forms/FormField.jsx)
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

export const FormField = ({
  type = 'text',
  label,
  value,
  onValueChange,
  options = [],
  required = false,
  error,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  disabled = false,
  icon,
  ...props
}) => {
  const fieldLabel = `${label}${required ? ' *' : ''}`;

  switch (type) {
    case 'text':
    case 'email':
    case 'password':
    case 'number':
      return (
        <View style={styles.fieldWrapper}>
          <TextInput
            label={fieldLabel}
            value={value}
            onChangeText={onValueChange}
            mode="outlined"
            style={styles.textInput}
            placeholder={placeholder}
            keyboardType={keyboardType}
            secureTextEntry={type === 'password'}
            multiline={multiline}
            disabled={disabled}
            error={!!error}
            left={icon ? <TextInput.Icon icon={icon} /> : undefined}
            {...props}
          />
          {error && (
            <Paragraph style={styles.errorText}>{error}</Paragraph>
          )}
        </View>
      );

    case 'radio':
      return (
        <View style={styles.fieldWrapper}>
          <Paragraph style={styles.fieldLabel}>{fieldLabel}</Paragraph>
          <RadioButton.Group
            onValueChange={onValueChange}
            value={value}
          >
            {options.map(option => (
              <View key={option.value} style={styles.radioOption}>
                <RadioButton
                  value={option.value}
                  disabled={disabled}
                />
                <Paragraph style={styles.optionLabel}>
                  {option.label}
                </Paragraph>
              </View>
            ))}
          </RadioButton.Group>
          {error && (
            <Paragraph style={styles.errorText}>{error}</Paragraph>
          )}
        </View>
      );

    case 'checkbox':
      return (
        <View style={styles.fieldWrapper}>
          <Paragraph style={styles.fieldLabel}>{fieldLabel}</Paragraph>
          {options.map(option => (
            <View key={option.value} style={styles.checkboxOption}>
              <Checkbox
                status={(value || []).includes(option.value) ? 'checked' : 'unchecked'}
                onPress={() => {
                  const currentValues = value || [];
                  const newValues = currentValues.includes(option.value)
                    ? currentValues.filter(v => v !== option.value)
                    : [...currentValues, option.value];
                  onValueChange(newValues);
                }}
                disabled={disabled}
              />
              <Paragraph style={styles.optionLabel}>
                {option.label}
              </Paragraph>
            </View>
          ))}
          {error && (
            <Paragraph style={styles.errorText}>{error}</Paragraph>
          )}
        </View>
      );

    case 'select':
      return (
        <View style={styles.fieldWrapper}>
          <Paragraph style={styles.fieldLabel}>{fieldLabel}</Paragraph>
          <View style={styles.chipContainer}>
            {options.map(option => (
              <Chip
                key={option.value}
                selected={value === option.value}
                onPress={() => onValueChange(option.value)}
                mode={value === option.value ? 'flat' : 'outlined'}
                style={styles.selectChip}
                disabled={disabled}
              >
                {option.label}
              </Chip>
            ))}
          </View>
          {error && (
            <Paragraph style={styles.errorText}>{error}</Paragraph>
          )}
        </View>
      );

    default:
      return null;
  }
};

// =============================================================================
// E. GPS CAPTURE WIDGET (components/widgets/GPSCapture.jsx)
// =============================================================================
export const GPSCapture = ({
  onLocationCaptured,
  initialLocation = null,
  required = true,
  showAccuracy = true,
}) => {
  const [location, setLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(false);

  const captureLocation = async () => {
    setLoading(true);
    try {
      const gpsLocation = await gpsService.getCurrentPosition();
      setLocation(gpsLocation);
      onLocationCaptured?.(gpsLocation);
    } catch (error) {
      Alert.alert('Erreur GPS', 'Impossible de capturer la position');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={styles.gpsCard}>
      <Card.Content>
        <View style={styles.gpsHeader}>
          <Title style={styles.gpsTitle}>
            📍 Position GPS{required && ' *'}
          </Title>
          {location && (
            <Chip
              mode="outlined"
              style={styles.gpsStatusChip}
              icon="check-circle"
            >
              Capturée
            </Chip>
          )}
        </View>

        {location ? (
          <View style={styles.gpsInfo}>
            <View style={styles.gpsDetails}>
              <Icon name="place" size={24} color="#4CAF50" />
              <View style={styles.gpsCoords}>
                <Paragraph style={styles.coordsText}>
                  Lat: {location.latitude.toFixed(6)}
                </Paragraph>
                <Paragraph style={styles.coordsText}>
                  Lon: {location.longitude.toFixed(6)}
                </Paragraph>
                {showAccuracy && (
                  <Paragraph style={styles.accuracyText}>
                    Précision: {Math.round(location.accuracy)}m
                  </Paragraph>
                )}
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={captureLocation}
              loading={loading}
              style={styles.recaptureButton}
              icon="refresh"
            >
              Recapturer
            </Button>
          </View>
        ) : (
          <View style={styles.gpsCapture}>
            <Paragraph style={styles.gpsDescription}>
              Capturez votre position GPS actuelle pour l'enquête terrain
            </Paragraph>
            <Button
              mode="contained"
              onPress={captureLocation}
              loading={loading}
              disabled={loading}
              style={styles.captureButton}
              icon="my-location"
            >
              {loading ? 'Capture GPS...' : 'Capturer Position'}
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

// =============================================================================
// F. SYNC STATUS INDICATOR (components/widgets/SyncStatus.jsx)
// =============================================================================
export const SyncStatus = ({
  pendingCount = 0,
  isOnline = true,
  lastSync = null,
  onSyncPress,
  compact = false,
}) => {
  const getStatusIcon = () => {
    if (!isOnline) return 'wifi-off';
    if (pendingCount > 0) return 'sync-problem';
    return 'sync';
  };

  const getStatusColor = () => {
    if (!isOnline) return '#F44336';
    if (pendingCount > 0) return '#FF9800';
    return '#4CAF50';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Hors ligne';
    if (pendingCount > 0) return `${pendingCount} en attente`;
    return 'Synchronisé';
  };

  if (compact) {
    return (
      <Chip
        mode="outlined"
        icon={getStatusIcon()}
        style={[styles.syncChip, { backgroundColor: `${getStatusColor()}20` }]}
        onPress={onSyncPress}
      >
        {getStatusText()}
      </Chip>
    );
  }

  return (
    <Card style={styles.syncCard} onPress={onSyncPress}>
      <Card.Content>
        <View style={styles.syncHeader}>
          <View style={styles.syncInfo}>
            <Icon name={getStatusIcon()} size={24} color={getStatusColor()} />
            <View style={styles.syncText}>
              <Paragraph style={styles.syncStatus}>
                {getStatusText()}
              </Paragraph>
              {lastSync && (
                <Paragraph style={styles.syncTime}>
                  Dernière sync: {format(
                    new Date(lastSync),
                    'dd/MM HH:mm',
                    { locale: fr }
                  )}
                </Paragraph>
              )}
            </View>
          </View>
          {pendingCount > 0 && isOnline && (
            <Button
              mode="contained"
              onPress={onSyncPress}
              style={styles.syncButton}
              icon="sync"
            >
              Synchroniser
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

// =============================================================================
// G. PROGRESS STEPPER (components/forms/ProgressStepper.jsx)
// =============================================================================
export const ProgressStepper = ({
  steps,
  currentStep,
  onStepPress,
  allowBackward = true,
}) => {
  return (
    <View style={styles.stepperContainer}>
      <View style={styles.stepsHeader}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                index === currentStep && styles.stepCircleActive,
                index < currentStep && styles.stepCircleCompleted,
              ]}
              onPress={() => {
                if (allowBackward && index < currentStep && onStepPress) {
                  onStepPress(index);
                }
              }}
            >
              {index < currentStep ? (
                <Icon name="check" size={16} color="#fff" />
              ) : (
                <Paragraph style={styles.stepNumber}>
                  {index + 1}
                </Paragraph>
              )}
            </View>
            <Paragraph style={[
              styles.stepLabel,
              index === currentStep && styles.stepLabelActive,
            ]}>
              {step.title}
            </Paragraph>
          </View>
        ))}
      </View>
      
      <View style={styles.progressLine}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentStep / (steps.length - 1)) * 100}%` }
          ]}
        />
      </View>
    </View>
  );
};

// =============================================================================
// H. LOADING OVERLAY (components/ui/LoadingOverlay.jsx)
// =============================================================================
export const LoadingOverlay = ({
  visible,
  message = 'Chargement...',
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.loadingContainer}>
        <Avatar.Icon
          size={64}
          icon="loading"
          style={styles.loadingIcon}
        />
        <Title style={styles.loadingText}>{message}</Title>
        {onCancel && (
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
          >
            Annuler
          </Button>
        )}
      </View>
    </View>
  );
};

// =============================================================================
// STYLES GLOBAUX
// =============================================================================
const componentStyles = StyleSheet.create({
  // Card styles
  personCard: {
    marginVertical: 6,
    elevation: 2,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  personAvatar: {
    backgroundColor: '#2E7D32',
    marginRight: 12,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  personDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  personLocation: {
    fontSize: 11,
    color: '#888',
  },
  personStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 4,
  },
  verifiedChip: {
    backgroundColor: '#E8F5E8',
  },
  pendingChip: {
    backgroundColor: '#FFF3E0',
  },
  personActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  actionChip: {
    marginBottom: 4,
  },

  // Stats styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statsVertical: {
    flexDirection: 'column',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    elevation: 2,
  },
  statCardVertical: {
    flex: 0,
    width: '100%',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statTrend: {
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 10,
    marginTop: 2,
  },

  // Form styles
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    marginBottom: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    marginLeft: 8,
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectChip: {
    marginBottom: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },

  // GPS styles
  gpsCard: {
    elevation: 2,
    marginVertical: 8,
  },
  gpsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gpsStatusChip: {
    backgroundColor: '#E8F5E8',
  },
  gpsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gpsCoords: {
    marginLeft: 12,
  },
  coordsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  accuracyText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  recaptureButton: {
    alignSelf: 'flex-start',
  },
  gpsCapture: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  gpsDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  captureButton: {
    alignSelf: 'center',
  },

  // Sync styles
  syncChip: {
    alignSelf: 'flex-start',
  },
  syncCard: {
    elevation: 2,
    marginVertical: 8,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncText: {
    marginLeft: 12,
  },
  syncStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncTime: {
    fontSize: 12,
    color: '#666',
  },
  syncButton: {
    alignSelf: 'flex-start',
  },

  // Stepper styles
  stepperContainer: {
    marginVertical: 16,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#2E7D32',
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  stepLabelActive: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  progressLine: {
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },

  // Loading overlay styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingIcon: {
    backgroundColor: '#2E7D32',
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
});

// Fusionner tous les styles
Object.assign(styles, componentStyles);

// =============================================================================
// EXPORTS
// =============================================================================
export {
  VulnerabilityScoreCard,
  PersonInfoCard,
  StatsOverview,
  FormField,
  GPSCapture,
  SyncStatus,
  ProgressStepper,
  LoadingOverlay,
};

// Export par défaut pour utilisation groupée
export default {
  VulnerabilityScoreCard,
  PersonInfoCard,
  StatsOverview,
  FormField,
  GPSCapture,
  SyncStatus,
  ProgressStepper,
  LoadingOverlay,
};