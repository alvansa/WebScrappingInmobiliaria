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
                    console.log("El archivo si existe")
                }
                data = readFileSync(filePath, 'utf8');
                data = JSON.parse(data); 
                return {
                    result: true,
                    data: data
                }
            }
        } catch (error) {
            console.error("Error: ", error.message);
            return {result : false, data: error.message};
        }
    }


    static async obtainOnlineData() {
        let auth = null;
        const TOKEN_PATH = this.obtainToken();
        let credentialsPath = this.getCredentialsPath();
        EnvLoader.load();

        // Ahora puedes acceder a las variables
        const spreadsheetId = EnvLoader.get('SPREADSHEET_ID');

        // Intentar cargar token existente
        try {
            const tokenContent = await readFile(TOKEN_PATH, 'utf8');
            const credentials = JSON.parse(tokenContent);
            // console.log(`Credenciales leídas: ${JSON.stringify(credentials)} y token path es ${TOKEN_PATH}`);
            auth = new google.auth.OAuth2();
            // console.log('Token cargado desde', TOKEN_PATH, ' y autorizado con ', auth);
            auth.setCredentials(credentials);

            // Verificar si el token sigue válido
            if (credentials.expiry_date && Date.now() > credentials.expiry_date) {
                // console.log('Token expirado, renovando...');
                auth = null;
            }
        } catch (error) {
            console.log(`No se encontró token válido, autenticando... ${error.message}`);
        }

        // Si no hay token válido, autenticar
        if (!auth) {
            auth = await authenticate({
                keyfilePath: credentialsPath,
                scopes: SCOPES
            });

            // console.log('Autenticado con éxito escribiendo en el token');
            // Guardar token para uso futuro
            await writeFile(TOKEN_PATH, JSON.stringify(auth.credentials));
        }

        // Crear cliente de Sheets
        const sheets = google.sheets({ version: 'v4', auth });
        

        // Obtener datos
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId || '',
            range: 'search!A1:AZ',
        });

        console.log(`Descargadas ${result.data.values?.length || 0} filas`);
        const values = result.data.values;
        return values;
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
        console.log(`Buscando en: ${path.join(process.cwd(), 'src','core','enrichers', 'spreadSheet', 'credentials.json')}`)
      return path.join(process.cwd(), 'src','core','enrichers', 'spreadSheet', 'credentials.json');
    } else {
      // Modo producción con electron-builder
      // electron-builder coloca extraResources en diferentes ubicaciones:
      
      if (process.platform === 'darwin') {
        // macOS: dentro del .app bundle
        console.log(`Buscando en: ${path.join(process.resourcesPath, 'credentials.json')}`)
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
// async function main(){
//     const data = await SpreadSheetManager.processData(false);
//     for (let row of data) {
//         console.log(row);
//     }
//     console.log("Data length ", data.length);
// }
// main();

// async function obtainRepeatedData(data) {
//     if (!data) {
//         const readedData = readFileSync('data2.json', 'utf8');
//         data = JSON.parse(readedData);
//     }
//     const headers = data[0];
//     const realData = data.slice(1);
//     console.log("Header ", headers)
//     let count = 0;
//     findRepeteadCause(realData);
// }

// function findRepeteadCause(data) {
//     const findedCauses = [];
//     for (let line of data) {
//         const { causa, juzgado, comuna, rol } = processNewRow(line);
//         // console.log(causa, juzgado, comuna, rol);
//         // processNewRow(line);
//     }
// }
