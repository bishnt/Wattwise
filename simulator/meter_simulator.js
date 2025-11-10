// simulator/meter_simulator.js
require('dotenv').config();
const axios = require('axios');
const config = require('./config.js');

class PowerConsumptionSimulator {
  constructor(userId, profile = 'normal') {
    this.userId = userId;
    this.profile = profile;
    this.baseConfig = config.baseConsumption[profile] || config.baseConsumption.normal;
    this.energy_kwh = 0;
    this.activeAppliances = new Map();
    this.anomaly = null;
    this.anomalyRemaining = 0;
  }

  // Get current Nepal time (UTC+5:45)
  getNepalTime(date = new Date()) {
    // Nepal is UTC+5:45
    const offset = 5 * 60 + 45; // 5 hours 45 minutes in minutes
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (offset * 60000));
  }

  // Generate timestamp in Nepal time with 1-minute intervals
  generateTimestamp(baseDate = this.getNepalTime()) {
    return new Date(baseDate.getTime() + Math.random() * 86400000); // Random time today in Nepal
  }

  // Calculate seasonal multiplier for Nepal
  getSeasonalMultiplier(date) {
    const month = date.getMonth();
    // Nepal seasons:
    // Spring: Feb-Apr, Summer: May-Jul, Monsoon: Aug-Oct, Winter: Nov-Jan
    if (month >= 1 && month <= 3) return config.seasonalMultipliers.spring;    // Feb-Apr
    if (month >= 4 && month <= 6) return config.seasonalMultipliers.summer;    // May-Jul
    if (month >= 7 && month <= 9) return config.seasonalMultipliers.monsoon;   // Aug-Oct
    return config.seasonalMultipliers.winter; // Nov-Jan
  }

  // Get time pattern multiplier adjusted for Nepal lifestyle
  getTimePatternMultiplier(date) {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday is 0, Saturday is 6
    
    // Nepal-specific time patterns
    if (isWeekend) {
      return config.timePatterns.weekend[hour];
    } else {
      return config.timePatterns.weekday[hour];
    }
  }

  // Generate base load from always-on appliances
  generateBaseLoad() {
    let baseLoad = this.baseConfig.baseline;
    
    // Add always-on appliances
    Object.entries(this.baseConfig.appliances).forEach(([name, appliance]) => {
      if (appliance.alwaysOn) {
        baseLoad += appliance.power;
      }
    });

    return baseLoad;
  }

  // Generate cyclical appliance usage (refrigerator, etc.)
  generateCyclicalLoad(date) {
    let cyclicalLoad = 0;
    
    Object.entries(this.baseConfig.appliances).forEach(([name, appliance]) => {
      if (appliance.cycle) {
        const cyclePosition = (date.getMinutes() % appliance.cycle) / appliance.cycle;
        if (cyclePosition < appliance.dutyCycle) {
          cyclicalLoad += appliance.power;
        }
      }
    });

    return cyclicalLoad;
  }

  // Generate probabilistic appliance usage
  generateProbabilisticLoad(date, timeMultiplier) {
    let probabilisticLoad = 0;
    
    Object.entries(this.baseConfig.appliances).forEach(([name, appliance]) => {
      if (appliance.probability && !appliance.alwaysOn && !appliance.cycle) {
        const adjustedProbability = appliance.probability * timeMultiplier;
        if (Math.random() < adjustedProbability) {
          probabilisticLoad += appliance.power;
        }
      }
    });

    return probabilisticLoad;
  }

  // Start occasional high-power appliances (Nepal-specific patterns)
  startOccasionalAppliances(date, timeMultiplier) {
    const hour = date.getHours();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    Object.entries(config.occasionalAppliances).forEach(([name, appliance]) => {
      let adjustedProbability = appliance.probability * timeMultiplier;
      
      // Nepal-specific adjustments
      if (name === 'water_heater') {
        // Higher probability of water heater usage in morning (6-9) and evening (18-21)
        if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21)) {
          adjustedProbability *= 2;
        }
      }
      
      if (name === 'air_conditioner') {
        // AC usage in summer months (May-Jul) and in Terai region
        const month = date.getMonth();
        if (month >= 4 && month <= 6) { // May-Jul
          adjustedProbability *= 3;
        }
      }
      
      if (name === 'space_heater') {
        // Heater usage in winter months (Nov-Jan)
        const month = date.getMonth();
        if (month >= 10 || month <= 0) { // Nov-Jan
          adjustedProbability *= 4;
        }
      }

      if (Math.random() < adjustedProbability && !this.activeAppliances.has(name)) {
        this.activeAppliances.set(name, {
          power: appliance.power,
          endTime: new Date(date.getTime() + appliance.duration * 60000)
        });
      }
    });
  }

  // Update active appliances and remove finished ones
  updateActiveAppliances(date) {
    let activeLoad = 0;
    
    for (const [name, appliance] of this.activeAppliances.entries()) {
      if (date >= appliance.endTime) {
        this.activeAppliances.delete(name);
      } else {
        activeLoad += appliance.power;
      }
    }
    
    return activeLoad;
  }

  // Check for and apply anomalies (Nepal-specific: more voltage fluctuations)
  checkAnomalies() {
    if (this.anomalyRemaining > 0) {
      this.anomalyRemaining--;
      return this.anomaly;
    }

    // Slightly higher anomaly probability for Nepal grid
    const anomalyProbability = config.anomalies.probability * 1.5;
    
    if (Math.random() < anomalyProbability) {
      const anomalyTypes = Object.keys(config.anomalies.types);
      const randomAnomaly = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
      this.anomaly = { ...config.anomalies.types[randomAnomaly], type: randomAnomaly };
      this.anomalyRemaining = this.anomaly.duration;
      return this.anomaly;
    }

    return null;
  }

  // Apply anomaly effects to readings
  applyAnomaly(readings, anomaly) {
    if (anomaly.multiplier !== undefined) {
      readings.global_active_power *= anomaly.multiplier;
    }
    if (anomaly.voltageMultiplier !== undefined) {
      readings.voltage *= anomaly.voltageMultiplier;
    }
    
    return readings;
  }

  // Generate one minute of meter readings
  generateMeterReading(timestamp = this.getNepalTime()) {
    const seasonalMultiplier = this.getSeasonalMultiplier(timestamp);
    const timeMultiplier = this.getTimePatternMultiplier(timestamp);
    
    // Start occasional appliances
    this.startOccasionalAppliances(timestamp, timeMultiplier);
    
    // Calculate different load components
    const baseLoad = this.generateBaseLoad();
    const cyclicalLoad = this.generateCyclicalLoad(timestamp);
    const probabilisticLoad = this.generateProbabilisticLoad(timestamp, timeMultiplier);
    const activeLoad = this.updateActiveAppliances(timestamp);
    
    // Combine all loads and apply multipliers
    let totalActivePower = (baseLoad + cyclicalLoad + probabilisticLoad + activeLoad) * 
                          seasonalMultiplier * timeMultiplier;
    
    // Add random noise (±5%)
    const noise = 1 + (Math.random() - 0.5) * 0.1;
    totalActivePower *= noise;

    // Ensure minimum power
    totalActivePower = Math.max(totalActivePower, this.baseConfig.baseline * 0.5);

    // Generate other electrical parameters (Nepal uses 230V, 50Hz)
    const baseVoltage = config.electrical.baseVoltage;
    // More voltage variation for Nepal grid conditions
    const voltageVariation = config.electrical.voltageVariation * 1.2;
    const voltage = baseVoltage * (1 + (Math.random() - 0.5) * voltageVariation);
    
    const global_reactive_power = totalActivePower * 
                                 Math.tan(Math.acos(config.electrical.powerFactor)) / 1000; // Convert to kW
    
    const global_intensity = totalActivePower / voltage;
    
    const energy_this_minute = (totalActivePower / 1000) * (config.simulation.sampleInterval / 3600);
    this.energy_kwh += energy_this_minute;

    let readings = {
      user_id: this.userId,
      timestamp: timestamp.toISOString(),
      voltage: parseFloat(voltage.toFixed(2)),
      global_active_power: parseFloat((totalActivePower / 1000).toFixed(4)), // Convert to kW
      global_reactive_power: parseFloat(global_reactive_power.toFixed(4)),
      global_intensity: parseFloat(global_intensity.toFixed(4)),
      energy_kwh: parseFloat(this.energy_kwh.toFixed(4)),
      sample_interval_seconds: config.simulation.sampleInterval
    };

    // Check and apply anomalies
    const anomaly = this.checkAnomalies();
    if (anomaly) {
      readings = this.applyAnomaly(readings, anomaly);
      readings.anomaly_type = anomaly.type;
    }

    return readings;
  }

  // Generate multiple readings starting from current Nepal time
  generateReadings(count, startTime = this.getNepalTime()) {
    const readings = [];
    let currentTime = new Date(startTime);
    
    for (let i = 0; i < count; i++) {
      readings.push(this.generateMeterReading(currentTime));
      currentTime = new Date(currentTime.getTime() + config.simulation.sampleInterval * 1000);
    }
    
    return readings;
  }

  // COMMENTED OUT: Send data to backend API
  async sendToBackend(readings) {
    /*
    try {
      const response = await axios.post(process.env.API_URL || 'http://localhost:3000/api/meter-readings', {
        readings: readings
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_TOKEN}`
        }
      });
      
      console.log(`Successfully sent ${readings.length} readings to backend`);
      return response.data;
    } catch (error) {
      console.error('Error sending data to backend:', error.message);
      throw error;
    }
    */
    
    // INSTEAD: Log the generated data to console
    console.log(`\n=== Generated ${readings.length} meter readings ===`);
    
    // Show first 3 samples as examples
    console.log('\nFirst 3 samples:');
    readings.slice(0, 3).forEach((reading, index) => {
      console.log(`Sample ${index + 1}:`, {
        timestamp: reading.timestamp,
        voltage: reading.voltage + 'V',
        global_active_power: reading.global_active_power + 'kW',
        global_reactive_power: reading.global_reactive_power + 'kVAR', 
        global_intensity: reading.global_intensity + 'A',
        energy_kwh: reading.energy_kwh + 'kWh',
        ...(reading.anomaly_type && { anomaly_type: reading.anomaly_type })
      });
    });
    
    // Show summary statistics
    const powers = readings.map(r => r.global_active_power);
    const voltages = readings.map(r => r.voltage);
    
    console.log('\nBatch Summary:');
    console.log(`- Time range: ${readings[0].timestamp} to ${readings[readings.length-1].timestamp}`);
    console.log(`- Active Power: ${Math.min(...powers).toFixed(4)}kW to ${Math.max(...powers).toFixed(4)}kW (avg: ${(powers.reduce((a,b) => a+b)/powers.length).toFixed(4)}kW)`);
    console.log(`- Voltage: ${Math.min(...voltages).toFixed(1)}V to ${Math.max(...voltages).toFixed(1)}V`);
    console.log(`- Total Energy: ${readings[readings.length-1].energy_kwh - readings[0].energy_kwh} kWh in this batch`);
    
    // Check for anomalies in this batch
    const anomalies = readings.filter(r => r.anomaly_type);
    if (anomalies.length > 0) {
      console.log(`- Anomalies detected: ${anomalies.length}`);
      anomalies.forEach(anomaly => {
        console.log(`  * ${anomaly.timestamp}: ${anomaly.anomaly_type}`);
      });
    }
    
    return Promise.resolve({ success: true, message: 'Data logged to console' });
  }

  // Get current Nepal time info for logging
  getCurrentNepalTimeInfo() {
    const nepalTime = this.getNepalTime();
    return {
      date: nepalTime.toISOString().split('T')[0],
      time: nepalTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Kathmandu' }),
      dayOfWeek: nepalTime.getDay(),
      hour: nepalTime.getHours(),
      month: nepalTime.getMonth()
    };
  }
}

