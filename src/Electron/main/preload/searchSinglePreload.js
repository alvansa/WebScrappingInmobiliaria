const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('searchSingleAPI', {
    // Funcion para que el main le pueda entregar al renderer el listado de cortes y juzgados.
    obtainTribunalesJuzgado: async () => {
        const result = await ipcRenderer.invoke('obtainTribunalesJuzgado');
        console.log('Obteniendo tribunales');
        return result;
    },
    // Busca un caso a partir de sus datos en la pagina del pjud, busca, descarga y procesa los pdf.
    searchCase: async (corte, tribunal, juzgado, rol, year) => {
        result = ipcRenderer.invoke('search-case', corte, tribunal, juzgado, rol, year)
        return result;
    },
});