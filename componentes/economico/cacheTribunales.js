const Store = require('electron-store');

const { tribunales2 } = require('../caso/datosLocales')

class CacheTribunales {
    constructor() {
        this.store = new Store({
            name: 'cacheTribunales'
        });
        this.CACHE_KEY = 'tribunalesData';
        this.cacheTribunales = this.loadFromLocalStorage();
    }

    clear() {
        this.cacheMap = new Map();
        this.store.delete(this.CACHE_KEY);
    }

    safeToStore() {
        try {
            const cacheSerialized = Array.from(this.cacheMap.entries());
            this.store.set(this.CACHE_KEY, cacheSerialized);
        } catch (error) {
            console.error("Error al guardar en localStorage:", error);
        }
    }

    loadFromStore() {
        try {
            const cacheSerialized = this.store.get(this.CACHE_KEY);
            return new Map(cacheSerialized);
        } catch (e) {
            console.error("Error al cargar desde localStorage:", e);
            return new Map();
        }
    }

    initializePersistentCache() {
        if (this.isCacheValid()) {
            return;
        }

        this.regenerateCache();
    }

    isCacheValid() {
        for (const tribunal of tribunales2) {
            if (!this.cacheTribunales.has(tribunal)) {
                return false;
            }
        }
        return true;
    }

    regenerateCache() {
        const newCache = new Map();

        for (const tribunal of tribunales2) {
            const variations = this.generateVariations(tribunal);
            newCache.set(tribunal, variations);
        }

        this.cacheMap = newCache;
        this.safeToStore();
    }

    generateVariations(tribunal) {
        const tribunalNormalized = tribunal
            .toLowerCase()
            .replace(/de\s+/, '')
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const tribunalSinDe = tribunalNormalized.replaceAll("de ", '');
        const variaciones = [tribunalNormalized, tribunalSinDe];

        const numeroMatch = tribunal.match(/\d{1,2}/);
        if (numeroMatch) {
            const numero = parseInt(numeroMatch[0]);
            const ordinalForm = convertirANombre(numero);

            // if(tribunal.includes("7° JUZGADO CIVIL DE SANTIAGO")){
            //     console.log("Variaciones: ",ordinalForm, "Tipo : ",typeof ordinalForm);   
            // }

            const simbolosOrdinales = ['°', 'º', ''];

            const bases = [
                tribunalNormalized,
                tribunalNormalized.replace('juzgado', 'tribunal')
            ]

            ordinalForm.push(numero.toString());
            for (const base of bases) {
                ordinalForm.forEach((form) => {
                    simbolosOrdinales.forEach((simbolo) => {
                        variaciones.push(base.replace(/\d{1,2}°/, `${form}${simbolo}`)); // 3°
                        variaciones.push(base.replace(/\d{1,2}°/, `${form}`)); // tercero
                        variaciones.push(base.replace(/\d{1,2}°/, `${form} ${simbolo}`)); // 3 °
                    });
                    variaciones.push(base.replace(/\s+/g, '')); // 3°juzgado
                });
            }

            if (tribunalNormalized.includes("en lo civil")) {
                variaciones.push(...variaciones.map(variation => variation.replace("en lo civil ", "")));
            }
        }
        return variaciones;
    }

    convertirANombre(number) {
        const ordinalForm = {
            1: ["primer"],
            2: ["segundo"],
            3: ["tercer"],
            4: ["cuarto"],
            5: ["quinto"],
            6: ["sexto"],
            7: ["septimo"],
            8: ["octavo"],
            9: ["noveno"],
            10: ["decimo"],
            11: ["undecimo", "decimoprimero", "decimo primero"],
            12: ["duodecimo", "decimosegundo", "decimo segundo"],
            13: ["decimotercero", "decimo tercero", "decimotercer", "decimo tercer"],
            14: ["decimocuarto", "decimo cuarto"],
            15: ["decimoquinto", "decimo quinto"],
            16: ["decimosexto", "decimo sexto"],
            17: ["decimoseptimo", "decimo septimo"],
            18: ["decimoctavo", "decimo octavo"],
            19: ["decimonoveno", "decimo noveno"],
            20: ["vigesimo"],
            21: ["vigesimoprimero", "vigesimo primero"],
            22: ["vigesimosegundo", "vigesimo segundo"],
            23: ["vigesimotercero", "vigesimo tercero", "vigesimo tercer", "vigesimotercer"],
            24: ["vigesimocuarto", "vigesimo cuarto"],
            25: ["vigesimoquinto", "vigesimo quinto"],
            26: ["vigesimosexto", "vigesimo sexto"],
            27: ["vigesimoseptimo", "vigesimo septimo"],
            28: ["vigesimoctavo", "vigesimo octavo"],
            29: ["vigesimonoveno", "vigesimo noveno"],
            30: ["trigesimo"],
            31: ["trigesimoprimero", "trigesimo primero"],
            32: ["trigesimosegundo", "trigesimo segundo"],
            33: ["trigesimotercero", "trigesimo tercero"],
            34: ["trigesimocuarto", "trigesimo cuarto"],
            35: ["trigesimoquinto", "trigesimo quinto"],
            36: ["trigesimosexto", "trigesimo sexto"],
            37: ["trigesimoseptimo", "trigesimo septimo"],
            38: ["trigesimoctavo", "trigesimo octavo"],
        }

        // Verificar que el número está dentro del rango válido
        if (number >= 1 && number <= 38) {
            return ordinalForm[number]; // Ajuste para que el índice coincida con el número
        } else {
            return null; // Si el número está fuera del rango de 1 a 40
        }
    }

}

module.exports = CacheTribunales;