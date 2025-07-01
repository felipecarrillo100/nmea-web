// nmea-web - Lightweight NMEA 0183 parser (GGA and RMC only)
// License MIT
// This library is open source and available under the [MIT License](https://opensource.org/licenses/MIT). Contributions and feedback are welcome!
// Author: Felipe Carrillo


export interface Packet {
    sentenceId: string;
    talkerId: string;
    type: string;
}

export interface GGAPacket extends Packet {
    time: Date | undefined;
    latitude: number;
    longitude: number;
    fixType: number;
    satellitesInView: number;
    horizontalDilution: number;
    altitudeMeters: number;
    geoidalSeperation: number;
    differentialAge?: number;
    differentialRefStn?: string;
}

export interface RMCPacket extends Packet {
    datetime: Date;
    status: string;
    latitude: number;
    longitude: number;
    speedKnots: number;
    trackTrue: number;
    variation: number;
    variationPole: string;
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

export function parseNmeaSentence(sentence: string, enableChecksum=false): Packet {
    // Ensure the sentence starts with "$" and contains a "*"
    if (!sentence.startsWith("$") || !sentence.includes("*")) {
        throw new Error("Invalid NMEA sentence");
    }
    const [dataPart, checksum] = sentence.slice(1).split("*");

    // Split the sentence into the data part for basic validation
    if (!enableChecksum) {
        const match = sentence.match(/\$(.*)\*(\w{2})$/);
        if (!match) {
            throw new Error("Invalid NMEA sentence: unable to extract checksum");
        }
    } else {
        // Perform XOR checksum validation
        const calculatedChecksum = calculateChecksum(dataPart);
        if (calculatedChecksum !== parseInt(checksum, 16)) {
            throw new Error("Checksum mismatch");
        }
    }

    const sentenceData = `$`+dataPart;

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

    // Iterate over each character in the string
    for (let i = 0; i < nmeaData.length; i++) {
        checksum ^= nmeaData.charCodeAt(i); // XOR each character's ASCII value
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
