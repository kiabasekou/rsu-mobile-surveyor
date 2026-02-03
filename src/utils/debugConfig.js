/**
 * =============================================================================
 * 🇬🇦 RSU GABON - DEBUG CONFIGURATION
 * =============================================================================
 */

if (__DEV__) {
  // ✅ Activer tous les logs
  console.log('🔍 DEBUG MODE ACTIVATED');
  
  // ✅ Logger les erreurs React
  const originalError = console.error;
  console.error = (...args) => {
    console.log('🔴 ERROR DETECTED:', args);
    originalError(...args);
  };

  // ✅ Logger les warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    console.log('⚠️ WARNING:', args);
    originalWarn(...args);
  };

  // ✅ Catch les erreurs globales
  global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
    console.log('🚨 GLOBAL ERROR:', {
      message: error.message,
      stack: error.stack,
      isFatal,
    });
  });
}

export default {};