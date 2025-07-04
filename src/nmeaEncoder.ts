export interface TrackPosition {
    latitude: number;
    longitude: number;
    altitude: number; // in meters
    speed: number;    // in m/s
    heading: number;  // in degrees
    timestamp?: number; // optional, Unix epoch millis
}

export interface EncodeOptions {
    timestamp?: number;  // overrides pos.timestamp if set
    includeMs?: boolean; // default false
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

export function generateGPRMC(pos: TrackPosition, options?: EncodeOptions): string {
    const speedKnots = pos.speed * 1.94384;
    const time = resolveTime(pos, options);
    const includeMs = options?.includeMs ?? false;

    let sentence = `$GPRMC,${formatNMEATime(time, includeMs)},A,${formatLatitude(pos.latitude)},${formatLongitude(pos.longitude)},` +
        `${speedKnots.toFixed(1)},${pos.heading.toFixed(1)},${formatNMEADate(time)},,,A`;
    sentence += calculateChecksum(sentence);
    return sentence;
}

export function generateGPGGA(pos: TrackPosition, options?: EncodeOptions): string {
    const time = resolveTime(pos, options);
    const includeMs = options?.includeMs ?? false;

    let sentence = `$GPGGA,${formatNMEATime(time, includeMs)},${formatLatitude(pos.latitude)},${formatLongitude(pos.longitude)},` +
        `1,08,0.9,${pos.altitude.toFixed(1)},M,0.0,M,,`;
    sentence += calculateChecksum(sentence);
    return sentence;
}
