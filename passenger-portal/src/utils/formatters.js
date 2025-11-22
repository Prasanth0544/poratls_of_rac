// passenger-portal/src/utils/formatters.js

/**
 * Format PNR number with spacing for display
 * @param {string} pnr - PNR number
 * @returns {string} Formatted PNR (e.g., "1234 5678 90")
 */
export const formatPNRDisplay = (pnr) => {
    if (!pnr) return '';
    const cleaned = String(pnr).replace(/\s/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
    }
    return cleaned;
};

/**
 * Format currency (Indian Rupees)
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted amount (e.g., "₹1,234.00")
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone (e.g., "+91 98765 43210")
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
};

/**
 * Format train number with name
 * @param {string} trainNo - Train number
 * @param {string} trainName - Train name
 * @returns {string} Formatted train info
 */
export const formatTrainInfo = (trainNo, trainName) => {
    if (!trainNo && !trainName) return '';
    if (!trainName) return trainNo;
    if (!trainNo) return trainName;
    return `${trainNo} - ${trainName}`;
};

/**
 * Format station name with code
 * @param {string} stationName - Station name
 * @param {string} stationCode - Station code
 * @returns {string} Formatted station info
 */
export const formatStationInfo = (stationName, stationCode) => {
    if (!stationName && !stationCode) return '';
    if (!stationCode) return stationName;
    if (!stationName) return stationCode;
    return `${stationName} (${stationCode})`;
};

/**
 * Format journey segment
 * @param {string} from - Origin station
 * @param {string} to - Destination station
 * @returns {string} Journey segment (e.g., "NS → HBD")
 */
export const formatJourneySegment = (from, to) => {
    if (!from || !to) return '';
    return `${from} → ${to}`;
};

/**
 * Format berth allocation
 * @param {string} coach - Coach name
 * @param {number|string} berth - Berth number
 * @param {string} berthType - Berth type (optional)
 * @returns {string} Formatted berth (e.g., "S1-45 (LB)")
 */
export const formatBerthAllocation = (coach, berth, berthType) => {
    if (!coach || !berth) return '';
    const base = `${coach}-${berth}`;
    return berthType ? `${base} (${berthType})` : base;
};

/**
 * Format passenger name (title case)
 * @param {string} name - Passenger name
 * @returns {string} Formatted name
 */
export const formatPassengerName = (name) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Format age with suffix
 * @param {number} age - Age
 * @returns {string} Formatted age (e.g., "25 years")
 */
export const formatAge = (age) => {
    if (!age) return '';
    return `${age} ${age === 1 ? 'year' : 'years'}`;
};

/**
 * Format gender display
 * @param {string} gender - Gender code (M/F/O)
 * @returns {string} Full gender text
 */
export const formatGender = (gender) => {
    const genderMap = {
        'M': 'Male',
        'F': 'Female',
        'O': 'Other'
    };
    return genderMap[gender?.toUpperCase()] || gender;
};

/**
 * Format date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const startStr = start.toLocaleDateString('en-IN', formatOptions);
    const endStr = end.toLocaleDateString('en-IN', formatOptions);

    return `${startStr} - ${endStr}`;
};

/**
 * Format time duration
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "2h 30m")
 */
export const formatDuration = (minutes) => {
    if (!minutes || minutes < 0) return '0m';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
};

/**
 * Format countdown timer for display
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted countdown (e.g., "01:45")
 */
export const formatCountdown = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, total, decimals = 0) => {
    if (!total || total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
    if (!date) return '';

    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return then.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Format notification message
 * @param {string} type - Notification type
 * @param {object} data - Notification data
 * @returns {string} Formatted message
 */
export const formatNotificationMessage = (type, data) => {
    switch (type) {
        case 'OFFER':
            return `New upgrade offer: ${data.fromBerth || 'RAC'} → ${data.toBerth} in coach ${data.coach}`;
        case 'CONFIRMATION':
            return `Your upgrade to ${data.toBerth} has been confirmed!`;
        case 'REJECTION':
            return `Upgrade offer declined: ${data.reason || 'Not specified'}`;
        case 'EXPIRY':
            return `Upgrade offer expired: ${data.toBerth}`;
        default:
            return data.message || 'Notification received';
    }
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};

/**
 * Format array to comma-separated list
 * @param {Array} items - Array of items
 * @param {string} lastSeparator - Separator for last item (default: "and")
 * @returns {string} Formatted list
 */
export const formatList = (items, lastSeparator = 'and') => {
    if (!items || items.length === 0) return '';
    if (items.length === 1) return String(items[0]);
    if (items.length === 2) return `${items[0]} ${lastSeparator} ${items[1]}`;

    const allButLast = items.slice(0, -1).join(', ');
    const last = items[items.length - 1];
    return `${allButLast}, ${lastSeparator} ${last}`;
};

/**
 * Format validation error messages
 * @param {object} errors - Error object
 * @returns {string} Formatted error message
 */
export const formatValidationErrors = (errors) => {
    if (!errors || Object.keys(errors).length === 0) return '';

    const messages = Object.entries(errors).map(([field, error]) => {
        const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
        return `${fieldName}: ${error}`;
    });

    return messages.join('; ');
};

/**
 * Format quota display name
 * @param {string} quota - Quota code
 * @returns {string} Display name
 */
export const formatQuota = (quota) => {
    const quotaMap = {
        'GN': 'General',
        'TQ': 'Tatkal',
        'LD': 'Ladies',
        'SS': 'Senior Citizen',
        'LB': 'Lower Berth',
        'HP': 'Physically Handicapped'
    };
    return quotaMap[quota] || quota;
};

export default {
    formatPNRDisplay,
    formatCurrency,
    formatPhoneNumber,
    formatTrainInfo,
    formatStationInfo,
    formatJourneySegment,
    formatBerthAllocation,
    formatPassengerName,
    formatAge,
    formatGender,
    formatDateRange,
    formatDuration,
    formatCountdown,
    formatFileSize,
    formatPercentage,
    formatRelativeTime,
    formatNotificationMessage,
    truncateText,
    formatList,
    formatValidationErrors,
    formatQuota
};
