const { BrowserWindow } = require('electron');
const path = require('path');

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.mainWindow = null;
        this.browser = null; // Browser de Puppeteer compartido
    }

    setBrowser(browser) {
        this.browser = browser;
    }

    createMainWindow() {
        if (this.windows.has('main')) {
            const existing = this.windows.get('main');
            existing.focus();
        }
        console.log('Path del preload: ',path.join(__dirname,'../prod/preload.js'));

        const mainWindow = new BrowserWindow({
            width: 600,
            height: 500,
            resizable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload : path.join(__dirname, '../prod/preload.js'),
            },
            icon: path.join(__dirname, '../../assets/icon.png'),
            show: false // Ocultar hasta que esté listo
        });

        mainWindow.loadFile(path.join(__dirname, '../windows/index.html'));
        mainWindow.setMenu(null);
        
        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
        });

        mainWindow.on('closed', () => {
            this.windows.delete('main');
            this.mainWindow = null;
        });

        this.windows.set('main', mainWindow);
        this.mainWindow = mainWindow;
        return mainWindow;
    }

    createSearchWindow(options = {}) {
        if (this.windows.has('search')) {
            const existing = this.windows.get('search');
            existing.focus();
            console.log('Ya existe la ventana de búsqueda');
            return existing;
        }

        const searchWindow = new BrowserWindow({
            width: 700,
            height: 500,
            minWidth: 700,
            minHeight: 500,
            resizable: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload : path.join(__dirname, '../preload/searchPreload.js'),
            },
            parent: this.mainWindow,
            modal: options.modal || false,
            show: false
        });

        searchWindow.loadFile(path.join(__dirname, '../windows/searchAuction.html'));
        
        searchWindow.once('ready-to-show', () => {
            searchWindow.show();
        });

        searchWindow.on('closed', () => {
            this.windows.delete('search');
        });

        this.windows.set('search', searchWindow);
        // return searchWindow;
    }

    createSingleCaseWindow() {
        if (this.windows.has('single')) {
            const existing = this.windows.get('single');
            existing.focus();
        }

        const singleWindow = new BrowserWindow({
            width: 700,
            height: 500,
            minWidth: 700,
            minHeight: 500,
            resizable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload : path.join(__dirname, '../preload/searchSinglePreload.js'),
            },
            show: false
        });

        singleWindow.loadFile(path.join(__dirname, '../windows/searchSingleAuction.html'));
        
        singleWindow.once('ready-to-show', () => {
            singleWindow.show();
        });

        singleWindow.on('closed', () => {
            this.windows.delete('single');
        });

        this.windows.set('single', singleWindow);
        // return singleWindow;
    }

    createExcelWindow() {
        if (this.windows.has('excel')) {
            const existing = this.windows.get('excel');
            existing.focus();
        }

        const excelWindow = new BrowserWindow({
            width: 700,
            height: 500,
            minWidth: 700,
            minHeight: 500,
            resizable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload : path.join(__dirname, '../prod/preload.js'),
            },
            show: false
        });

        // excelWindow.loadFile(path.join(__dirname, '../../components/Electron/prod/excel.html'));
        
        excelWindow.once('ready-to-show', () => {
            excelWindow.show();
        });

        excelWindow.on('closed', () => {
            this.windows.delete('excel');
        });

        this.windows.set('excel', excelWindow);
        return excelWindow;
    }

    createLadrilleroWindow() {
        if (this.windows.has('ladrillero')) {
            const existing = this.windows.get('ladrillero');
            existing.focus();
            return existing;
        }

        const ladrilleroWindow = new BrowserWindow({
            width: 500,
            height: 400,
            minWidth: 400,
            minHeight: 400,
            resizable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload : path.join(__dirname, '../preload/ladrilleroPreload.js'),
            },
            show: false
        });

        ladrilleroWindow.loadFile(path.join(__dirname, '../windows/ladrillero.html'));
        
        ladrilleroWindow.once('ready-to-show', () => {
            ladrilleroWindow.show();
        });

        ladrilleroWindow.on('closed', () => {
            this.windows.delete('ladrillero');
        });

        this.windows.set('ladrillero', ladrilleroWindow);
        // return excelWindow;
    }

    createSettingsWindow() {
        if (this.windows.has('settings')) {
            const existing = this.windows.get('settings');
            existing.focus();
        }

        const settingsWindow = new BrowserWindow({
            width: 700,
            height: 500,
            minWidth: 700,
            minHeight: 500,
            resizable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload : path.join(__dirname, '../prod/preload.js'),
            },
            show: false
        });

        // settingsWindow.loadFile(path.join(__dirname, '../../components/Electron/prod/settings.html'));
        
        settingsWindow.once('ready-to-show', () => {
            settingsWindow.show();
        });

        settingsWindow.on('closed', () => {
            this.windows.delete('settings');
        });

        this.windows.set('settings', settingsWindow);
        return settingsWindow;
    }

    getWindow(name) {
        return this.windows.get(name);
    }

    getAllWindows() {
        return Array.from(this.windows.values());
    }

    closeAllWindows() {
        this.getAllWindows().forEach(window => {
            if (!window.isDestroyed()) {
                window.close();
            }
        });
        this.windows.clear();
    }

    broadcastToAll(event, data) {
        this.getAllWindows().forEach(window => {
            if (!window.isDestroyed()) {
                window.webContents.send(event, data);
            }
        });
    }
}

module.exports = WindowManager;