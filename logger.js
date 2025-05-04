const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Create a logger (using winston for advanced logging)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level}] ${message}`;
  }),
  transports: [
    new winston.transports.File({ filename: 'events.log' }), // Log to file
    new winston.transports.Console()  // Log to console
  ],
  defaultMeta: { timestamp: new Date().toISOString() }
});

// Simple log function
function logEvent(action, status, details) {
  logger.info(`${action} - ${status} - ${JSON.stringify(details)}`);
}

// Optionally, log to a file using fs (alternative to winston)
function logToFile(action, status, details) {
  const logMessage = `${new Date().toISOString()} - ACTION: ${action} - STATUS: ${status} - DETAILS: ${JSON.stringify(details)}\n`;
  fs.appendFileSync(path.join(__dirname, 'events.log'), logMessage, 'utf8');
  console.log(logMessage);  // Optionally log to the console as well
}

// Export the log function to use in other files
module.exports = { logEvent, logToFile };
