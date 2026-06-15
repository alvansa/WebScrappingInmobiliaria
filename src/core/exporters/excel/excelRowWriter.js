const {fixStringDate, transformDateString} = require(`#utils/cleanStrings.js`);
const columnMapping = require('#utils/columnMapping.js');

class ExcelRowWriter {
    static async writeRow(ws, currentRow, caso) {

        if (caso.fechaPublicacion && caso.fechaPublicacion instanceof Date) {
            ws[`${columnMapping.INICIO}` + currentRow] = { v: caso.fechaPublicacion, t: 'd', z: 'dd/mm/yyyy' };
        }
        this.writeLine(ws, `${columnMapping.ESTADO}`, currentRow, caso.tp, 's');
        if (caso.fechaObtencion && caso.fechaObtencion instanceof Date) {
            ws[`${columnMapping.FECHA_DESC}` + currentRow] = { v: caso.fechaObtencion, t: 'd', z: 'dd/mm/yyyy' };
        }
        this.writeLine(ws, `${columnMapping.ORIGEN}`, currentRow, caso.link, 's');
        this.writeLine(ws, `${columnMapping.ESTADO}`, currentRow, caso.tp, 's');

        if (caso.fechaRemate && caso.fechaRemate instanceof Date) {
            ws[`${columnMapping.FECHA_REM}` + currentRow] = { v: caso.fechaRemate, t: 'd', z: 'DD/MM/YYYY' };
        }
        this.writeLine(ws, `${columnMapping.MARTILLERO}`, currentRow, caso.martillero, 's');

        if (caso.tipoDerecho) {
            this.writeLine(ws, `${columnMapping.MARTILLERO}`, currentRow, caso.tipoDerecho, 's');
        } else if (caso.isPaid) {
            this.writeLine(ws, `${columnMapping.MARTILLERO}`, currentRow, "(Pagado)", 's');
        } else if (caso.isAvenimiento) {
            this.writeLine(ws, `${columnMapping.MARTILLERO}`, currentRow, "(Avenimiento)", 's');
        }

        this.writeLine(ws, `${columnMapping.DIRECCION}`, currentRow, caso.unitDireccion, 's');
        this.writeLine(ws, `${columnMapping.CAUSA}`, currentRow, caso.causa, 's');
        this.writeLine(ws, `${columnMapping.TRIBUNAL}`, currentRow, caso.juzgado, 's');
        this.writeLine(ws, `${columnMapping.COMUNA_TRIBUNAL}`, currentRow, this.getComunaJuzgado(caso.juzgado), 's');
        this.writeLine(ws, `${columnMapping.COMUNA}`, currentRow, caso.comuna, 's');
        this.writeLine(ws, `${columnMapping.ANNO}`, currentRow, caso.anno, 'n');
        this.writeLine(ws, `${columnMapping.PARTES}`, currentRow, caso.partes, 's');
        this.writeLine(ws, `${columnMapping.DATO}`, currentRow, caso.metros, 's');
        this.writeLine(ws, `${columnMapping.VV_O_CUPON}`, currentRow, caso.formatoEntrega, 's');
        this.writeLine(ws, `${columnMapping.PORCENTAJE}`, currentRow, caso.porcentaje, 's');
        this.writeLine(ws, `${columnMapping.PLAZOVV}`, currentRow, caso.diaEntrega, 's');
        // ws[`T`+ currentRow ] = {v: caso.rolPropiedad, t: 's'};
        // ws[`U`+ currentRow ] = {v: 'deuda 2 ', t: 's'};
        // ws[`V`+ currentRow ] = {v: 'deuda 3 ', t: 's'};

        // Union de roles de propiedad, estacionamiento y bodega
        this.writeLine(ws, `${columnMapping.ROL}`, currentRow, caso.unitRol, 's');

        // ws[`X`+ currentRow ] = {v: 'notif ', t: 's'};
        // Formato de monto minimo segun el tipo de moneda
        if (caso.montoMinimo > 100) {
            if (caso.moneda === `UF`) {
                ws[`${columnMapping.PRECIO_MINIMO}` + currentRow] = { v: parseFloat(caso.montoMinimo), t: 'n', z: '#,##0.0000' };
            }
            else if (caso.moneda == `Pesos`) {
                ws[`${columnMapping.PRECIO_MINIMO}` + currentRow] = { v: parseFloat(caso.montoMinimo), t: 'n', z: '#,##0' };
            }
            this.writeLine(ws, `${columnMapping.PRECIO_MINIMO2}`, currentRow, caso.moneda, 's');
        }
        if (caso.montoMinimo2) {
            this.writeLine(ws, `${columnMapping.PRECIO_MINIMO2}`, currentRow, caso.montoMinimo2, 'n');
        }
        if (caso.avaluoPropiedad != null) {
            // const sumAvaluo = this.sumAvaluo(caso.avaluoPropiedad, caso.avaluoEstacionamiento, caso.avaluoBodega);
            ws[`${columnMapping.AVALUO_FISCAL}` + currentRow] = { v: caso.unitAvaluo, t: 'n', z: '#,##0' };
        }
        this.writeLine(ws, `${columnMapping.ESTADO_CIVIL}`, currentRow, caso.estadoCivil, "s");
        if (caso.montoCompra && caso.montoCompra.monto) {
            ws[`${columnMapping.PX_COMPRA}` + currentRow] = { v: caso.montoCompra.monto, t: 'n' };
        }
        this.writeLine(ws, `${columnMapping.ANNO_COMPRA}`, currentRow, caso.anno, "n");
        this.writeLine(ws, `${columnMapping.DEUDA_BANCO}`, currentRow, `Tod ${caso.mortageBank}`, 's');
        this.writeLine(ws, `${columnMapping.DEUDA_HIPOTECA}`, currentRow, caso.deudaHipotecaria, "s");
        this.writeLine(ws, `${columnMapping.DEUDA_PAGARE}`, currentRow, caso.deudaPagare, "s");
        this.writeLine(ws, `${columnMapping.OTRA_DEUDA}`, currentRow, caso.linkMap, 's');
        // ws[`AG` + currentRow ] = {v: 'año compr ant ', t: 's'};
        // ws[`AH` + currentRow ] = {v: 'precio venta nos ', t: 's'};
    }

