// src/Electron/main/renderer/shared/workingDialog.js
(function () {
  window.AppUI = window.AppUI || {};

  window.AppUI.createWorkingDialog = function ({
    text = 'Trabajando, por favor espere...',
    onStop = null,
    stopLabel = 'Detener',
  } = {}) {
    const dialog = document.createElement('div');
    dialog.id = 'workingDialog';
    Object.assign(dialog.style, {
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)', padding: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white',
      borderRadius: '10px', textAlign: 'center', zIndex: '9999',
    });

    const textNode = document.createElement('p');
    textNode.id = 'workingDialogText';
    textNode.textContent = text;
    textNode.style.marginBottom = '15px';
    dialog.appendChild(textNode);

    if (onStop) {
      const stopBtn = document.createElement('button');
      stopBtn.textContent = stopLabel;
      stopBtn.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded cursor-pointer';
      stopBtn.onclick = async () => {
        stopBtn.disabled = true;
        stopBtn.textContent = 'Deteniendo...';
        textNode.textContent = 'Deteniendo el proceso...';
        await onStop();
      };
      dialog.appendChild(stopBtn);
    }

    document.body.appendChild(dialog);
    return { element: dialog, setText: (t) => { textNode.textContent = t; } };
  };

  window.AppUI.closeWorkingDialog = function (dialogHandle) {
    if (dialogHandle?.element?.parentNode) {
      document.body.removeChild(dialogHandle.element);
    }
  };
})();