/**
 * Utilities for managing token timestamps across node-ops and web-bumpy
 */

import moment from 'moment-timezone';

/**
 * Get a formatted timestamp in CST timezone
 * @returns {string} Formatted timestamp in CST
 */
export function getFormattedTimestamp() {
    return moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm:ss [CST]');
}

/**
 * Get timestamp updates for token operations
 * @param {string} source - Source of the update ('web', 'ops', or 'refresh')
 * @returns {Object} Object containing all timestamp fields
 */
export function getTokenTimestamps(source = 'unknown') {
    const now = Date.now();
    const cstTime = getFormattedTimestamp();
    
    const updates = {
        // Primary timestamp for code operations
        __last_token_update: now,
        
        // Source-specific update time
        [`__${source}_token_update`]: cstTime,
        
        // Legacy fields (for backwards compatibility)
        lastUpdated: cstTime,
        updateTime: cstTime,
    };
    
    return updates;
}

/**
 * Get timestamp updates for scope operations
 * @param {string} source - Source of the update ('web' or 'ops')
 * @returns {Object} Object containing all timestamp fields
 */
export function getScopeTimestamps(source = 'unknown') {
    const now = Date.now();
    const cstTime = getFormattedTimestamp();
    
    return {
        // Primary timestamp for code operations
        __last_scopes_update: now,
        
        // Source-specific update time
        [`__${source}_scopes_update`]: cstTime,
        
        // Legacy fields (for backwards compatibility)
        lastUpdated: cstTime,
        updateTime: cstTime,
    };
}

/**
 * Parse a stored timestamp (handles both epoch and CST format)
 * @param {string|number} timestamp - Timestamp to parse
 * @returns {moment.Moment} Moment object
 */
export function parseTimestamp(timestamp) {
    if (typeof timestamp === 'number') {
        return moment(timestamp);
    }
    
    // Try parsing as CST format first
    let parsed = moment.tz(timestamp, 'YYYY-MM-DD HH:mm:ss [CST]', 'America/Chicago');
    if (parsed.isValid()) {
        return parsed;
    }
    
    // Fallback to ISO format
    return moment(timestamp);
}

/**
 * Calculate hours difference between now and a given timestamp
 * @param {string|number} timestamp - Timestamp to compare against
 * @returns {number} Hours difference
 */
export function getHoursSince(timestamp) {
    return moment().diff(parseTimestamp(timestamp), 'hours');
}