// Command-line interface
function parseArguments() {
  const args = process.argv.slice(2);
  const params = {
    profile: 'normal',
    userId: process.env.USER_ID || '550e8400-e29b-41d4-a716-446655440000',
    duration: 1440, // 1 day in minutes
    batchSize: 60,   // 1 hour of samples per batch
    startFromNow: true // Start from current Nepal time
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--profile':
      case '-p':
        params.profile = args[++i];
        break;
      case '--user-id':
      case '-u':
        params.userId = args[++i];
        break;
      case '--duration':
      case '-d':
        params.duration = parseInt(args[++i]);
        break;
      case '--batch-size':
      case '-b':
        params.batchSize = parseInt(args[++i]);
        break;
      case '--start-time':
      case '-s':
        params.startTime = new Date(args[++i]);
        params.startFromNow = false;
        break;
      case '--verbose':
      case '-v':
        params.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node meter_simulator.js [options]

Options:
  --profile, -p <profile>    Consumption profile (normal, high, low, vacation)
  --user-id, -u <uuid>       User ID for the simulation
  --duration, -d <minutes>   Duration of simulation in minutes
  --batch-size, -b <count>   Number of samples per batch
  --start-time, -s <date>    Start time (ISO string), defaults to current Nepal time
  --verbose, -v              Show all generated data (not recommended for large batches)
  --help, -h                 Show this help message

Examples:
  node meter_simulator.js --profile high --duration 2880
  node meter_simulator.js -p vacation -d 720 -b 30
  node meter_simulator.js --start-time "2024-01-15T00:00:00.000Z"
        `);
        process.exit(0);
    }
  }

  return params;
}

// Main simulation function
async function runSimulation() {
  const params = parseArguments();
  const simulator = new PowerConsumptionSimulator(params.userId, params.profile);
  
  const nepalTimeInfo = simulator.getCurrentNepalTimeInfo();
  
  console.log(`Starting simulation for user ${params.userId}`);
  console.log(`Profile: ${params.profile}`);
  console.log(`Duration: ${params.duration} minutes`);
  console.log(`Batch size: ${params.batchSize} samples`);
  console.log(`Nepal Time: ${nepalTimeInfo.date} ${nepalTimeInfo.time}`);
  console.log(`Season: ${getNepalSeason(nepalTimeInfo.month)}`);
  console.log(`Mode: Console output (backend disabled)`);

  const startTime = params.startFromNow ? simulator.getNepalTime() : params.startTime;
  const totalBatches = Math.ceil(params.duration / params.batchSize);
  let currentTime = new Date(startTime);

  for (let batch = 0; batch < totalBatches; batch++) {
    const samplesInThisBatch = Math.min(params.batchSize, params.duration - (batch * params.batchSize));
    
    const batchStartTime = simulator.getNepalTime(currentTime);
    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║ Generating batch ${batch + 1}/${totalBatches} (${samplesInThisBatch} samples) starting at ${batchStartTime.toISOString()} ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝`);
    
    const readings = simulator.generateReadings(samplesInThisBatch, currentTime);
    currentTime = new Date(currentTime.getTime() + samplesInThisBatch * 60000);

    try {
      await simulator.sendToBackend(readings);
    } catch (error) {
      console.log('Error processing batch:', error.message);
    }

    // Small delay between batches to make output readable
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 Simulation completed! All data has been generated and logged.');
  console.log(`📊 Total energy consumed: ${simulator.energy_kwh.toFixed(4)} kWh`);
}

// Helper function to get Nepal season name
function getNepalSeason(month) {
  if (month >= 1 && month <= 3) return 'Spring (Feb-Apr)';
  if (month >= 4 && month <= 6) return 'Summer (May-Jul)';
  if (month >= 7 && month <= 9) return 'Monsoon (Aug-Oct)';
  return 'Winter (Nov-Jan)';
}

// Run if called directly
if (require.main === module) {
  runSimulation().catch(console.error);
}

module.exports = PowerConsumptionSimulator;