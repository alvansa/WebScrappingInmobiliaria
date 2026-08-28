const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const fs = require('fs');
const { writeFile, readFile } = require('fs').promises;
const { readFileSync } = require('fs');
const os = require('os');

const logger = require('#utils/logger.js');

require('dotenv').config();


const EnvLoader = require('#utils/EnvLoader.js');


// The scope for reading spreadsheets.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];


class SpreadSheetManager {

    static async processData(isDev=false) {
        try {
            let data = null;
            if(!isDev){
                data = await this.obtainOnlineData();
                return {
                    result: true,
                    data: data
                }
            }else{
                const filePath = path.join(__dirname, 'data.json');

                if (!fs.existsSync(filePath)) {
                    logger.error(`❌ Archivo data.json no encontrado en: ${filePath}`);
                }else{
                    logger.debug("El archivo si existe")
                }
                data = readFileSync(filePath, 'utf8');
                data = JSON.parse(data); 
                return {
                    result: true,
                    data: data
                }
            }
        } catch (error) {
            logger.error(`Error en spreedSheetManager processData:  ${error.message}`);
            return {result : false, data: error.message};
        }
    }


    static async obtainOnlineData() {
        EnvLoader.load();

        const spreadsheetId = EnvLoader.get('SPREADSHEET_ID');
        if (!spreadsheetId) {
            throw new Error("❌ SPREADSHEET_ID no está definido en las variables de entorno.");
        }

        const TOKEN_PATH = this.obtainToken();
        const credentialsPath = this.getCredentialsPath();

        // 1. Leer el archivo de credenciales de cliente para instanciar OAuth2 correctamente
        const credentialsFile = await readFile(credentialsPath, 'utf8');
        const keys = JSON.parse(credentialsFile);
        const { client_secret, client_id, redirect_uris } = keys.installed || keys.web;

        let auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // 2. Intentar usar el token guardado
        let isTokenValid = false;
        try {
            const tokenContent = await readFile(TOKEN_PATH, 'utf8');
            const token = JSON.parse(tokenContent);
            auth.setCredentials(token);

            // Verificar si caducó
            if (!token.expiry_date || Date.now() < token.expiry_date) {
                isTokenValid = true;
            }
        } catch (error) {
            logger.warn(`No se pudo leer el token guardado, se solicitará uno nuevo. ${error.message}`);
        }

        if (!isTokenValid) {
            auth = await authenticate({
                keyfilePath: credentialsPath,
                scopes: SCOPES
            });
            await writeFile(TOKEN_PATH, JSON.stringify(auth.credentials));
        }

        // 4. Consultar la API de Sheets
        const sheets = google.sheets({ version: 'v4', auth });

        const result = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'search!A1:AZ',
        });

        logger.debug(`Descargadas ${result.data.values?.length || 0} filas`);
        return result.data.values || [];
}

    static obtainToken(){
        const homeDir = os.homedir();
        const TOKEN_PATH = path.join(homeDir,'Documents','infoRemates', 'token.json');
        return TOKEN_PATH;
    }

    static createCredentials(){
        return {

        }
    }

    static getCredentialsPath() {
    // Determina si estamos en desarrollo o producción
    const isDev = process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath);
    
    if (isDev) {
      // Modo desarrollo
      return path.join(process.cwd(),'src','core','enrichers','spreadSheet','credentials.json');
    //   return path.join(process.cwd(), 'componentes', 'spreadSheet', 'credentials.json');
    } else {
      // Modo producción con electron-builder
      // electron-builder coloca extraResources en diferentes ubicaciones:
      
      if (process.platform === 'darwin') {
        // macOS: dentro del .app bundle
        logger.debug(`Buscando en: ${path.join(process.resourcesPath, 'credentials.json')}`)
        return path.join(process.resourcesPath, 'credentials.json');
      } else if (process.platform === 'win32') {
        // Windows: en el directorio resources
        return path.join(process.resourcesPath, 'credentials.json');
      } else {
        // Linux
        return path.join(process.resourcesPath, 'credentials.json');
      }
    }
  }
}


module.exports = SpreadSheetManager;