const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('node:path');
const PDFParser = require( 'pdf2json' );


class MainApp{
    constructor(){
        this.mainWindow = null;

        // // Bind methods
        // this.createWindow = this.createWindow.bind(this);
        // this.registerIpcHandlers = this.registerIpcHandlers.bind(this);

        app.whenReady().then(()=>{
            this.createMainWindow()
            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    createWindow()
                }
            })
        })
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit()
            }
        })

    }


    createMainWindow(){
        this.mainWindow = new BrowserWindow({
            width: 700,
            height: 500,
            webPreferences: {
                preload: path.join(__dirname, './Electron/preload.js'), // Archivo que se ejecutará antes de cargar el renderer process
                nodeIntegration: true
            },
        })
    
        this.mainWindow.loadFile('index.html')
        this.registerIpcHandlers();

        ipcMain.handle('update-progress', (event, message) => {
            // Envía el progreso al renderizador
            event.sender.send('progress-update', message);
        });
    }

    // Manejar solicitud para abrir el selector de carpetas
    registerIpcHandlers(){
        ipcMain.handle('select-folder-btn', async () => {
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openDirectory'] // Permite seleccionar carpetas
        });

        // Retornar la ruta seleccionada o null si el usuario cancela
        return result.canceled ? null : result.filePaths[0];
        });
    }
}

ipcMain.on('prefix-convert-pdf', (event, filePath) => {
    const pdfParser = new PDFParser(this,1);

    pdfParser.on('pdfParser_dataError', errData => {
        console.error('Error al procesar PDF:', errData.parserError);
        event.sender.send('prefix-pdf-converted-error', errData.parserError);
    });

    pdfParser.on('pdfParser_dataReady', pdfData => {
        console.log('PDF procesado exitosamente.');
        event.sender.send('prefix-pdf-converted', pdfParser.getRawTextContent());
    });

    try {
        pdfParser.loadPDF(filePath);
    } catch (error) {
        console.error('Error al cargar el archivo PDF:', error);
        event.sender.send('prefix-pdf-converted-error', error);
    }
});


new MainApp();
