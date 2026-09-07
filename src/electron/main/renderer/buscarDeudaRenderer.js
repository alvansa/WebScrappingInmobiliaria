const checkDeuda = document.getElementById('buscarDeuda');
const endDateInput = document.getElementById('endDate');

checkDeuda.addEventListener('click', async () => {
  const fechaLimite = endDateInput.value;
  if (!fechaLimite) {
    alert('Selecciona una fecha límite antes de buscar.');
    return;
  }

  checkDeuda.disabled = true;
  const dialog = window.AppUI.createWorkingDialog({ text: 'Buscando deudas...' });
  try {
    const result = await window.api.checkDEUDA(null, fechaLimite);
    if (result) {
      alert('Proceso de deuda finalizado con éxito');
    } else {
      alert('No hay casos de deuda para procesar');
    }
  } catch (error) {
    console.error('Error al buscar deuda:', error);
    alert('Error al buscar deudas');
  } finally {
    checkDeuda.disabled = false;
    window.AppUI.closeWorkingDialog(dialog);
  }
});
