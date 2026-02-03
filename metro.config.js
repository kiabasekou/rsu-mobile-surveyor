/**
 * =============================================================================
 * 🇬🇦 RSU GABON - METRO CONFIGURATION (CORRIGÉE)
 * Standards Top 1% - Bundler Metro pour React Native
 * =============================================================================
 */

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ✅ Fix pour enums et polyfills
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'mjs', 'cjs'],
};

// ✅ Fix pour transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;