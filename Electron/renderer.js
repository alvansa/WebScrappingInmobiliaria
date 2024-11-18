



document.getElementById('logButton').addEventListener('click', async () => {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

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
  workingDialog.textContent = 'Trabajando, por favor espere...';
  document.body.appendChild(workingDialog);

  try {
    // Verifica que window.api exista antes de usarla
    if (window.api && window.api.logDates) {
      const filePath = await window.api.logDates(startDate, endDate); // Operación que toma tiempo
      if (typeof(filePath) != 'number') {
        alert('¡Éxito! Los datos se han registrado correctamente en el archivo: ' + filePath);
      } else if (filePath == 0) {
        alert('No se ingreso ninguna de las fechas');
      }else if(filePath == 1){
        alert('No se ingreso la fecha de inicio');
      }
      else if (filePath == 2) {
        alert('No se ingreso la fecha de fin');
      }else {
        alert('Error al registrar los datos');
      }
    } else {
      console.error('La API no está disponible.');
    }
  } catch (error) {
    console.error('Ocurrió un error:', error);
  } finally {
    // Elimina el diálogo al finalizar
    document.body.removeChild(workingDialog);
  }
});


document.getElementById("showButton").addEventListener('click',async () => {
    // Verifica que window.api exista antes de usarla
    if (window.api && window.api.printConsole) {
      await window.api.printConsole("Hola desde el renderer");
    } else {
      console.error('La API no está disponible');
    }
  });
  