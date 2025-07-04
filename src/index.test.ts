import { TrackPosition, generateGPRMC, generateGPGGA, EncodeOptions } from './nmeaEncoder';
import { parseNmeaSentence, RMCPacket, GGAPacket } from './index';

describe('NMEA Encode-Decode Round Trip Tests', () => {
    const fixedTimestamp = Date.UTC(2025, 6, 4, 12, 34, 56, 789); // Fixed timestamp for deterministic output

    // Helper to create options object
    function opts(includeMs = false): EncodeOptions {
        return { timestamp: fixedTimestamp, includeMs };
    }

    it('should correctly encode and decode a position in New York City', () => {
        const pos: TrackPosition = {
            latitude: 40.7831,
            longitude: -73.9712,
            altitude: 10,
            speed: 72,
            heading: 90,
        };

        const rmc = generateGPRMC(pos, opts());
        const gga = generateGPGGA(pos, opts());

        const decodedRMC = parseNmeaSentence(rmc) as RMCPacket;
        const decodedGGA = parseNmeaSentence(gga) as GGAPacket;

        expect(decodedRMC.latitude).toBeCloseTo(pos.latitude, 4);
        expect(decodedRMC.longitude).toBeCloseTo(pos.longitude, 4);
        expect(decodedRMC.speedKnots).toBeCloseTo(pos.speed * 1.94384, 1);
        expect(decodedRMC.trackTrue).toBeCloseTo(pos.heading, 1);

        expect(decodedGGA.latitude).toBeCloseTo(pos.latitude, 4);
        expect(decodedGGA.longitude).toBeCloseTo(pos.longitude, 4);
        expect(decodedGGA.altitudeMeters).toBeCloseTo(pos.altitude, 1);

        expect(rmc.startsWith('$GPRMC')).toBe(true);
        expect(gga.startsWith('$GPGGA')).toBe(true);
    });

    it('should correctly encode and decode a position at the North Pole', () => {
        const pos: TrackPosition = {
            latitude: 90,
            longitude: 0,
            altitude: 0,
            speed: 0,
            heading: 0,
        };

        const rmc = generateGPRMC(pos, opts());
        const gga = generateGPGGA(pos, opts());

        const decodedRMC = parseNmeaSentence(rmc) as RMCPacket;
        const decodedGGA = parseNmeaSentence(gga) as GGAPacket;

        expect(decodedRMC.latitude).toBeCloseTo(90, 4);
        expect(decodedRMC.longitude).toBeCloseTo(0, 4);

        expect(decodedGGA.latitude).toBeCloseTo(90, 4);
        expect(decodedGGA.longitude).toBeCloseTo(0, 4);

        expect(decodedGGA.altitudeMeters).toBeCloseTo(0, 1);
    });

    it('should correctly encode and decode a position at the South Pole', () => {
        const pos: TrackPosition = {
            latitude: -90,
            longitude: 0,
            altitude: 0,
            speed: 0,
            heading: 0,
        };

        const rmc = generateGPRMC(pos, opts());
        const gga = generateGPGGA(pos, opts());

        const decodedRMC = parseNmeaSentence(rmc) as RMCPacket;
        const decodedGGA = parseNmeaSentence(gga) as GGAPacket;

        expect(decodedRMC.latitude).toBeCloseTo(-90, 4);
        expect(decodedRMC.longitude).toBeCloseTo(0, 4);

        expect(decodedGGA.latitude).toBeCloseTo(-90, 4);
        expect(decodedGGA.longitude).toBeCloseTo(0, 4);

        expect(decodedGGA.altitudeMeters).toBeCloseTo(0, 1);
    });

    it('should correctly encode and decode a position at the International Date Line +180 longitude', () => {
        const pos: TrackPosition = {
            latitude: 0,
            longitude: 180,
            altitude: 0,
            speed: 10,
            heading: 270,
        };

        const rmc = generateGPRMC(pos, opts());
        const gga = generateGPGGA(pos, opts());

        const decodedRMC = parseNmeaSentence(rmc) as RMCPacket;
        const decodedGGA = parseNmeaSentence(gga) as GGAPacket;

        expect(decodedRMC.latitude).toBeCloseTo(0, 4);
        expect(decodedRMC.longitude).toBeCloseTo(180, 4);

        expect(decodedGGA.latitude).toBeCloseTo(0, 4);
        expect(decodedGGA.longitude).toBeCloseTo(180, 4);

        expect(decodedGGA.altitudeMeters).toBeCloseTo(0, 1);
    });

    it('should correctly encode and decode a position at the International Date Line -180 longitude', () => {
        const pos: TrackPosition = {
            latitude: 0,
            longitude: -180,
            altitude: 0,
            speed: 10,
            heading: 90,
        };

        const rmc = generateGPRMC(pos, opts());
        const gga = generateGPGGA(pos, opts());

        const decodedRMC = parseNmeaSentence(rmc) as RMCPacket;
        const decodedGGA = parseNmeaSentence(gga) as GGAPacket;

        expect(decodedRMC.latitude).toBeCloseTo(0, 4);
        expect(decodedRMC.longitude).toBeCloseTo(-180, 4);

        expect(decodedGGA.latitude).toBeCloseTo(0, 4);
        expect(decodedGGA.longitude).toBeCloseTo(-180, 4);

        expect(decodedGGA.altitudeMeters).toBeCloseTo(0, 1);
    });

    it('should correctly encode and decode a position at the Equator and Prime Meridian', () => {
        const pos: TrackPosition = {
            latitude: 0,
            longitude: 0,
            altitude: 5,
            speed: 5,
            heading: 45,
        };

        const rmc = generateGPRMC(pos, opts());
        const gga = generateGPGGA(pos, opts());

        const decodedRMC = parseNmeaSentence(rmc) as RMCPacket;
        const decodedGGA = parseNmeaSentence(gga) as GGAPacket;

        expect(decodedRMC.latitude).toBeCloseTo(0, 4);
        expect(decodedRMC.longitude).toBeCloseTo(0, 4);

        expect(decodedGGA.latitude).toBeCloseTo(0, 4);
        expect(decodedGGA.longitude).toBeCloseTo(0, 4);

        expect(decodedGGA.altitudeMeters).toBeCloseTo(5, 1);
    });
});
