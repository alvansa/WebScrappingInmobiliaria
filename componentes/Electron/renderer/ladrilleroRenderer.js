const checkFPMG = document.getElementById('checkFPMG');
const fileInfo = document.getElementById('fileInfo');

checkFPMG.addEventListener('click', async () => {
  try {
    // const filePath = await window.ladrilleroAPI.openFileLocal();
    
    if (filePath) {
      fileInfo.textContent = `Archivo seleccionado: ${filePath}`;
      
      showWaitingProcess(true);
      // Llama a tu función que procesa el archivo
      await window.ladrilleroAPI.checkFPMG(filePath);
      showWaitingProcess(false)
      alert('Ladrillos Obtenidos');
    }

  } catch (error) {
    console.error('Error al seleccionar archivo:', error);
    fileInfo.textContent = 'Error al seleccionar archivo';
    showWaitingProcess(false)
    alert('Ocurrio un error al obtener los ladrillos');
  }finally{
  }

});

function showWaitingProcess(show){
  const modal = document.getElementById('waitingModalProcess');
  modal.style.display = show ? 'flex' : 'none';
}