const XLSX = require(`xlsx`);
const path = require(`path`);

const columnMapping = require('../../../../utils/columnMapping.js');


class excelTemplateBuilder {
    static buildTemplate(saveFile) {
        // Crea una hoja de cálculo vacía
        const ws = {};

        ws[`${columnMapping.INICIO}5`] = { v: 'vacia', t: 's' };
        ws[`${columnMapping.ESTADO}5`] = { v: 'status', t: 's' };
        ws[`${columnMapping.FECHA_DESC}5`] = { v: 'F.Desc', t: 's' };
        ws[`${columnMapping.ORIGEN}5`] = { v: 'origen', t: 's' };
        ws[`${columnMapping.NOTAS}5`] = { v: 'notas', t: 's' };
        ws[`${columnMapping.FECHA_REM}5`] = { v: 'F. remate', t: 's' };
        ws[`${columnMapping.HORA_REMATE}5`] = { v: 'Hora', t: 's' };
        ws[`${columnMapping.OCUPACION}5`] = { v: 'Luz', t: 's' };
        ws[`${columnMapping.OCUPACION2}5`] = { v: 'Agua', t: 's' };
        ws[`${columnMapping.MARTILLERO}5`] = { v: 'macal', t: 's' };
        ws[`${columnMapping.DIRECCION}5`] = { v: 'direccion', t: 's' };
        ws[`${columnMapping.CAUSA}5`] = { v: 'causa', t: 's' };
        ws[`${columnMapping.TRIBUNAL}5`] = { v: 'tribunal', t: 's' };
        ws[`${columnMapping.COMUNA_TRIBUNAL}5`] = { v: 'comuna tribunal', t: 's' };
        ws[`${columnMapping.COMUNA}5`] = { v: 'comuna propiedad', t: 's' };
        ws[`${columnMapping.ANNO}5`] = { v: 'año inscripcion', t: 's' };
        ws[`${columnMapping.PARTES}5`] = { v: 'partes', t: 's' };
        ws[`${columnMapping.DATO}5`] = { v: 'dato', t: 's' };
        ws[`${columnMapping.VV_O_CUPON}5`] = { v: 'vale vista o cupon', t: 's' };
        ws[`${columnMapping.PORCENTAJE}5`] = { v: '%', t: 's' };
        ws[`${columnMapping.PLAZOVV}5`] = { v: 'plazo vv', t: 's' };
        ws[`${columnMapping.CONTR_Y_ASEO}5`] = { v: 'contribu y aseo', t: 's' };
        ws[`${columnMapping.GGCC}5`] = { v: 'GGCC', t: 's' };
        ws[`${columnMapping.DEUDA2}5`] = { v: 'deuda 2', t: 's' };
        ws[`${columnMapping.DEUDA3}5`] = { v: 'deuda 3', t: 's' };
        ws[`${columnMapping.ROL}5`] = { v: 'rol', t: 's' };
        ws[`${columnMapping.NOTIFICACION}5`] = { v: 'notif', t: 's' };
        ws[`${columnMapping.PRECIO_MINIMO}5`] = { v: 'preciominimo', t: 's' };
        ws[`${columnMapping.PRECIO_MINIMO2}5`] = { v: 'UF o $', t: 's' };
        ws[`${columnMapping.AVALUO_FISCAL}5`] = { v: 'avaluo fiscal', t: 's' };
        ws[`${columnMapping.ESTADO_CIVIL}5`] = { v: 'estado civil', t: 's' };
        ws[`${columnMapping.PX_COMPRA}5`] = { v: 'Px $ compra ant', t: 's' };
        ws[`${columnMapping.ANNO_COMPRA}5`] = { v: 'año compr ant', t: 's' };
        ws[`${columnMapping.PRECIO_VENTA_NOS}5`] = { v: 'precio venta nos', t: 's' };
        ws[`${columnMapping.POSTURA_MAXIMA}5`] = { v: 'max', t: 's' };
        ws[`${columnMapping.PORCENTAJE_POSTURA}5`] = { v: '%', t: 's' };
        ws[`${columnMapping.UF_M}5`] = { v: 'UF/m2', t: 's' };


        ws[`${columnMapping.DEUDA_BANCO}5`] = { v: 'deuda bco', t: 's' };
        ws[`${columnMapping.DEUDA_HIPOTECA}5`] = { v: 'Deuda Hipotecaria', t: 's' };
        ws[`${columnMapping.DEUDA_PAGARE}5`] = { v: 'Deuda pagare', t: 's' };
        ws[`${columnMapping.DEUDA_TGR}5`] = { v: 'Deuda tgr', t: 's' };

        // Ajusta el ancho de las columnas
        this.cambiarAnchoColumnas(ws);

        // Define el rango de la hoja para asegurar que incluya todas las celdas especificadas
        ws[`!ref`] = `${columnMapping.INICIO}5:${config.COMENTARIOS3}5`;

        // Crea un nuevo libro y agrega la hoja
        const wb = XLSX.utils.book_new();
        wb.Props = {
            Title: `Remates`,
            Subject: `Remates`
        };
        // Agrega la hoja al libro de trabajo
        XLSX.utils.book_append_sheet(wb, ws, `Remates`);
        // Guarda el archivo
        XLSX.writeFile(wb, path.join(saveFile, `Remates.xlsx`));
    }
    static cambiarAnchoColumnas(ws) {
        ws[`!cols`] = [
            { wch: 15 },  // A
            { wch: 15 },  // B
            { wch: 20 },  // C
            { wch: 70 },  // D
            { wch: 25 },  // E
            { wch: 15 },  // F
            { wch: 15 },  // G
            { wch: 15 },  // H
            { wch: 30 },  // I
            { wch: 20 },  // J
            { wch: 15 },  // K
            { wch: 30 },  // L
            { wch: 15 },  // M
            { wch: 20 },  // N
            { wch: 15 },  // O
            { wch: 60 },  // P
            { wch: 15 },  // Q
            { wch: 20 },  // R
            { wch: 15 },  // S
            { wch: 30 },  // T
            { wch: 15 },  // U
            { wch: 30 },  // V
            { wch: 10 },  // W
            { wch: 30 },  // X
            { wch: 15 },  // Y
            { wch: 15 },  // Z
            { wch: 15 },  // AA
            { wch: 15 },  // AB
            { wch: 15 },  // AC
            { wch: 15 },  // AD
            { wch: 25 },  // AE
            { wch: 15 },  // AF
            { wch: 15 },  // AG
            { wch: 15 },  // AH
            { wch: 15 },  // AI
            { wch: 15 },  // AJ
            { wch: 15 },  // AK
            { wch: 15 },  // AL
            { wch: 15 },  // AM
            { wch: 15 },  // AN
            { wch: 15 },  // AO
            { wch: 15 },  // AP
            { wch: 15 },  // AQ
            { wch: 25 },  // AR
        ];
    }
}

module.exports = excelTemplateBuilder;