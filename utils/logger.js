// utils/logger.js
const winston = require('winston');
const path = require('path');

class Logger {
  constructor() {
    // Creamos el "logger" con diferentes configuraciones
    const logLevel = process.env.LOG_LEVEL || 'info'; // Nivel de logeo desde variable de entorno o 'info' por defecto
    this.logger = winston.createLogger({
      // 👇 Niveles de importancia (de menor a mayor)
      // error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
      levels: winston.config.npm.levels,
      level: logLevel,
      
      // 👇 Formato por defecto de los mensajes
      format: winston.format.combine(
        winston.format.timestamp(), // Agrega fecha y hora
        winston.format.errors({ stack: true }), // Muestra errores con stack trace
        winston.format.json() // Formato JSON para máquinas
      ),
      
      // 👇 Dónde guardamos los logs
      transports: [
        // 📄 ARCHIVO para errores graves
        new winston.transports.File({
          filename: path.join(__dirname, '../logs/error.log'),
          level: 'error', // Solo guarda errores
          maxsize: 5242880, // 5MB máximo por archivo
          maxFiles: 5, // Máximo 5 archivos de error
        }),
        
        // 📄 ARCHIVO para todos los logs
        new winston.transports.File({
          filename: path.join(__dirname, '../logs/combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        
        // 🖥️ CONSOLA para desarrollo (más legible para humanos)
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(), // Colores bonitos
            winston.format.simple(), // Formato simple para leer
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `[${timestamp}] ${level}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              }`;
            })
          )
        })
      ],
      
      // 👇 Qué pasa si el logger mismo tiene errores
      exceptionHandlers: [
        new winston.transports.File({ 
          filename: path.join(__dirname, '../logs/exceptions.log') 
        })
      ]
    });
  }

  // 🔧 MÉTODOS SIMPLES PARA USAR
  
  // Para información general
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  // Para advertencias (cosas que podrían ser problemas)
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  // Para errores
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  // Para debugging (solo en desarrollo)
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Para requests HTTP
  http(message, meta = {}) {
    this.logger.http(message, meta);
  }
}

// 📦 Creamos una instancia para usar en toda la app
const loggerInstance = new Logger();

module.exports = loggerInstance;