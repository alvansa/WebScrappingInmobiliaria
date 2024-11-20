const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('node:path');


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
            width: 800,
            height: 600,
            webPreferences: {
                preload: path.join(__dirname, './Electron/preload.js'), // Archivo que se ejecutará antes de cargar el renderer process
                nodeIntegration: true
            },
        })
    
        this.mainWindow.loadFile('index.html')
        this.registerIpcHandlers();
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

new MainApp();
