const SpreadSheetManager = require('./SpreadSheetManager.js');
const CasoBuilder = require('../caso/casoBuilder.js');

const config = require('../../config.js');
const {searchInList} = require('../../utils/corteJuzgado.js');


const indexEstado = config.obtenerNumero('ESTADO');
const indexFechaRem = config.obtenerNumero('FECHA_REM');
const indexOcupacion = config.obtenerNumero('OCUPACION');
const indexMartillero = config.obtenerNumero('MARTILLERO');
const indexDireccion = config.obtenerNumero('DIRECCION');
const indexCausa = config.obtenerNumero('CAUSA');
const indexJuzgado = config.obtenerNumero('TRIBUNAL');
const indexComuna = config.obtenerNumero('COMUNA');
const indexAno = config.obtenerNumero('ANNO');
const indexDato = config.obtenerNumero('DATO');
const indexRol = config.obtenerNumero('ROL');
const indexNotas = config.obtenerNumero('NOTAS');
const indexPrecioMinimo = config.obtenerNumero('PRECIO_MINIMO');    
const indexEstadoCivil = config.obtenerNumero('ESTADO_CIVIL');
const indexPrecioCompra = config.obtenerNumero('PX_COMPRA');
const indexDeudaBanco = config.obtenerNumero('DEUDA_BANCO');
const indexDeudaHipoteca = config.obtenerNumero('DEUDA_HIPOTECA');


const indexLinkMapa = config.obtenerNumero('OTRA_DEUDA');

class DataEnricher{
    constructor(){
        this.indexes = new Map();
        
    }

    enrichWithSpreadsheetData(casos, spreadSheetData){
        if(!casos || !spreadSheetData || casos.length == 0 || spreadSheetData.length == 0 ){
            return;
        }

        this.indexes.set('causa_juzgado', indexEstado);
        this.indexes.set('comuna_rol', indexEstado);

        const listAuctions = this.obtainKeys(spreadSheetData);

        this.searchAndEnrich(casos, spreadSheetData);

        // console.log(this.indexes)
    }


    obtainKeys(spreadSheetData){
        let index = 1;
        for(let row of spreadSheetData){
            if(index === 1){
                index++;
                continue; // Saltar la primera fila (encabezados)
            }

            const causa = this.normalizarCausa(row[indexCausa]);
            const juzgado = this.normalizarJuzgado(row[indexJuzgado]);
            const comuna = this.normalizarComuna(row[indexComuna]);
            const rol = this.normalizarRol(row[indexRol]);

            const key1 = `${causa}|${juzgado}`;
            this.indexes.set(key1, index);


            if(comuna && rol){
                const key2 = `${comuna}|${rol}`;
                this.indexes.set(key2, index);
            }

            index++;
        }
    }

    normalizarCausa(causa){
        if(!causa) return null;
        return causa.toLowerCase().replace(/\(s\)/i, '').replace(/S\/I/ig, '').trim();
    }

    normalizarJuzgado(juzgado){
        if(!juzgado) return null;
        return searchInList(juzgado);
    }
    
    normalizarComuna(comuna){
        if(!comuna) return null;
        return comuna.trim().toLowerCase();
    }   
    normalizarRol(rol){
        if(!rol) return null;
        let newRolRegex  = rol.match(/\d{1,}-\d{1,}/); 
        if(newRolRegex){
            return newRolRegex[0];
        }
        return null;
    }

    searchAndEnrich(casos, spreadSheetData){
        for(let caso of casos){
            let key1 = null;
            let key2 = null;
            
            if(caso.causa && caso.juzgado){
                const causa = this.normalizarCausa(caso.causa);
                const juzgado = this.normalizarJuzgado(caso.juzgado);
                key1 = `${causa}|${juzgado}`;
            }
            if(caso.comuna && caso.rolPropiedad){
                const comuna = this.normalizarComuna(caso.comuna);
                const rol = this.normalizarRol(caso.rolPropiedad);
                key2 = `${comuna}|${rol}`;
            }

            let foundIndex = null;
            if(key1 && this.indexes.has(key1)){
                foundIndex = this.indexes.get(key1);
            } else if (key2 && this.indexes.has(key2)) {
                foundIndex = this.indexes.get(key2);
            }

            if(foundIndex !== null){
                console.log(`Encontrado caso ${caso.causa} en fila ${foundIndex}`);
                this.fillCaseData(caso,foundIndex, spreadSheetData );

            }

        }
    }

