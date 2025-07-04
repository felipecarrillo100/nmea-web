import { generateGPRMC, generateGPGGA, TrackPosition, EncodeOptions } from './nmeaEncoder';

describe('NMEAGenerator - Time Encoding with options', () => {
    const fixedTimestamp = Date.UTC(2025, 6, 4, 12, 34, 56, 789); // July 4, 2025 12:34:56.789 UTC

    const pos: TrackPosition = {
        latitude: 40.7831,
        longitude: -73.9712,
        altitude: 3657.6,
        speed: 72,
        heading: 90.0,
    };

    function calculateChecksum(sentence: string): string {
        let checksum = 0;
        for (let i = 1; i < sentence.length; i++) {
            const c = sentence[i];
            if (c === '*') break;
            checksum ^= c.charCodeAt(0);
        }
        return `*${checksum.toString(16).toUpperCase().padStart(2, '0')}`;
    }

    test('generateGPRMC includes milliseconds when includeMs=true', () => {
        const opts: EncodeOptions = { timestamp: fixedTimestamp, includeMs: true };
        const sentence = generateGPRMC(pos, opts);
        expect(sentence.startsWith('$GPRMC')).toBe(true);
        expect(sentence).toContain('123456.789');
        expect(sentence).toContain('4046.9860,N');
        expect(sentence).toContain('07358.2720,W');
        expect(sentence).toContain('140.0');
        expect(sentence).toContain('90.0');
        expect(sentence).toContain('040725');

        const checksumMatch = sentence.match(/\*([A-F0-9]{2})$/);
        expect(checksumMatch).not.toBeNull();
        const calculated = calculateChecksum(sentence);
        expect(sentence.endsWith(calculated)).toBe(true);
    });

    test('generateGPRMC excludes milliseconds when includeMs=false', () => {
        const opts: EncodeOptions = { timestamp: fixedTimestamp, includeMs: false };
        const sentence = generateGPRMC(pos, opts);
        expect(sentence.startsWith('$GPRMC')).toBe(true);
        expect(sentence).toContain('123456'); // no .ms
        expect(sentence).not.toContain('123456.789');
    });

    test('generateGPGGA includes milliseconds when includeMs=true', () => {
        const opts: EncodeOptions = { timestamp: fixedTimestamp, includeMs: true };
        const sentence = generateGPGGA(pos, opts);
        expect(sentence.startsWith('$GPGGA')).toBe(true);
        expect(sentence).toContain('123456.789');
        expect(sentence).toContain('4046.9860,N');
        expect(sentence).toContain('07358.2720,W');
        expect(sentence).toContain('3657.6');

        const checksumMatch = sentence.match(/\*([A-F0-9]{2})$/);
        expect(checksumMatch).not.toBeNull();
        const calculated = calculateChecksum(sentence);
        expect(sentence.endsWith(calculated)).toBe(true);
    });

    test('generateGPGGA excludes milliseconds when includeMs=false', () => {
        const opts: EncodeOptions = { timestamp: fixedTimestamp, includeMs: false };
        const sentence = generateGPGGA(pos, opts);
        expect(sentence.startsWith('$GPGGA')).toBe(true);
        expect(sentence).toContain('123456'); // no .ms
        expect(sentence).not.toContain('123456.789');
    });

    test('generateGPRMC uses pos.timestamp if options.timestamp missing', () => {
        const p:  TrackPosition = { ...pos, timestamp: fixedTimestamp };
        const sentence = generateGPRMC(p, { includeMs: true });
        expect(sentence).toContain('123456.789');
    });


    test('generateGPRMC uses current time if no timestamps', () => {
        const before = new Date();
        const sentence = generateGPRMC(pos);
        const after = new Date();

        const timeStr = sentence.split(',')[1]; // e.g. '123456.789'
        const dateStr = sentence.split(',')[9]; // e.g. '040725'

        // Parse time and date from sentence
        const h = parseInt(timeStr.slice(0, 2));
        const m = parseInt(timeStr.slice(2, 4));
        const s = parseInt(timeStr.slice(4, 6));
        const ms = timeStr.includes('.') ? parseInt(timeStr.split('.')[1].padEnd(3, '0')) : 0;

        const day = parseInt(dateStr.slice(0, 2));
        const month = parseInt(dateStr.slice(2, 4)) - 1;
        const year = 2000 + parseInt(dateStr.slice(4, 6));

        const encodedDate = new Date(Date.UTC(year, month, day, h, m, s, ms));

        // Wider tolerance (1 second window)
        const toleranceMs = 2000;

        expect(encodedDate.getTime()).toBeGreaterThanOrEqual(before.getTime() - toleranceMs);
        expect(encodedDate.getTime()).toBeLessThanOrEqual(after.getTime() + toleranceMs);
    });

});
