



document.getElementById('logButton').addEventListener('click',async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
  
    // Verifica que window.api exista antes de usarla
    if (window.api && window.api.logDates) {
      await window.api.logDates(startDate, endDate);
      alert('¡Éxito! Los datos se han registrado correctamente.');
    } else {
      console.error('La API no está disponible.');
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
  