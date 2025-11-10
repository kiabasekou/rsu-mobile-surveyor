// =============================================================================
// 3. VALIDATION SERVICE (services/validation/validationService.js)
// =============================================================================
class ValidationService {
  // Validation NIP gabonais (10 chiffres)
  validateNIP(nip) {
    if (!nip) {
      return { valid: false, error: 'NIP requis' };
    }

    const nipRegex = /^[0-9]{10}$/;
    if (!nipRegex.test(nip)) {
      return { valid: false, error: 'NIP doit contenir exactement 10 chiffres' };
    }

    // Vérification checksum simple (algorithme Luhn adapté)
    if (!this.validateNIPChecksum(nip)) {
      return { valid: false, error: 'NIP invalide (checksum incorrect)' };
    }

    return { valid: true };
  }

  validateNIPChecksum(nip) {
    // Implémentation basique - à adapter selon algorithme réel RBPP Gabon
    const digits = nip.split('').map(Number);
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      let digit = digits[i];
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[9];
  }

  // Validation téléphone gabonais
  validatePhone(phone) {
    if (!phone) {
      return { valid: false, error: 'Numéro de téléphone requis' };
    }

    // Formats acceptés: +24101234567, 24101234567, 01234567
    const phoneRegex = /^(\+241|241)?[0-9]{8}$/;
    
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return { valid: false, error: 'Format téléphone gabonais invalide' };
    }

    // Vérifier préfixes valides pour le Gabon
    const cleanPhone = phone.replace(/(\+241|241|\s)/g, '');
    const validPrefixes = ['01', '02', '03', '04', '05', '06', '07', '08', '09']; // Opérateurs Gabon
    
    const prefix = cleanPhone.substring(0, 2);
    if (!validPrefixes.includes(prefix)) {
      return { valid: false, error: 'Préfixe téléphonique gabonais invalide' };
    }

    return { valid: true };
  }

  // Validation date de naissance
  validateBirthDate(birthDate) {
    if (!birthDate) {
      return { valid: false, error: 'Date de naissance requise' };
    }

    const date = new Date(birthDate);
    const now = new Date();
    const age = Math.floor((now - date) / (365.25 * 24 * 60 * 60 * 1000));

    if (date > now) {
      return { valid: false, error: 'Date de naissance ne peut être dans le futur' };
    }

    if (age > 120) {
      return { valid: false, error: 'Âge non réaliste (plus de 120 ans)' };
    }

    if (age < 0) {
      return { valid: false, error: 'Date de naissance invalide' };
    }

    return { valid: true, age };
  }

  // Validation email
  validateEmail(email) {
    if (!email) {
      return { valid: true }; // Email optionnel
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Format email invalide' };
    }

    return { valid: true };
  }

  // Validation revenu mensuel
  validateMonthlyIncome(income) {
    const numIncome = parseFloat(income);
    
    if (isNaN(numIncome) || numIncome < 0) {
      return { valid: false, error: 'Revenu doit être un nombre positif' };
    }

    // Vérification limites réalistes pour le Gabon (en FCFA)
    if (numIncome > 10000000) { // 10M FCFA
      return { valid: false, error: 'Revenu semble trop élevé' };
    }

    return { valid: true };
  }
}

export default new ValidationService();

