const selectFileBtn = document.getElementById('select-folder-btn');
const fileInfo = document.getElementById('file-input');
const completeInfoBtn = document.getElementById('completeInfo');

console.log('Renderer funcionando')
let filePath = null;

selectFileBtn.addEventListener('click', async () => {
    try {
        filePath = await window.completeInfoAPI.openFileLocal();
        
        if (filePath) {
            fileInfo.value = `${filePath}`;
        }
    } catch (error) {
        console.error('Error al seleccionar archivo:', error);
        fileInfo.textContent = 'Error al seleccionar archivo';
    }
});


completeInfoBtn.addEventListener('click', async()  =>{
    try{
        const result = await window.completeInfoAPI.completeInfoFromExcel(filePath);
    }catch(error){
        console.log('Error al buscar los datos: ', error.message);
        alert('Error al completar el excel');
    }

})