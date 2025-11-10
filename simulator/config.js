// simulator/config.js

module.exports = {
  // Base consumption patterns in watts (adjusted for Nepal household averages)
  baseConsumption: {
    normal: {
      baseline: 120, // Lower baseline for Nepal
      appliances: {
        refrigerator: { power: 120, cycle: 30, dutyCycle: 0.7 },
        led_lights: { power: 8, probability: 0.4 }, // More lighting usage
        electronics_standby: { power: 20, probability: 0.6 },
        wifi_router: { power: 6, alwaysOn: true },
        fan: { power: 60, probability: 0.5 } // Common in Nepal
      }
    },
    high: {
      baseline: 180,
      appliances: {
        refrigerator: { power: 150, cycle: 25, dutyCycle: 0.8 },
        led_lights: { power: 12, probability: 0.6 },
        electronics_standby: { power: 35, probability: 0.8 },
        wifi_router: { power: 8, alwaysOn: true },
        fan: { power: 75, probability: 0.7 }
      }
    },
    low: {
      baseline: 80,
      appliances: {
        refrigerator: { power: 100, cycle: 35, dutyCycle: 0.6 },
        led_lights: { power: 6, probability: 0.2 },
        electronics_standby: { power: 12, probability: 0.4 },
        wifi_router: { power: 5, alwaysOn: true },
        fan: { power: 50, probability: 0.3 }
      }
    },
    vacation: {
      baseline: 40,
      appliances: {
        refrigerator: { power: 120, cycle: 30, dutyCycle: 0.7 },
        led_lights: { power: 0, probability: 0 },
        electronics_standby: { power: 8, probability: 0.2 },
        wifi_router: { power: 6, alwaysOn: true },
        fan: { power: 0, probability: 0 }
      }
    }
  },

  // Nepal-specific time patterns
  timePatterns: {
    // Weekday patterns for Nepal (considering work/school schedules)
    weekday: [
      0.2, 0.15, 0.1, 0.05, 0.05, 0.1,   // 00:00-05:59 (very low)
      0.4, 0.7, 0.8, 0.6, 0.5, 0.4,      // 06:00-11:59 (morning peak)
      0.5, 0.6, 0.5, 0.4, 0.5, 0.7,      // 12:00-17:59 (afternoon)
      0.9, 1.0, 0.9, 0.7, 0.5, 0.3       // 18:00-23:59 (evening peak)
    ],
    // Weekend patterns for Nepal (more relaxed, later peaks)
    weekend: [
      0.2, 0.15, 0.1, 0.05, 0.05, 0.1,   // 00:00-05:59
      0.3, 0.4, 0.5, 0.6, 0.7, 0.8,      // 06:00-11:59
      0.9, 1.0, 0.9, 0.8, 0.9, 1.0,      // 12:00-17:59
      0.9, 0.8, 0.7, 0.6, 0.4, 0.3       // 18:00-23:59
    ]
  },

  // Occasional high-power appliances (Nepal household typical)
  occasionalAppliances: {
    microwave: { power: 1000, duration: 5, probability: 0.015 },
    oven: { power: 2000, duration: 30, probability: 0.005 }, // Less common
    dishwasher: { power: 1500, duration: 90, probability: 0.002 }, // Rare
    washing_machine: { power: 400, duration: 60, probability: 0.01 },
    dryer: { power: 2500, duration: 45, probability: 0.001 }, // Very rare
    air_conditioner: { power: 1200, duration: 20, probability: 0.02 }, // Only in certain areas
    space_heater: { power: 1200, duration: 30, probability: 0.03 }, // Common in winter
    water_heater: { power: 3000, duration: 15, probability: 0.02 }, // Common for showers
    electric_vehicle: { power: 5000, duration: 180, probability: 0.001 }, // Rare
    water_pump: { power: 750, duration: 10, probability: 0.05 } // Common in Nepal for water supply
  },

  // Nepal seasonal adjustments
  seasonalMultipliers: {
    spring: 1.0,    // Feb-Apr
    summer: 1.3,    // May-Jul (more fans, possible AC)
    monsoon: 1.1,   // Aug-Oct (moderate usage)
    winter: 1.4     // Nov-Jan (more heating, longer lighting hours)
  },

  // Electrical parameters for Nepal
  electrical: {
    baseVoltage: 230,        // Nepal uses 230V
    voltageVariation: 0.08,  // ±8% voltage variation (higher for Nepal grid)
    powerFactor: 0.92,       // Slightly lower power factor
    frequency: 50            // Grid frequency in Hz
  },

  // Anomaly configuration (slightly higher probability for Nepal)
  anomalies: {
    probability: 0.0015,     // 0.15% chance of anomaly per reading
    types: {
      powerSurge: { multiplier: 2.5, duration: 2 },
      brownout: { multiplier: 0.3, duration: 3 },
      voltageSpike: { voltageMultiplier: 1.3, duration: 1 },
      outage: { multiplier: 0, duration: 5 },
      voltageDip: { voltageMultiplier: 0.7, duration: 2 } // Common in Nepal
    }
  },

  // Simulation parameters
  simulation: {
    sampleInterval: 60,      // 1 minute in seconds
    maxSamplesPerBatch: 1440 // One day of samples
  }
};