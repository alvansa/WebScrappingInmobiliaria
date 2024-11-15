const {app, BrowserWindow} = require('electron');
const path = require('node:path');

const createWindow = () => {

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, './Electron/preload.js'), // Archivo que se ejecutará antes de cargar el renderer process
            nodeIntegration: true
        },
    })

    win.loadFile('index.html')
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})


app.whenReady().then(()=>{
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})


function mostrarResultados(resultados) {
    const divResultados = document.getElementById('resultados');
    divResultados.innerHTML = ''; // Limpiar contenido anterior

    resultados.forEach(resultado => {
        const p = document.createElement('p');
        p.textContent = resultado;
        divResultados.appendChild(p);
    });
}