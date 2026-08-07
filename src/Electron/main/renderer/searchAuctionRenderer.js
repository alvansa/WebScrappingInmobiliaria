const EXITO = 0;
const NOT_AUCTIONS_FOUND = 5;
const searchButton = document.getElementById('logButton');
const stopButton = document.getElementById('stopButton');

stopButton?.addEventListener('click', async () => {
  if (window.searchAPI?.stopProcess) {
    stopButton.disabled = true;
    stopButton.textContent = 'Deteniendo...';
    const textNode = document.getElementById('workingDialogText');
    if (textNode) {
      textNode.textContent = 'Deteniendo el proceso y guardando datos en Excel...';
    }
    await window.searchAPI.stopProcess();
  }
});

searchButton.addEventListener('click', async () => {

  searchButton.disabled = true; // Deshabilita el botón al hacer clic
  if (stopButton) {
    stopButton.classList.remove('hidden');
    stopButton.disabled = false;
    stopButton.textContent = 'Detener y Guardar Excel';
  }

  const workingDialog = createDialog();

  try {
    const { startDate, endDate, saveFile } = getFormValues();
    const checkedBoxes = getCheckedBoxes();
    console.log(`Checked Boxes:  ${checkedBoxes} y tipo de checkedBoxes : ${typeof checkedBoxes}`);

    // Verifica que window.api exista antes de usarla
    if (!window.searchAPI?.startProcess) {
      console.log('Ocurrio un error con la API');
      return;
    }
    if (saveFile == 'No se seleccionó ninguna carpeta.' || !saveFile) {
      alert('No se ha seleccionado una carpeta para guardar los datos');
      return;
    }
    console.log(`Valores startDate : ${startDate} endDate :${endDate} saveFile: ${saveFile} checked: ${checkedBoxes}`)
    const result = await window.searchAPI.startProcess(startDate, endDate, saveFile, checkedBoxes);
    handleResults(result);
  } catch (error) {
    console.error('Ocurrió un error:', error);
  } finally {
    // Elimina el diálogo al finalizar
    if (workingDialog && workingDialog.parentNode) {
      document.body.removeChild(workingDialog);
    }
    searchButton.disabled = false; // Habilita el botón nuevamente
    if (stopButton) {
      stopButton.classList.add('hidden');
    }
  }
});

function getCheckedBoxesPre() {
  
  return {
    pjud: document.getElementById('pjud').checked,
    economico: document.getElementById('economicos').checked,
    PYL: document.getElementById('PYL').checked,
    liquidaciones: document.getElementById('liquidaciones').checked,
    macal: document.getElementById('macal').checked,
    capitalRemates:  document.getElementById('capitalremates').checked
  }
}

function getCheckedBoxes() {
  const checkboxIds = ['pjud', 'economicos', 'PYL', 'liquidaciones', 'macal', 'capitalremates'];

  const checkedIds = checkboxIds.filter(id => {
    const element = document.getElementById(id);
    return element ? element.checked : false;
  });

  console.log(`Checkboxes marcados: ${JSON.stringify(checkedIds)}`);
  return checkedIds;
}

document.getElementById('select-folder-btn').addEventListener('click', async () => {
  // Llama al proceso principal para abrir el selector de carpetas
  const folderPath = await window.searchAPI.selectFolder();
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

function createDialog() {
  // Crear y mostrar el diálogo de "Trabajando..."
  const workingDialog = document.createElement('div');
  workingDialog.id = 'workingDialog';
  workingDialog.style.position = 'fixed';
  workingDialog.style.top = '50%';
  workingDialog.style.left = '50%';
  workingDialog.style.transform = 'translate(-50%, -50%)';
  workingDialog.style.padding = '20px';
  workingDialog.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  workingDialog.style.color = 'white';
  workingDialog.style.borderRadius = '10px';
  workingDialog.style.textAlign = 'center';
  workingDialog.style.zIndex = '9999';

  const textNode = document.createElement('p');
  textNode.id = 'workingDialogText';
  textNode.textContent = 'Trabajando, por favor espere...';
  textNode.style.marginBottom = '15px';
  workingDialog.appendChild(textNode);

  const dialogStopBtn = document.createElement('button');
  dialogStopBtn.textContent = 'Detener y Guardar Excel';
  dialogStopBtn.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded cursor-pointer';
  dialogStopBtn.onclick = async () => {
    dialogStopBtn.disabled = true;
    dialogStopBtn.textContent = 'Deteniendo y guardando...';
    textNode.textContent = 'Deteniendo el proceso y guardando datos en Excel...';
    if (stopButton) {
      stopButton.disabled = true;
      stopButton.textContent = 'Deteniendo...';
    }
    if (window.searchAPI?.stopProcess) {
      await window.searchAPI.stopProcess();
    }
  };
  workingDialog.appendChild(dialogStopBtn);

  document.body.appendChild(workingDialog);
  return workingDialog;
}

function getFormValues() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const saveFile = document.getElementById('folder-input').value

  return { startDate, endDate, saveFile };
}

function handleResults(result) {
  if (!result) {
    alert('Ocurrió un error al obtener los datos. Por favor, intente nuevamente.');
    return;
  }
  const filePath = result.filePath;
  const status = result.status;
  const isStopped = result.isStopped;

  const messages = {
    null: 'Ocurrió un error al obtener los datos. Por favor, intente nuevamente.',
    0: 'No se ingresó ninguna de las fechas.',
    1: 'No se ingresó la fecha de inicio.',
    2: 'No se ingresó la fecha de fin.',
    3: 'La fecha de inicio es mayor a la fecha de fin.',
    4: 'No se seleccionó ninguna opción.',
    NOT_AUCTIONS_FOUND : 'Error: No se encontró ningún caso en el rango de fechas seleccionado.',
    6: 'Error: No se obtuvieron todos los datos, se han registrado los datos obtenidos en un archivo Excel, revise el archivo para más detalles.',
    default: 'Error al registrar los datos.',
  };

  if (status === EXITO) {
    if (isStopped) {
      alert(`¡Proceso detenido! Se guardaron los datos obtenidos hasta el momento en el archivo Excel:\n${filePath}`);
    } else {
      alert(`¡Éxito! Los datos se han registrado correctamente en el archivo: ${filePath}`);
    }
  } else {
    alert(messages[status] || messages[filePath] || messages.default);
  }
}
