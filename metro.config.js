/**
 * =============================================================================
 * 🇬🇦 RSU GABON - METRO CONFIGURATION (MODE DEBUG)
 * Standards Top 1% - Debug Activé
 * =============================================================================
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ✅ Activer le debug complet
config.resetCache = true;

// ✅ Logging détaillé
config.reporter = {
  update: (event) => {
    if (event.type === 'bundle_build_started') {
      console.log('📦 Building bundle...');
    }
    if (event.type === 'bundle_build_failed') {
      console.error('❌ Bundle failed:', event.error);
    }
  },
};

// ✅ Configuration transformer avec debug
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    // Désactiver minification pour voir les erreurs claires
    compress: false,
    mangle: false,
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false, // ✅ Désactiver pour debug
    },
  }),
};

// ✅ Source maps activées
config.serializer = {
  ...config.serializer,
  createModuleIdFactory: () => (path) => {
    // Utiliser le path complet pour identification
    return path;
  },
};

module.exports = config;