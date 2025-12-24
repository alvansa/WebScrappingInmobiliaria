
const config = require('../../../config');

const PJUD = config.PJUD;
const EMOL = config.EMOL;
const LIQUIDACIONES = config.LIQUIDACIONES;
const PREREMATES = config.PREREMATES;

class StringHelper{
    static formatoEntrega(formatoEntrega){
        if(formatoEntrega == "N/A" || formatoEntrega == null){
            return null;
        }

        const formato = formatoEntrega
        .toLowerCase()
        .replace(/(\s+)/g, ' ') // Reemplazar espacios y comas por un solo espacio;
        .replace(/\n/g, ' ')
        .trim(); // Reemplazar saltos de línea por espacios
        
        if(formato == "vale a la vista"){
            return "vale vista";
        }
        return formato;
    }

    static juzgado(juzgado){
        if(juzgado == "N/A" || juzgado == null){
            return null;
        }
        return juzgado.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
    }

    static direccion(direccion){
        if(direccion == "N/A" || direccion == null){
            return null;
        }
        return direccion.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
    }

    static partes(partes,origen){
        if(partes === "N/A" || typeof partes != 'string' || !partes){
            return null;
        }else if(origen == PJUD){
            return partes;
        }
        let partesNormalizadas = partes.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
        partesNormalizadas = partesNormalizadas
            .replace(/caratulad[oa]s?:?/gi,'')
            .replace(/causa/gi,'')
            .replace(/\bC\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*,?\.?/gi,'')
            .replace(/rol /gi,'')
            .replace(/\s+/g," ")
            .replace(/antecedentes\s*(en\s*)?/gi,"")
            .replace(/expediente\s*/gi,"")
            .replace(/www\.pjud\.cl,?\s*/gi,"")
            .replace(/autos\s*/gi,"")
            .replace(/ejecutivos?\s*,\s*/gi,"")
            .replace(/Nº/gi,"");
            //.replace(/\.\s./g,"");
        if(partesNormalizadas.startsWith(",")){
            partesNormalizadas = partesNormalizadas.substring(1);
        }
        const puntoFinal = partesNormalizadas.indexOf(".");
        if(puntoFinal != -1){
            partesNormalizadas = partesNormalizadas.substring(0,puntoFinal);
        }
        const comaFinal = partesNormalizadas.indexOf(",");
        if(comaFinal != -1 && comaFinal > 10){
            partesNormalizadas = partesNormalizadas.substring(0,comaFinal);
        }
        return partesNormalizadas.trim().toLocaleLowerCase();
    }

    static #comunaCorrections = {
        'cion': 'ción', 'concon': 'concón', 'copiapo': 'copiapó',
        'alhue': 'alhué', 'canete': 'cañete', 'chillan': 'chillán',
        'hualpen': 'hualpén', 'maipu': 'maipú', 'nuble': 'ñuble',
        'penaflor': 'peñaflor', 'penuelas': 'peñuelas', 'pucon': 'pucón',
        'vina': 'viña', 'curacavi': 'curacaví', 'curico': 'curicó', 'pte alto': 'puente alto',
        'quilpue': 'quilpué', 'penalolen': 'peñalolén', 'peñalolen':'peñalolén',
        'conchali': 'conchalí', 'machali': 'machalí', 'aysen' : 'aysén', 
        'valparaíso': 'valparaiso' , 'nunoa' : 'ñuñoa','nuñoa' : 'ñuñoa', 'chanaral' : 'chañaral',
        'quillon' : 'quillón', 'santa maria' : 'santa maría', 'la union' : 'la unión',
        'camina' : 'camiña'
    };

    static comuna(comuna) {
        if (!comuna) return null;

        // Limpieza
        let normalized = comuna
            // .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover tildes
            .replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '')
            .trim()
            .toLowerCase();

        // Aplicar correcciones
        for (const [wrong, correct] of Object.entries(this.#comunaCorrections)) {
            if (normalized.includes(wrong)) {
                normalized = normalized.replace(wrong, correct);
            }
        }

        // Reconstruir con tildes correctas y capitalización
        return this.rebuildWithAccents(normalized);
    }

    static rebuildWithAccents(comuna) {
        const words = comuna.split(' ');
        return words.map(word => {
            // Capitalizar primera letra
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    }

}


module.exports = StringHelper;