// frontend/src/services/formValidation.js
// Form validation utilities using Joi schemas from backend

/**
 * Validation rules for frontend forms
 * These mirror the backend Joi schemas for consistency
 */

export const validationRules = {
  // Train number validation
  trainNo: {
    pattern: /^\d{1,5}$/,
    message: 'Train number must be 1-5 digits',
    maxLength: 5
  },

  // Journey date validation
  journeyDate: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Date must be in YYYY-MM-DD format',
    validateDate: true
  },

  // Train name validation
  trainName: {
    minLength: 2,
    maxLength: 100,
    message: 'Train name must be 2-100 characters'
  },

  // PNR (Passenger Name Record) validation
  pnr: {
    pattern: /^[A-Z0-9]{6}$/,
    message: 'PNR must be exactly 6 alphanumeric characters',
    maxLength: 6,
    minLength: 6,
    uppercase: true
  },

  // Passenger name validation
  passengerName: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s]*$/,
    message: 'Passenger name must contain only letters and spaces'
  },

  // Coach number validation
  coach: {
    pattern: /^[A-Z0-9]{1,3}$/,
    message: 'Coach must be 1-3 alphanumeric characters'
  },

  // Berth number validation
  berth: {
    pattern: /^[A-Z]?\d{1,2}$/,
    message: 'Berth must be 1-3 alphanumeric characters'
  },

  // Status validation
  status: {
    enum: ['CNF', 'RAC', 'WAITLIST', 'NO_SHOW', 'BOARDED', 'DEBOARDED'],
    message: 'Invalid passenger status'
  },

  // Class validation
  class: {
    enum: ['SL', '3A', '2A', '1A', 'FC'],
    message: 'Invalid coach class'
  },

  // Phone number validation
  phone: {
    pattern: /^\d{10}$/,
    message: 'Phone number must be 10 digits'
  },

  // Email validation
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email address'
  }
};

/**
 * Validate a single field
 * @param {string} fieldName - Field name to validate
 * @param {any} value - Value to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateField = (fieldName, value) => {
  const rule = validationRules[fieldName];

  if (!rule) {
    return { isValid: true, error: null };
  }

  // Handle empty values
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      error: `${fieldName} is required`
    };
  }

  // Min length check
  if (rule.minLength && String(value).length < rule.minLength) {
    return {
      isValid: false,
      error: rule.message || `Must be at least ${rule.minLength} characters`
    };
  }

  // Max length check
  if (rule.maxLength && String(value).length > rule.maxLength) {
    return {
      isValid: false,
      error: rule.message || `Must be at most ${rule.maxLength} characters`
    };
  }

  // Pattern check
  if (rule.pattern && !rule.pattern.test(String(value))) {
    return {
      isValid: false,
      error: rule.message || 'Invalid format'
    };
  }

  // Enum check
  if (rule.enum && !rule.enum.includes(value)) {
    return {
      isValid: false,
      error: rule.message || `Must be one of: ${rule.enum.join(', ')}`
    };
  }

  // Uppercase conversion
  if (rule.uppercase) {
    value = String(value).toUpperCase();
  }

  // Date validation
  if (rule.validateDate) {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return {
          isValid: false,
          error: 'Invalid date'
        };
      }
    } catch {
      return {
        isValid: false,
        error: 'Invalid date'
      };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Validate multiple fields at once
 * @param {object} fields - Object with fieldName: value pairs
 * @returns {object} - { isValid: boolean, errors: { fieldName: errorMessage } }
 */
export const validateFields = (fields) => {
  const errors = {};
  let isValid = true;

  Object.entries(fields).forEach(([fieldName, value]) => {
    const result = validateField(fieldName, value);
    if (!result.isValid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

/**
 * Get validation message for a field
 * @param {string} fieldName - Field name
 * @returns {string} - Validation message
 */
export const getValidationMessage = (fieldName) => {
  const rule = validationRules[fieldName];
  if (!rule) return '';
  return rule.message || '';
};

/**
 * Transform field value based on validation rules
 * @param {string} fieldName - Field name
 * @param {any} value - Value to transform
 * @returns {any} - Transformed value
 */
export const transformFieldValue = (fieldName, value) => {
  const rule = validationRules[fieldName];
  if (!rule) return value;

  let transformed = value;

  // Uppercase transformation
  if (rule.uppercase) {
    transformed = String(transformed).toUpperCase();
  }

  // Trim whitespace
  if (typeof transformed === 'string') {
    transformed = transformed.trim();
  }

  return transformed;
};

/**
 * Common form field groups
 */
export const formFieldGroups = {
  trainInitialization: ['trainNo', 'journeyDate', 'trainName'],
  passengerSearch: ['pnr'],
  passengerDetails: ['passengerName', 'coach', 'berth', 'class', 'status'],
  contact: ['phone', 'email'],
  reallocation: ['pnr', 'status', 'berth']
};

export default {
  validationRules,
  validateField,
  validateFields,
  getValidationMessage,
  transformFieldValue,
  formFieldGroups
};
