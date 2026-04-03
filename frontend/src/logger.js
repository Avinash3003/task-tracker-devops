export const structuredLog = (level, message, data = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    service_name: 'frontend-service',
    message: message,
    ...data
  };
  
  const logString = JSON.stringify(logEntry);
  if (level === 'error') {
    console.error(logString);
  } else if (level === 'warn') {
    console.warn(logString);
  } else {
    console.log(logString);
  }
};
