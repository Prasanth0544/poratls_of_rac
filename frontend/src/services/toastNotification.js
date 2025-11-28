/**
 * toastNotification.js (Frontend)
 * Toast notification utility for React applications
 * Provides consistent toast messages across all portals
 * 
 * USAGE:
 * Import { addToast } from './components/ToastContainer'
 * Then use any of the notification functions:
 *   - successToast('Message')
 *   - errorToast('Error message')
 *   - warningToast('Warning')
 *   - upgradeOfferToast('Name', 'Berth')
 *   - noShowToast('Name', 'PNR')
 */

import { addToast } from '../components/ToastContainer';

// Toast types and severity levels
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  UPGRADE_OFFER: 'upgrade-offer',
  NO_SHOW: 'no-show'
};

export const TOAST_DURATION = {
  SHORT: 2000,      // 2 seconds
  MEDIUM: 4000,     // 4 seconds
  LONG: 6000,       // 6 seconds
  PERSISTENT: null  // User must close
};

// Toast icons
const TOAST_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  'upgrade-offer': '🎉',
  'no-show': '❌'
};

/**
 * Toast notification object structure
 */
export const createToast = (
  message,
  type = TOAST_TYPES.INFO,
  duration = TOAST_DURATION.MEDIUM,
  title = null
) => {
  const toast = {
    id: `toast-${Date.now()}-${Math.random()}`,
    message,
    title,
    type,
    duration,
    icon: TOAST_ICONS[type] || 'ℹ️',
    timestamp: new Date(),
    isClosable: true
  };

  // Add to global toast queue
  if (typeof addToast === 'function') {
    addToast(toast);
  }

  return toast;
};

/**
 * Success notification
 */
export const successToast = (message, title = null, duration = TOAST_DURATION.SHORT) => {
  return createToast(message, TOAST_TYPES.SUCCESS, duration, title);
};

/**
 * Error notification
 */
export const errorToast = (message, title = null, duration = TOAST_DURATION.LONG) => {
  return createToast(message, TOAST_TYPES.ERROR, duration, title);
};

/**
 * Warning notification
 */
export const warningToast = (message, title = null, duration = TOAST_DURATION.MEDIUM) => {
  return createToast(message, TOAST_TYPES.WARNING, duration, title);
};

/**
 * Info notification
 */
export const infoToast = (message, title = null, duration = TOAST_DURATION.MEDIUM) => {
  return createToast(message, TOAST_TYPES.INFO, duration, title);
};

/**
 * Upgrade offer notification
 */
export const upgradeOfferToast = (passengerName, offerDetails) => {
  const title = `Upgrade Offer for ${passengerName}`;
  const message = typeof offerDetails === 'string' 
    ? offerDetails 
    : `New berth: ${offerDetails?.berth || 'TBD'}`;
  return createToast(message, TOAST_TYPES.UPGRADE_OFFER, TOAST_DURATION.PERSISTENT, title);
};

/**
 * No-show notification
 */
export const noShowToast = (passengerName, pnr) => {
  const title = 'No-Show Marked';
  const message = `${passengerName} (${pnr}) marked as NO-SHOW`;
  return createToast(message, TOAST_TYPES.NO_SHOW, TOAST_DURATION.MEDIUM, title);
};

/**
 * RAC upgrade confirmation
 */
export const upgradeConfirmationToast = (passengerName, newBerth) => {
  const title = 'Upgrade Confirmed';
  const message = `${passengerName} upgraded to berth ${newBerth}`;
  return createToast(message, TOAST_TYPES.SUCCESS, TOAST_DURATION.SHORT, title);
};

/**
 * Reallocation error toast
 */
export const reallocationErrorToast = (error) => {
  const message = error || 'Unable to process reallocation';
  return createToast(message, TOAST_TYPES.ERROR, TOAST_DURATION.LONG, 'Reallocation Error');
};

/**
 * Network error toast
 */
export const networkErrorToast = () => {
  const message = 'Check your internet connection';
  return createToast(message, TOAST_TYPES.ERROR, TOAST_DURATION.LONG, 'Network Error');
};

/**
 * Server error toast
 */
export const serverErrorToast = () => {
  const message = 'The server encountered an error. Please try again later.';
  return createToast(message, TOAST_TYPES.ERROR, TOAST_DURATION.LONG, 'Server Error');
};

/**
 * Validation error toast
 */
export const validationErrorToast = (fieldName = 'Input') => {
  const message = `Please check your ${fieldName.toLowerCase()} and try again.`;
  return createToast(message, TOAST_TYPES.WARNING, TOAST_DURATION.MEDIUM, `Invalid ${fieldName}`);
};

/**
 * WebSocket connection toast
 */
export const webSocketConnectedToast = () => {
  const message = 'Connected to real-time updates';
  return createToast(message, TOAST_TYPES.SUCCESS, TOAST_DURATION.SHORT, 'Connected');
};

export const webSocketDisconnectedToast = () => {
  const message = 'Disconnected from real-time updates';
  return createToast(message, TOAST_TYPES.WARNING, TOAST_DURATION.MEDIUM, 'Disconnected');
};

/**
 * Action toast messages
 */
export const actionToasts = {
  LOADING: (action) => createToast(`${action}...`, TOAST_TYPES.INFO, TOAST_DURATION.LONG, 'Loading'),
  SUCCESS: (action) => successToast(`${action} completed successfully`, 'Success'),
  FAILED: (action) => errorToast(`${action} failed`, 'Failed'),
  SAVED: () => successToast('Changes saved successfully', 'Saved'),
  DISCARDED: () => infoToast('Changes discarded', 'Discarded'),
  COPIED: () => successToast('Copied to clipboard', 'Copied'),
  DELETED: () => successToast('Deleted successfully', 'Deleted')
};

const notificationModule = {
  TOAST_TYPES,
  TOAST_DURATION,
  createToast,
  successToast,
  errorToast,
  warningToast,
  infoToast,
  upgradeOfferToast,
  noShowToast,
  upgradeConfirmationToast,
  reallocationErrorToast,
  networkErrorToast,
  serverErrorToast,
  validationErrorToast,
  webSocketConnectedToast,
  webSocketDisconnectedToast,
  actionToasts
};

export default notificationModule;
