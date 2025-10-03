const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const fs = require('fs');
const { writeFile, readFile } = require('fs').promises;
const { readFileSync } = require('fs');

require('dotenv').config();

const config = require('../../config');


// const isDev = process.argv.includes('--dev');

// The scope for reading spreadsheets.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];


class SpreadSheetManager {
    static async processData(isDev) {
        let data = null;
        // const credentials = this.createCredentials();
        try {
            if(!isDev){
                // data = await this.obtainOnlineData();
            }else{
                const filePath = path.join(__dirname, 'data.json');

                if (!fs.existsSync(filePath)) {
                    console.error('❌ Archivo data.json no encontrado en:', filePath);
                }else{
                    console.log("El archivo si existe")
                }
                data = readFileSync(filePath, 'utf8');
                data = JSON.parse(data); 
            }

        } catch (error) {
            console.error("Error: ", error.message);
        }
        return data;
    }

    static async obtainOnlineData() {
        // Authenticate with Google and get an authorized client.
        const auth = new google.auth.GoogleAuth({
            credentials :{
                type: "service_account",
                client_id : process.env.GOOGLE_CLIENT_ID,
                project_id : process.env.GOOGLE_PROJECT_ID,
                auth_uri : process.env.GOOGLE_AUTH_URI,
                token_uri: process.env.GOOGLE_TOKEN_URI,
                auth_provider_x509_cert_url : process.env.GOOGLE_AUTH_PROVIDER,
                client_secret : process.env.GOOGLE_CLIENT_SECRET,
                redirect_uris : process.env.GOOGLE_REDIRECTS_URI 
            },
            scopes : SCOPES
        });

        // Create a new Sheets API client.
        const sheets = google.sheets({ version: 'v4', auth });
        // Get the values from the spreadsheet.
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID || '',
            range: 'search!A1:AT',
        });

        console.log(`Descargadas ${result.data.values?.length || 0} filas`);
        const rawData = result.data.values || 0;

        return rawData;
    }

    static createCredentials(){
        return {

        }
    }
}

module.exports = SpreadSheetManager;

async function obtainRepeatedData(data) {
    if (!data) {
        const readedData = readFileSync('data2.json', 'utf8');
        data = JSON.parse(readedData);
    }
    const headers = data[0];
    const realData = data.slice(1);
    console.log("Header ", headers)
    let count = 0;
    findRepeteadCause(realData);
}

function findRepeteadCause(data) {
    const findedCauses = [];
    for (let line of data) {
        const { causa, juzgado, comuna, rol } = processNewRow(line);
        console.log(causa, juzgado, comuna, rol);
        // processNewRow(line);
    }
}
