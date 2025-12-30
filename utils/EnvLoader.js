const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

class EnvLoader {
  static isDevelopment() {
    return process.defaultApp || 
           /[\\/]electron[\\/]/.test(process.execPath) || 
           process.env.NODE_ENV === 'development';
  }

  static getEnvPath() {
    if (this.isDevelopment()) {
      // Desarrollo: desde la raíz del proyecto
      return path.join(process.cwd(), '.env');
    }
    
    // Producción: buscar en diferentes ubicaciones
    const possiblePaths = [
      // electron-builder coloca extraResources aquí:
      path.join(process.resourcesPath, '.env'),
      path.join(path.dirname(process.execPath), '.env'),
      path.join(path.dirname(process.execPath), 'resources', '.env'),
      
      // macOS específico
      path.join(process.resourcesPath, '..', '.env'),
      path.join(process.resourcesPath, '..', '..', '.env'),
    ];
    
    for (const envPath of possiblePaths) {
      if (fs.existsSync(envPath)) {
        console.log('📁 .env encontrado en:', envPath);
        return envPath;
      }
    }
    
    console.warn('⚠️  No se encontró .env, usando variables de sistema');
    return null;
  }

  static load() {
    const envPath = this.getEnvPath();
    
    if (envPath && fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      
      // Cargar en process.env
      for (const key in envConfig) {
        if (!process.env[key]) { // No sobreescribir variables existentes
          process.env[key] = envConfig[key];
        }
      }
      
      console.log('✅ Variables .env cargadas:', Object.keys(envConfig));
      return true;
    }
    
    return false;
  }

  // Método para acceder a variables específicas
  static get(key, defaultValue = '') {
    return process.env[key] || defaultValue;
  }
}

module.exports = EnvLoader;