const checkFPMG = document.getElementById('checkFPMG');
const fileInfo = document.getElementById('fileInfo');

checkFPMG.addEventListener('click', async () => {
  try {
    // const filePath = await window.ladrilleroAPI.openFileLocal();
    if (filePath) {
      showWaitingProcess(true);
      // Llama a tu función que procesa el archivo
      await window.ladrilleroAPI.checkFPMG2((progressData) =>{
        console.log('Progreso:', progressData);
        updateModal(progressData)
      });
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

function updateModal(data) {
  const modal = document.getElementById('waitingModalProcess');
  const content = document.getElementById('modalContent');
  
  if (data.type === 'status') {
    content.innerHTML += `<p>📊 ${data.message}</p>`;
  } else if (data.type === 'progress') {
    const progressBar = document.getElementById('progressBar');
    // progressBar.style.width = `${data.percentage}%`;
    // progressBar.textContent = `${data.percentage}%`;
  } else if (data.type === 'item') {
    content.innerHTML += `<p>✅ Procesado: ${data.item}</p>`;
  }
  
  // Auto-scroll al último mensaje
  modal.scrollTop = modal.scrollHeight;
}