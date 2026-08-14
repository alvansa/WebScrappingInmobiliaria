const checkDeuda = document.getElementById('buscarDeuda');
const fileBtn = document.getElementById('select-folder-btn');


checkDeuda.addEventListener('click', async () => {
  try {
    // const filePath = await window.ladrilleroAPI.openFileLocal();
      let fechaLimite = null;
    
    // if (filePath) {
      // fileInfo.textContent = `Archivo seleccionado: ${filePath}`;
      
      showWaitingProcess(true);
      // Llama a tu función que procesa el archivo
      const result = await window.api.checkDEUDA(fechaLimite);
      if(result){
        alert('Proceso de deuda finalizado con éxito');
      }else{
        alert('No hay casos de deuda para procesar');
      }

    // }
  } catch (error) {
    console.error('Error al buscar deuda:', error);
  }finally{
    showWaitingProcess(false)
  }

});

fileBtn.addEventListener('click', async () => {
  // Llama al proceso principal para abrir el selector de carpetas
  const folderPath = await window.ladrilleroAPI.selectFolder();
  console.log("Path escogido: ", folderPath);
  const folderInput = document.getElementById('folder-input'); // Obtén el input

  if (folderPath) {
    console.log('Carpeta seleccionada:', folderPath);
    folderInput.value = folderPath;
  } else {
    console.log('Selección cancelada.');
    folderInput.value = 'No se seleccionó ninguna carpeta.';
  }
});

function showWaitingProcess(show){
  const modal = document.getElementById('waitingModalProcess');
  modal.style.display = show ? 'flex' : 'none';
}