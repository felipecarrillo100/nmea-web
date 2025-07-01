# **NMEA-Web**

**Lightweight, Fast, and Zero-Dependency NMEA 0183 Parser for the Web**

---

## **Overview**

NMEA-Web is a **compact and minimalistic TypeScript library** designed to parse NMEA 0183 sentences directly in your web applications. With a focus on **speed**, **simplicity**, and **zero dependencies**, this library provides developers with the essential tools to extract navigational data from NMEA sentences.

Whether you're building GPS-powered dashboards, marine navigation tools, or IoT applications, NMEA-Web delivers **high-performance parsing** with a clean and intuitive API.

---

## **Features**

### **🚀 Lightweight and Fast**
- Designed for modern web applications, this library is optimized for **performance** and **low overhead**.
- Zero dependencies—just plug and play!

### **🌐 Built for the Web**
- Perfect for browser-based environments. No extra setup or bulky libraries required.

### **📡 Supported NMEA Sentences**
- **GGA**: Global Positioning System Fix Data  
  Extract vital GPS data such as:
    - Time (UTC)
    - Latitude and Longitude
    - Fix Type (No Fix, GPS Fix, DGPS Fix)
    - Satellites in View
    - Altitude (meters)
    - Geoidal Separation
    - Differential GPS Data (optional)

- **RMC**: Recommended Minimum Specific GPS/Transit Data  
  Parse essential navigation details:
    - Date and Time (UTC)
    - Latitude and Longitude
    - Speed (knots)
    - Track True (heading in degrees)
    - Magnetic Variation
    - FAA Mode Indicator

### **🔧 Intuitive API**
- Simple function calls to parse NMEA sentences into structured objects.
- Handles optional fields gracefully, ensuring robust performance even with incomplete data.

### **📖 Compact and Minimalistic**
- No unnecessary features or bloated functionality—focus on what matters most.
- Lightweight footprint for seamless integration into your web browser projects.

---

## **Quick Start**

### Install
Simply copy the code into your project or use npm
```shell
npm install nmea-web
```

### Usage
```typescript
import { parseNmeaSentence, GGAPacket, RMCPacket } from "nmea-web";

// Sample NMEA sentences
const ggaSentence = "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47";
const rmcSentence = "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A";

// Parse GGA sentence
const ggaPacket = parseNmeaSentence(ggaSentence) as GGAPacket;
console.log("GGA Packet:", ggaPacket);

// Parse RMC sentence
const rmcPacket = parseNmeaSentence(rmcSentence) as RMCPacket;
console.log("RMC Packet:", rmcPacket);

// Access specific fields
console.log(`Latitude: ${ggaPacket.latitude}, Longitude: ${ggaPacket.longitude}`);
console.log(`Heading (Track True): ${rmcPacket.trackTrue}`);
```

## **Why Choose NMEA-Web?**

- **Zero Dependencies**: No need to install bulky libraries—just lightweight TypeScript code.
- **Optimized for the Web**: Perfect for browser-based applications and modern web projects.
- **Essential Functionality**: Focuses on parsing the most commonly used NMEA sentences (GGA and RMC) to deliver the data you need.
- **Easy Integration**: Drop it into your project and start parsing NMEA sentences instantly.

---

## **What’s Included**

- **GGA**: Global Positioning System Fix Data
- **RMC**: Recommended Minimum Specific GPS/Transit Data

---

## **What’s Not Included**

While NMEA-Web focuses on the most critical and widely used sentences, it currently **does not support**:

- Other NMEA sentence types (e.g., VTG, GSA, GSV, etc.)
- Proprietary sentences or custom extensions
- Advanced checksum validation (basic parsing assumes valid input)

---

## **License**

This library is open source and available under the [MIT License](https://opensource.org/licenses/MIT). Contributions and feedback are welcome!

---

**NMEA-Web: Navigational data, simplified.**
