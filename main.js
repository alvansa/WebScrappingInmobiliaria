const {app, BrowserWindow} = require('electron')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Habilita Node.js en el renderer process
            contextIsolation: false, // Deshabilita el aislamiento de contexto (opcional, solo si usas Node.js)
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