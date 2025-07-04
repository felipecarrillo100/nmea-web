// nmea-web - Lightweight NMEA 0183 parser (GGA and RMC only)
// License MIT
// This library is open source and available under the [MIT License](https://opensource.org/licenses/MIT). Contributions and feedback are welcome!
// Author: Felipe Carrillo

/**
 * Base interface for all parsed NMEA sentence packets.
 */
export interface Packet {
    /** The three-letter sentence identifier (e.g. `GGA`, `RMC`) */
    sentenceId: string;

    /** The two-letter talker ID (e.g. `GP` for GPS) */
    talkerId: string;

    /** The type of message (typically same as `sentenceId`) */
    type: string;
}

/**
 * Represents the parsed data from a `$GxGGA` (Global Positioning System Fix Data) sentence.
 * This provides essential fix data such as time, position, fix quality, and altitude.
 */
export interface GGAPacket extends Packet {
    /** UTC time of the fix (may be `undefined` if not present or invalid) */
    time: Date | undefined;

    /** Latitude in decimal degrees */
    latitude: number;

    /** Longitude in decimal degrees */
    longitude: number;

    /** GPS fix quality (0 = invalid, 1 = GPS fix, 2 = DGPS fix, etc.) */
    fixType: number;

    /** Number of satellites in use */
    satellitesInView: number;

    /** Horizontal dilution of precision */
    horizontalDilution: number;

    /** Altitude in meters above mean sea level */
    altitudeMeters: number;

    /** Height of geoid above WGS84 ellipsoid in meters */
    geoidalSeperation: number;

    /** Age of differential GPS data (in seconds), if available */
    differentialAge?: number;

    /** Differential reference station ID, if available */
    differentialRefStn?: string;
}

/**
 * Represents the parsed data from a `$GxRMC` (Recommended Minimum Navigation Information) sentence.
 * This sentence provides essential navigation data such as time, position, speed, and course.
 */
export interface RMCPacket extends Packet {
    /** Combined UTC date and time of fix as a JavaScript `Date` */
    datetime: Date;

    /** Status character: 'A' = active, 'V' = void */
    status: string;

    /** Latitude in decimal degrees */
    latitude: number;

    /** Longitude in decimal degrees */
    longitude: number;

    /** Speed over ground in knots */
    speedKnots: number;

    /** Track angle in degrees (true north) */
    trackTrue: number;

    /** Magnetic variation in degrees */
    variation: number;

    /** Direction of magnetic variation: 'E' = East, 'W' = West */
    variationPole: string;

    /** FAA mode indicator (e.g. 'A' = Autonomous, 'D' = Differential, 'N' = Not valid) */
    faaMode: string;
}
function parseLatitude(raw: string, direction: string): number {
    if (!raw) return NaN;
    const deg = parseInt(raw.slice(0, 2), 10);
    const min = parseFloat(raw.slice(2));
    let lat = deg + min / 60;
    if (direction === "S") lat = -lat;
    return lat;
}

function parseLongitude(raw: string, direction: string): number {
    if (!raw) return NaN;
    const deg = parseInt(raw.slice(0, 3), 10);
    const min = parseFloat(raw.slice(3));
    let lon = deg + min / 60;
    if (direction === "W") lon = -lon;
    return lon;
}

function parseTime(timeStr: string): Date | undefined {
    if (!timeStr) return undefined;
    const hh = parseInt(timeStr.slice(0, 2), 10);
    const mm = parseInt(timeStr.slice(2, 4), 10);
    const ss = parseFloat(timeStr.slice(4));
    const date = new Date();
    date.setUTCHours(hh, mm, ss);
    return date;
}

function parseDateTime(dateStr: string, timeStr: string): Date {
    const dd = parseInt(dateStr.slice(0, 2), 10);
    const mo = parseInt(dateStr.slice(2, 4), 10) - 1;
    const yy = parseInt(dateStr.slice(4), 10) + 2000;
    const hh = parseInt(timeStr.slice(0, 2), 10);
    const mm = parseInt(timeStr.slice(2, 4), 10);
    const ss = parseFloat(timeStr.slice(4));
    return new Date(Date.UTC(yy, mo, dd, hh, mm, ss));
}