    fillCaseData(caso, rowIndex, spreadSheetData){
        // Fill caso with data from spreadSheetData at rowIndex
        rowIndex -= 1; // Ajustar por índice base 0
        const row = spreadSheetData[rowIndex];
        caso.direccion = row[indexDireccion];
        caso.anno = row[indexAno];
        caso.dato = row[indexDato];
        caso.estadoCivil = row[indexEstadoCivil];
        caso.rolPropiedad = row[indexRol];
        caso.linkMap = row[indexLinkMapa]; 
        
        // caso.precioCompra = row[indexPrecioCompra];


        console.log(`Causa ${row[indexCausa]} - precioCompra: ${row[indexPrecioCompra]}`);

        
        this.fillMartillero(caso, row);
        this.checkMontoMinimo(caso, row);
        this.fillMontoCompra(caso, row);
        this.fillDeudaBanco(caso, row);


    }

    fillMartillero(caso, row){
        const fecha = row[indexFechaRem];
        const martillero = row[indexMartillero];
        const estado = row[indexEstado];
        const notas = row[indexNotas];
        const ocupacion = row[indexOcupacion];

        let texto = '';
        if(fecha){
            texto += `${fecha}`;
        }
        texto += '( ';
        if(estado){
            texto += `- ${estado}`;
        }
        if(notas){
            texto += `- ${notas}`;
        }
        if(martillero){
            texto += `- ${martillero}`;
        }
        if(ocupacion){
            texto += `- ${ocupacion}`;
        }
        texto += ')';

        if(caso.martillero){
            caso.martillero += texto;
        }else{
            caso.martillero = texto;
        }

    }
    checkMontoMinimo(caso, row){
        if(!row[indexPrecioMinimo]){
            return;
        }
        const price = row[indexPrecioMinimo].replaceAll('.', '').replaceAll(',', '.');
        const oldMin = Number(price);
        if (caso.montoMinimo) {
            if (oldMin > caso.montoMinimo) {
                caso.montoMinimo2 = caso.montoMinimo;
                caso.montoMinimo = oldMin
            }
        } else {
            caso.montoMinimo = oldMin;
        }
    }

    fillMontoCompra(caso, row){
        if(row[indexPrecioCompra]){
            let price = row[indexPrecioCompra].replaceAll('.', '').replaceAll(',', '.');
            caso.montoCompra = {monto : Number(price), moneda : null};
        }
    }

    fillDeudaBanco(caso, row){
        // Placeholder for filling bank debt data if needed
        caso.mortageBank = row[indexDeudaBanco] || null;
        if(row[indexDeudaHipoteca]){
            console.log(`Deuda Hipotecaria ${row[indexDeudaHipoteca]} para caso ${caso.causa}`);
            let price = row[indexDeudaHipoteca].replaceAll('.', '').replaceAll(',', '.');
            caso.deudaHipotecaria = Number(price);
        }
    }
}

module.exports = DataEnricher;

async function main(){
    
    const casoTestCausa = new CasoBuilder(new Date(), "PJUD", config.PJUD)
        .conCausa('C-14045-2024')
        .conJuzgado('27° SANTIAGO')
        .conMontoMinimo(999999)
        .construir();

    const casoTestRol = new CasoBuilder(new Date(), "PJUD", config.PJUD)
        .conComuna('Osorno')
        .conRol('481-34-43')
        .construir();

    const casos = [casoTestCausa, casoTestRol];
    const data = await SpreadSheetManager.processData(false);
    const enricher = new DataEnricher();
    enricher.enrichWithSpreadsheetData(casos, data);

    for(let caso of casos){
        console.log(caso.toObject());
        console.log('-------------------');
    }

}

// main();