// frontend/src/components/FormInput.jsx
// Reusable form input component with validation

import React, { useState } from 'react';
import { validateField, transformFieldValue, getValidationMessage } from '../services/formValidation';
import '../components/FormInput.css';

function FormInput({
  name,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  validate = true,
  autoComplete = 'off',
  className = '',
  icon = null,
  hint = null,
  maxLength = null
}) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    let newValue = e.target.value;

    // Transform value based on validation rules
    if (validate) {
      newValue = transformFieldValue(name, newValue);
    }

    onChange(newValue);

    // Validate on change if already touched
    if (touched && validate) {
      const result = validateField(name, newValue);
      setError(result.error);
    }
  };

  const handleBlur = (e) => {
    setTouched(true);

    // Validate on blur
    if (validate && required) {
      const result = validateField(name, value);
      setError(result.error);
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  const validationMessage = validate ? getValidationMessage(name) : '';
  const hasError = error && touched;

  return (
    <div className={`form-input-wrapper ${hasError ? 'has-error' : ''} ${className}`}>
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      <div className="form-input-container">
        {icon && <span className="form-input-icon">{icon}</span>}
        <input
          id={name}
          type={type}
          name={name}
          className={`form-input ${icon ? 'with-icon' : ''} ${hasError ? 'error' : ''}`}
          placeholder={placeholder}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
        />
      </div>

      {/* Validation error message */}
      {hasError && (
        <p className="form-error-message" role="alert">
          {error}
        </p>
      )}

      {/* Help text */}
      {hint && !hasError && (
        <p className="form-hint-message">
          {hint}
        </p>
      )}

      {/* Validation info */}
      {validationMessage && !hasError && touched && (
        <p className="form-validation-message">
          {validationMessage}
        </p>
      )}
    </div>
  );
}

export default FormInput;