/**
 * Parses a NMEA sentence string and returns the corresponding decoded packet.
 *
 * This function supports `$GPGGA` and `$GPRMC` sentences and returns their structured representation.
 * Optionally, it can also validate the checksum of the sentence.
 *
 * ### Supported sentence types:
 * - `GGA`: Global Positioning System Fix Data
 * - `RMC`: Recommended Minimum Navigation Information
 *
 * @param sentence - A valid NMEA 0183 sentence string (e.g., `$GPGGA,...*hh`).
 * @param enableChecksum - Optional flag to validate the checksum (default: `false`).
 *
 * @throws If the sentence is malformed, has a checksum mismatch (if enabled), or if the sentence type is unsupported.
 *
 * @returns A `Packet` object representing the decoded data, either a `GGAPacket` or `RMCPacket`.
 */
export function parseNmeaSentence(sentence: string, enableChecksum = false): Packet {
    if (!sentence.startsWith("$") || !sentence.includes("*")) {
        throw new Error("Invalid NMEA sentence");
    }
    const [dataPart, checksum] = sentence.slice(1).split("*");

    if (enableChecksum) {
        // Perform XOR checksum validation
        const calculatedChecksum = calculateChecksum(dataPart);
        if (calculatedChecksum !== parseInt(checksum, 16)) {
            throw new Error(`Checksum mismatch: expected ${checksum}, calculated ${calculatedChecksum.toString(16).toUpperCase()}`);
        }
    }

    const sentenceData = `$` + dataPart;

    const parts = sentenceData.slice(1).split(",");
    const id = parts[0];
    const talkerId = id.slice(0, 2);
    const sentenceId = id.slice(2);

    switch (sentenceId) {
        case "GGA":
            return parseGGA(parts, talkerId, sentenceId);
        case "RMC":
            return parseRMC(parts, talkerId, sentenceId);
        default:
            throw new Error("Unsupported sentence type: " + sentenceId);
    }
}

function calculateChecksum(nmeaData: string): number {
    let checksum = 0;
    for (let i = 0; i < nmeaData.length; i++) {
        checksum ^= nmeaData.charCodeAt(i);
    }
    return checksum;
}

function parseGGA(parts: string[], talkerId: string, sentenceId: string): GGAPacket {
    const time = parseTime(parts[1]);
    const latitude = parseLatitude(parts[2], parts[3]);
    const longitude = parseLongitude(parts[4], parts[5]);
    const fixType = parseInt(parts[6], 10);
    const satellitesInView = parseInt(parts[7], 10);
    const horizontalDilution = parseFloat(parts[8]);
    const altitudeMeters = parseFloat(parts[9]);
    const geoidalSeperation = parseFloat(parts[11]);

    const packet: GGAPacket = {
        sentenceId,
        talkerId,
        type: "GGA",
        time,
        latitude,
        longitude,
        fixType,
        satellitesInView,
        horizontalDilution,
        altitudeMeters,
        geoidalSeperation
    };

    if (parts[13]) packet.differentialAge = parseFloat(parts[13]);
    if (parts[14]) packet.differentialRefStn = parts[14].split("*")[0];

    return packet;
}

function parseRMC(parts: string[], talkerId: string, sentenceId: string): RMCPacket {
    const datetime = parseDateTime(parts[9], parts[1]);
    const status = parts[2];
    const latitude = parseLatitude(parts[3], parts[4]);
    const longitude = parseLongitude(parts[5], parts[6]);
    const speedKnots = parseFloat(parts[7]);
    const trackTrue = parseFloat(parts[8]);
    const variation = parts[10] ? parseFloat(parts[10]) : NaN;
    const variationPole = parts[11] || "";
    const faaMode = parts[12] ? parts[12].split("*")[0] : "";

    return {
        sentenceId,
        talkerId,
        type: "RMC",
        datetime,
        status,
        latitude,
        longitude,
        speedKnots,
        trackTrue,
        variation,
        variationPole,
        faaMode
    };
}
