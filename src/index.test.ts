import { parseNmeaSentence, GGAPacket, RMCPacket } from './index';

describe('NMEA Parser Tests', () => {
    describe('GGA Sentence Parsing', () => {
        it('should parse a GGA sentence for a location in the Northern Hemisphere', () => {
            const ggaSentence = "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47";
            const packet = parseNmeaSentence(ggaSentence) as GGAPacket;

            expect(packet.sentenceId).toBe('GGA');
            expect(packet.talkerId).toBe('GP');
            expect(packet.type).toBe('GGA');
            expect(packet.latitude).toBeCloseTo(48.1173, 3); // 48°7.038' -> 48.1173°
            expect(packet.longitude).toBeCloseTo(11.5167, 3); // 11°31.000' -> 11.5167°
            expect(packet.altitudeMeters).toBe(545.4);
            expect(packet.satellitesInView).toBe(8);
        });

        it('should parse a GGA sentence for a location in the Southern Hemisphere', () => {
            const ggaSentence = "$GPGGA,123519,3456.789,S,05823.456,W,1,10,1.0,12.3,M,46.9,M,,*65";
            const packet = parseNmeaSentence(ggaSentence) as GGAPacket;

            expect(packet.latitude).toBeCloseTo(-34.9465, 3); // 34°56.789' -> -34.9465°
            expect(packet.longitude).toBeCloseTo(-58.3910, 3); // 58°23.456' -> -58.3910°
            expect(packet.altitudeMeters).toBe(12.3);
            expect(packet.satellitesInView).toBe(10);
        });

        it('should handle missing optional fields in a GGA sentence', () => {
            const ggaSentence = "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47";
            const packet = parseNmeaSentence(ggaSentence) as GGAPacket;

            expect(packet.differentialAge).toBeUndefined();
            expect(packet.differentialRefStn).toBeUndefined();
        });
    });

    describe('RMC Sentence Parsing', () => {
        it('should parse an RMC sentence for a location in the Northern Hemisphere', () => {
            const rmcSentence = "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A";
            const packet = parseNmeaSentence(rmcSentence) as RMCPacket;

            expect(packet.sentenceId).toBe('RMC');
            expect(packet.talkerId).toBe('GP');
            expect(packet.type).toBe('RMC');
            expect(packet.latitude).toBeCloseTo(48.1173, 3); // 48°7.038' -> 48.1173°
            expect(packet.longitude).toBeCloseTo(11.5167, 3); // 11°31.000' -> 11.5167°
            expect(packet.speedKnots).toBeCloseTo(22.4, 1);
            expect(packet.trackTrue).toBeCloseTo(84.4, 1);
        });

        it('should parse an RMC sentence for a location in the Southern Hemisphere', () => {
            const rmcSentence = "$GPRMC,235959,A,3456.789,S,05823.456,W,005.5,270.0,010125,001.1,E*6F";
            const packet = parseNmeaSentence(rmcSentence) as RMCPacket;

            expect(packet.latitude).toBeCloseTo(-34.9465, 3); // 34°56.789' -> -34.9465°
            expect(packet.longitude).toBeCloseTo(-58.3910, 3); // 58°23.456' -> -58.3910°
            expect(packet.speedKnots).toBeCloseTo(5.5, 1); // Speed in knots
            expect(packet.trackTrue).toBeCloseTo(270.0, 1); // Heading (true course)
            expect(packet.variation).toBeCloseTo(1.1, 1); // Magnetic variation
            expect(packet.variationPole).toBe("E"); // Variation direction
        });

        it('should handle invalid or missing fields in an RMC sentence gracefully', () => {
            const rmcSentence = "$GPRMC,123519,V,,,,,,,230394,,,N*53"; // 'V' indicates no valid data
            const packet = parseNmeaSentence(rmcSentence) as RMCPacket;

            expect(packet.status).toBe("V"); // Status 'V' means navigation receiver warning
            expect(packet.latitude).toBeNaN(); // No latitude provided
            expect(packet.longitude).toBeNaN(); // No longitude provided
            expect(packet.speedKnots).toBeNaN(); // No speed provided
            expect(packet.trackTrue).toBeNaN(); // No track provided
        });

        it('should parse an RMC sentence for a location near the equator and prime meridian', () => {
            const rmcSentence = "$GPRMC,120000,A,0000.000,N,00000.000,E,010.0,180.0,010125,,,N*7C";
            const packet = parseNmeaSentence(rmcSentence) as RMCPacket;

            expect(packet.latitude).toBeCloseTo(0.0, 3); // Latitude near equator
            expect(packet.longitude).toBeCloseTo(0.0, 3); // Longitude near prime meridian
            expect(packet.speedKnots).toBeCloseTo(10.0, 1); // Speed in knots
            expect(packet.trackTrue).toBeCloseTo(180.0, 1); // Heading (true course)
        });
    });

    describe('Error Handling', () => {
        it('should throw an error for unsupported sentence types', () => {
            const unsupportedSentence = "$GPVTG,054.7,T,034.4,M,005.5,N,010.2,K*48"; // VTG is not supported
            expect(() => parseNmeaSentence(unsupportedSentence)).toThrow(
                "Unsupported sentence type: VTG"
            );
        });

        it('should throw an error for sentences missing a starting "$"', () => {
            const invalidSentence = "GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47";
            expect(() => parseNmeaSentence(invalidSentence)).toThrow(
                "Invalid NMEA sentence"
            );
        });

        it('should throw an error for improperly formatted sentences', () => {
            const malformedSentence = "$GPGGA,123519,4807.038,N"; // Incomplete GGA sentence
            expect(() => parseNmeaSentence(malformedSentence)).toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('should parse a GGA sentence for a location at the North Pole', () => {
            const ggaSentence = "$GPGGA,120000,9000.000,N,00000.000,E,1,05,1.5,0.0,M,0.0,M,,*48";
            const packet = parseNmeaSentence(ggaSentence) as GGAPacket;

            expect(packet.latitude).toBeCloseTo(90.0, 4); // North Pole
            expect(packet.longitude).toBeCloseTo(0.0, 4); // Prime meridian
            expect(packet.altitudeMeters).toBe(0.0); // Altitude at sea level
            expect(packet.satellitesInView).toBe(5); // Number of satellites in view
        });

        it('should parse a GGA sentence for a location at the South Pole', () => {
            const ggaSentence = "$GPGGA,120000,9000.000,S,00000.000,E,1,07,1.0,0.0,M,0.0,M,,*5C";
            const packet = parseNmeaSentence(ggaSentence) as GGAPacket;

            expect(packet.latitude).toBeCloseTo(-90.0, 4); // South Pole
            expect(packet.longitude).toBeCloseTo(0.0, 4); // Prime meridian
            expect(packet.altitudeMeters).toBe(0.0); // Altitude at sea level
            expect(packet.satellitesInView).toBe(7); // Number of satellites in view
        });

        it('should parse an RMC sentence for a location at the International Date Line', () => {
            const rmcSentence = "$GPRMC,120000,A,0000.000,N,18000.000,E,020.0,90.0,010125,,,E*68";
            const packet = parseNmeaSentence(rmcSentence) as RMCPacket;

            expect(packet.latitude).toBeCloseTo(0.0, 4); // Latitude at equator
            expect(packet.longitude).toBeCloseTo(180.0, 4); // Longitude at International Date Line
            expect(packet.speedKnots).toBeCloseTo(20.0, 1); // Speed in knots
            expect(packet.trackTrue).toBeCloseTo(90.0, 1); // Heading (true course)
        });

        it('should parse an RMC sentence for a location at the opposite side of the International Date Line', () => {
            const rmcSentence = "$GPRMC,120000,A,0000.000,S,18000.000,W,015.0,270.0,010125,,,W*6A";
            const packet = parseNmeaSentence(rmcSentence) as RMCPacket;

            expect(packet.latitude).toBeCloseTo(-0.0, 4); // Latitude at equator (Southern Hemisphere)
            expect(packet.longitude).toBeCloseTo(-180.0, 4); // Longitude at opposite side of International Date Line
            expect(packet.speedKnots).toBeCloseTo(15.0, 1); // Speed in knots
            expect(packet.trackTrue).toBeCloseTo(270.0, 1); // Heading (true course)
        });
    });
});
