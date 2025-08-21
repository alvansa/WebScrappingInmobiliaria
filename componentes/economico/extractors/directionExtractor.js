
function extractDirection(data) {
    const dataNormalizada = data.replace(/(\d+)\.(\d+)/g, '$1$2');
    const dataMinuscula = dataNormalizada.toLowerCase();
    // console.log("Data minuscula: ", dataMinuscula);

    const palabrasClave = ['propiedad', 'inmueble', 'departamento', 'casa'];
    const comuna = 'comuna';
    const direcciones = [];

    for (let palabra of palabrasClave) {
        const regex = new RegExp(`(?<!registro de )${palabra}`, 'g');
        const match = regex.exec(dataMinuscula);

        if (!match) {
            continue;
        }

        const index = match.index;
        let fin = dataMinuscula.indexOf(comuna);
        const direccionTemporal = dataMinuscula.substring(index);
        fin = direccionTemporal.indexOf('.');

        if (fin !== -1) {
            const direccion = direccionTemporal.substring(0, fin);
            direcciones.push(direccion);
            return direccion; // Devuelve la primera dirección encontrada
        }
    }

    if (direcciones.length > 0) {
        return direcciones.at(-1);
    }

    return null;
}

module.exports = {extractDirection}