    static async writeMacalRow(ws, currentRow, caso) {
        // writeLine(ws, `${columnMapping.INICIO}`, currentRow, caso.causa, 's');
        writeLine(ws, `${columnMapping.ORIGEN}`, currentRow, `https://www.macal.cl/propiedades/${caso.id}`, 's');
        writeLine(ws, `${columnMapping.MARTILLERO}`, currentRow, 'MACAL', 's');
        writeLine(ws, `${columnMapping.DIRECCION}`, currentRow, caso.property_name, 's');

        const fechaRemateFixed = transformDateString(caso.auction.auction_date);

        if (fechaRemateFixed) {
            writeLine(ws, `${columnMapping.FECHA_REM}`, currentRow, fechaRemateFixed, 'd');
        }

        // writeLine(ws, `${columnMapping.DATO}`, currentRow, caso.property_dimensions, 'n');

        writeLine(ws, `${columnMapping.PRECIO_MINIMO}`, currentRow, caso.property_price.price, 'n');
        // writeLine(ws, `${columnMapping.AVALUO_FISCAL}`, currentRow, caso.avaluoFiscal, 'n');
        if (caso.property_location) {
            writeLine(ws, `${columnMapping.COMUNA}`, currentRow, caso.property_location.commune, 's');
        }
        if (caso.property_location) {
            const lat = caso.property_location.lat || null;
            const lon = caso.property_location.lng || null;
            const link = `https://www.google.com/maps/place/${lat},${lon}`;
            writeLine(ws, `${columnMapping.OTRA_DEUDA}`, currentRow, link, 's');
        }

        if (caso.general_features) {
            const featuresSummary = this.createFeaturesSummary(caso.general_features);
            writeLine(ws, `${columnMapping.DATO}`, currentRow, featuresSummary, 's');
        }

        if (caso.other_features) {
            const rol = caso.other_features.find(feat => feat.label.toLowerCase().includes('rol de '));
            if (rol) {
                writeLine(ws, `${columnMapping.ROL}`, currentRow, rol.value, 's');
            }
            const estado_ocupacion = caso.other_features.find(feat => feat.label.toLowerCase().includes('disponibilidad'));
            if (estado_ocupacion) {
                writeLine(ws, `${columnMapping.OCUPACION}`, currentRow, estado_ocupacion.value, 's');
            }
            const rolCausa = caso.other_features.find(feat => feat.label.toLowerCase().includes('causa'));
            if (rolCausa) {
                writeLine(ws, `${columnMapping.CAUSA}`, currentRow, rolCausa.value, 's');
            }
            const mandante = caso.other_features.find(feat => feat.label.toLowerCase().includes('mandante'));
            if (mandante) {
                writeLine(ws, `${columnMapping.TRIBUNAL}`, currentRow, mandante.value, 's');

            }
        }

    }

    // Dado un juzgado, obtiene la comuna del juzgado
    static getComunaJuzgado(juzgado) {
        if (juzgado == null) {
            return null;
        }
        const juzgadoNormalizado = juzgado.toLowerCase();
        const comunaJuzgado = juzgadoNormalizado.split("de ").at(-1);
        return comunaJuzgado;
    }
    static writeLine(ws, row, col, value, type) {
        if (value != null) {
            ws[row + col] = { v: value, t: type };
        }
    }

    static createFeaturesSummary(generalFeatures) {
        if (!Array.isArray(generalFeatures)) return '';

        const features = {};
        const mappings = {
            'dormitorio': 'd', 'dormitorios': 'd',
            'baño': 'b', 'baños': 'b', 'bano': 'b', 'banos': 'b',
            'estacionamiento': 'est',
            'bodega': 'bod',
            'superficie': 'm2', 'superficie útil': 'm2', 'terreno': 'm2'
        };

        generalFeatures.forEach(({ label, value }) => {
            const labelLower = label?.toLowerCase();
            if (!labelLower || !value) return;

            for (const [key, abbr] of Object.entries(mappings)) {
                if (labelLower.includes(key)) {
                    if (abbr === 'm2') {
                        // Para metros: limpiar y mantener formato
                        if(value.toLowerCase().includes('m2')){
                            const cleanValue = value.replace(/[^\d\s]2/g, '').trim();
                            features[abbr] = cleanValue ? cleanValue + 'm2' : value;
                        }else{
                            const numericValue = value.replace(/[^\d]/g, '');
                            if (numericValue) features[abbr] = numericValue + 'ha';
                        }
                    } else {
                        // Para otras: solo el número
                        const numericValue = value.replace(/[^\d]/g, '');
                        if (numericValue) features[abbr] = numericValue + abbr;
                    }
                    break;
                }
            }
        });

        return ['d', 'b', 'est', 'bod', 'm2']
            .map(abbr => features[abbr])
            .filter(Boolean)
            .join('-');
    }
}

module.exports = ExcelRowWriter;