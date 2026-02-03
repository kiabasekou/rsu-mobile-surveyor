/**
 * =============================================================================
 * 🇬🇦 RSU GABON - BABEL CONFIGURATION (MODE DEBUG)
 * =============================================================================
 */

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ❌ COMMENTER CETTE LIGNE
      // 'react-native-reanimated/plugin',
    ],
  };
};