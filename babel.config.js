/**
 * =============================================================================
 * 🇬🇦 RSU GABON - BABEL CONFIGURATION (CORRIGÉE)
 * Standards Top 1% - Configuration Babel pour Expo 54
 * =============================================================================
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};