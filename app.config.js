/**
 * =============================================================================
 * 🇬🇦 RSU GABON - APP CONFIGURATION (MODE DEBUG)
 * =============================================================================
 */

export default {
  expo: {
    name: "RSU Gabon Surveyor",
    slug: "rsu-gabon-surveyor",
    version: "1.0.0",
    
    // ✅ Mode développement avec debug
    extra: {
      enableDebug: true,
    },
    
    // ✅ Hermes avec debug activé
    jsEngine: "hermes",
    
    // ✅ Logging détaillé
    packagerOpts: {
      config: "metro.config.js",
      sourceExts: ["js", "jsx", "json", "ts", "tsx"],
    },
  },
};