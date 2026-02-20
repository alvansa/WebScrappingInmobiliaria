
const checkFPMG = document.getElementById('openLadrillero');
// const checkFPMG = document.getElementById('checkFPMG');
let tribunalesPorCorte  = [];
console.log('Renderer loaded succefully')

// Manejo de notificaciones de espera con Modal
window.api.onWaitingNotification((args) => {
  const totalSeconds = args[0];
  const actualCase = args[1];
  const totalCases = args[2];
  showWaitingModal(true, `Esperando (${totalSeconds}s)... Caso ${actualCase} de ${totalCases}`);
  
  let remaining = totalSeconds;
  updateCountdown([remaining,actualCase,totalCases]);
  
  countdownInterval = setInterval(() => {
    remaining--;
    updateCountdown([remaining,actualCase,totalCases]);
    
    if (remaining <= 0) {
      console.log("Se acabo el tiempo");
      clearInterval(countdownInterval);
      showWaitingModal(false);
    }
  }, 1000);
});

// window.api.electronLog((event, message) => {
//   console.log('Mensaje del proceso principal:', message);
//   alert(`Mensaje del proceso principal:\n${message}`);
// });

function updateCountdown(data) {
  const seconds = data[0];
  const actualCase = data[1];
  const totalCases = data[2];
  // document.getElementById('seconds').textContent = Math.floor(seconds);
  document.getElementById('waitingMessage').textContent = 
    `Esperando (${Math.floor(seconds)}s) segundos para procesar el caso ${actualCase} de ${totalCases}...`;
}

function showWaitingModal(show) {
  const modal = document.getElementById('waitingModal');
  modal.style.display = show ? 'flex' : 'none';
  if (!show && countdownInterval) clearInterval(countdownInterval);
}



// document.getElementById('select-excel-file-btn').addEventListener('click', async()=>{
//   const excelInput = document.getElementById('excel-input'); // Obtén el input
//   const excelPath = await window.api.selectExcelPath();

//   if (excelPath) {
//     excelInput.value = excelPath;
//   } else {
//     excelInput.value = 'No se seleccionó ninguna carpeta.';
//   }
// });


document.getElementById('openSearchWindow').addEventListener('click', () => {
  console.log('presionado send en el renderer de search')
  window.api.openWindow('search'); 
});

document.getElementById('openSingleCaseWindow').addEventListener('click', () => {
  window.api.openWindow('singleCase'); 
});

document.getElementById('openExcelWindow').addEventListener('click', () => {
  window.api.openWindow('excel'); 
});


document.getElementById('openSettingsWindow').addEventListener('click', () => {
  window.api.openWindow('settings'); 
});

// checkFPMG.addEventListener('click', async () => { 
//   showWaitingProcess(true);
//   // Llama a tu función que procesa el archivo
//   await window.ladrilleroAPI.checkFPMG();
//   showWaitingProcess(false)
//   alert('Ladrillos Obtenidos');
// });

function showWaitingProcess(show){
  const modal = document.getElementById('waitingModalProcess');
  modal.style.display = show ? 'flex' : 'none';
}

function showWaitingProcessLadrillo(show){
  const modal = document.getElementById('ladrilloWaitingModalProcess');
  modal.style.display = show ? 'flex' : 'none';
}

window.api.onMessage((msg)=>{
  console.log(msg)
})


checkFPMG.addEventListener('click', async () => {
  updateModal({ type: 'progress', percentage: 0, message: 'Iniciando proceso...' });
  try {
    const filePath = true;

    if (filePath) {
      showWaitingProcessLadrillo(true);
      // Llama a tu función que procesa el archivo
      await window.ladrilleroAPI.checkFPMG2((progressData) =>{
        console.log('Progreso:', progressData);
        updateModal(progressData)
      });
      showWaitingProcessLadrillo(false)
      alert('Ladrillos Obtenidos');
    }

  } catch (error) {
    console.error('Error al seleccionar archivo:', error);
    showWaitingProcessLadrillo(false)
    alert('Ocurrio un error al obtener los ladrillos');
  }finally{
  }

});

function updateModal(data) {
  const modal = document.getElementById('ladrilloWaitingModalProcess');
  const content = document.getElementById('modalContent');
  
  if (data.type === 'status') {
    content.innerHTML = `<p>📊 ${data.message}</p>`;
  } else if (data.type === 'progress') {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${data.percentage}%`;
    progressBar.textContent = `${data.percentage}%`;
  } else if (data.type === 'item') {
    content.innerHTML += `<p>✅ Procesado: ${data.item}</p>`;
  }
  
  // Auto-scroll al último mensaje
  modal.scrollTop = modal.scrollHeight;
}

