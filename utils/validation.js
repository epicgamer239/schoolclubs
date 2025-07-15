// Validation utility functions

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

export const validateTime = (timeString) => {
  if (!timeString) return true; // Time is optional
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

export const validateJoinCode = (code) => {
  return code && code.trim().length >= 4;
};

export const validateClubName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

export const validateDescription = (description) => {
  return description && description.trim().length >= 10 && description.trim().length <= 500;
};

export const getValidationError = (field, value, additionalData = {}) => {
  switch (field) {
    case 'email':
      if (!validateRequired(value)) return 'Email is required';
      if (!validateEmail(value)) return 'Please enter a valid email address';
      return null;
    
    case 'password':
      if (!validateRequired(value)) return 'Password is required';
      if (!validatePassword(value)) return 'Password must be at least 6 characters long';
      return null;
    
    case 'confirmPassword':
      if (!validateRequired(value)) return 'Please confirm your password';
      if (value !== additionalData.password) return 'Passwords do not match';
      return null;
    
    case 'displayName':
      if (!validateRequired(value)) return 'Name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters long';
      return null;
    
    case 'clubName':
      if (!validateRequired(value)) return 'Club name is required';
      if (!validateClubName(value)) return 'Club name must be between 2 and 50 characters';
      return null;
    
    case 'description':
      if (!validateRequired(value)) return 'Description is required';
      if (!validateDescription(value)) return 'Description must be between 10 and 500 characters';
      return null;
    
    case 'joinCode':
      if (!validateRequired(value)) return 'Join code is required';
      if (!validateJoinCode(value)) return 'Join code must be at least 4 characters';
      return null;
    
    case 'eventTitle':
      if (!validateRequired(value)) return 'Event title is required';
      if (value.trim().length < 3) return 'Event title must be at least 3 characters long';
      return null;
    
    case 'eventDate':
      if (!validateRequired(value)) return 'Event date is required';
      if (!validateDate(value)) return 'Event date cannot be in the past';
      return null;
    
    case 'eventTime':
      if (value && !validateTime(value)) return 'Please enter a valid time (HH:MM)';
      return null;
    
    default:
      return null;
  }
}; 