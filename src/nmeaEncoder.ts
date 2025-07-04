/**
 * Represents the input track position used for encoding NMEA sentences.
 */
export interface TrackPosition {
    /** Latitude in decimal degrees */
    latitude: number;

    /** Longitude in decimal degrees */
    longitude: number;

    /** Altitude in meters above mean sea level */
    altitude: number;

    /** Speed in meters per second */
    speed: number;

    /** Heading in degrees relative to true north */
    heading: number;

    /**
     * Optional timestamp associated with the position, in ISO 8601 format.
     * If provided, it will be used unless overridden by `EncodeOptions.timestamp`.
     */
    timestamp?: number;
}

/**
 * Options to control how NMEA sentences are generated.
 */
export interface EncodeOptions {
    /**
     * Optional UNIX timestamp (milliseconds since epoch) used for encoding time/date fields.
     * If omitted, the encoder will fall back to `TrackPosition.timestamp`, or finally to `Date.now()`.
     */
    timestamp?: number;

    /**
     * Whether to include milliseconds in the encoded time field.
     * Default is `false` to comply with standard NMEA formats.
     */
    includeMs?: boolean;
}

function pad(num: number, width: number, precision = 0): string {
    const fixed = num.toFixed(precision);
    return fixed.padStart(width, '0');
}

function formatLatitude(lat: number): string {
    const hemi = lat >= 0 ? 'N' : 'S';
    lat = Math.abs(lat);
    const degrees = Math.floor(lat);
    const minutes = (lat - degrees) * 60;
    return `${pad(degrees, 2)}${pad(minutes, 7, 4)},${hemi}`;
}

function formatLongitude(lon: number): string {
    const hemi = lon >= 0 ? 'E' : 'W';
    lon = Math.abs(lon);
    const degrees = Math.floor(lon);
    const minutes = (lon - degrees) * 60;
    return `${pad(degrees, 3)}${pad(minutes, 7, 4)},${hemi}`;
}

function formatNMEATime(date = new Date(), includeMs = false): string {
    const h = pad(date.getUTCHours(), 2);
    const m = pad(date.getUTCMinutes(), 2);
    const s = pad(date.getUTCSeconds(), 2);
    if (includeMs) {
        const ms = pad(date.getUTCMilliseconds(), 3);
        return `${h}${m}${s}.${ms}`;
    }
    return `${h}${m}${s}`;
}

function formatNMEADate(date = new Date()): string {
    const d = pad(date.getUTCDate(), 2);
    const m = pad(date.getUTCMonth() + 1, 2);
    const y = pad(date.getUTCFullYear() % 100, 2);
    return `${d}${m}${y}`;
}

function calculateChecksum(sentence: string): string {
    let checksum = 0;
    for (let i = 1; i < sentence.length; i++) {
        const c = sentence[i];
        if (c === '*') break;
        checksum ^= c.charCodeAt(0);
    }
    return `*${checksum.toString(16).toUpperCase().padStart(2, '0')}`;
}

function resolveTime(pos: TrackPosition, options?: EncodeOptions): Date {
    if (options?.timestamp !== undefined) {
        return new Date(options.timestamp);
    }
    if (pos.timestamp !== undefined) {
        return new Date(pos.timestamp);
    }
    return new Date();
}

/**
 * Generates a NMEA GPRMC (Recommended Minimum Navigation Information) sentence
 * from the provided track position data.
 *
 * The function encodes:
 * - UTC time (optionally including milliseconds)
 * - Latitude and longitude (in degrees and decimal minutes)
 * - Speed over ground (converted to knots)
 * - Course over ground (true heading)
 * - UTC date
 *
 * Time resolution is determined in this order of precedence:
 * 1. `options.timestamp` (numeric, UTC milliseconds)
 * 2. `pos.timestamp` (ISO string or numeric)
 * 3. Current system time
 *
 * @param pos - The track position data (latitude, longitude, altitude, speed, heading, optional timestamp).
 * @param options - Optional settings:
 *   - `timestamp`: A UTC timestamp in milliseconds.
 *   - `includeMs`: Whether to include milliseconds in the encoded time. Defaults to false.
 *
 * @returns A `$GPRMC` sentence string with valid NMEA checksum.
 */
export function generateGPRMC(pos: TrackPosition, options?: EncodeOptions): string {
    const speedKnots = pos.speed * 1.94384;
    const time = resolveTime(pos, options);
    const includeMs = options?.includeMs ?? false;

    let sentence = `$GPRMC,${formatNMEATime(time, includeMs)},A,${formatLatitude(pos.latitude)},${formatLongitude(pos.longitude)},` +
        `${speedKnots.toFixed(1)},${pos.heading.toFixed(1)},${formatNMEADate(time)},,,A`;
    sentence += calculateChecksum(sentence);
    return sentence;
}

/**
 * Generates a NMEA GPGGA (Global Positioning System Fix Data) sentence
 * from the provided track position data.
 *
 * The function encodes:
 * - UTC time (optionally including milliseconds)
 * - Latitude and longitude (in degrees and decimal minutes)
 * - Fix quality (set to 1 = GPS fix)
 * - Number of satellites (hardcoded to 08)
 * - HDOP (hardcoded to 0.9)
 * - Altitude (in meters)
 *
 * Time resolution is determined in this order of precedence:
 * 1. `options.timestamp` (numeric, UTC milliseconds)
 * 2. `pos.timestamp` (ISO string or numeric)
 * 3. Current system time
 *
 * @param pos - The track position data (latitude, longitude, altitude, optional timestamp).
 * @param options - Optional settings:
 *   - `timestamp`: A UTC timestamp in milliseconds.
 *   - `includeMs`: Whether to include milliseconds in the encoded time. Defaults to false.
 *
 * @returns A `$GPGGA` sentence string with valid NMEA checksum.
 */
export function generateGPGGA(pos: TrackPosition, options?: EncodeOptions): string {
    const time = resolveTime(pos, options);
    const includeMs = options?.includeMs ?? false;

    let sentence = `$GPGGA,${formatNMEATime(time, includeMs)},${formatLatitude(pos.latitude)},${formatLongitude(pos.longitude)},` +
        `1,08,0.9,${pos.altitude.toFixed(1)},M,0.0,M,,`;
    sentence += calculateChecksum(sentence);
    return sentence;
}
