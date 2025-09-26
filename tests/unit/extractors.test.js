const {changeWordsToNumbers} = require('../../componentes/economico/extractors/directionExtractor');



describe('test de convertir frases con numeros escritos en palabras a numeros',()=>{
    test('Partes nulas',()=>{
        expect(changeWordsToNumbers(null)).toBeNull();
    });

    test('Test numero uno con varias direcciones' , ()=>{
        const texto = 'inmueble consistente en el departamento número ciento tres del primer piso del edificio número cuatro y del Est número ochenta y seis del segundo subterráneo del condominio parque tobalaba ii ubicado en avenida tobalaba número siete mil trescientos once, comuna de la';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('inmueble consistente en el departamento n° 103 del primer piso del edificio n° 4 y del Est n° 86 del segundo subterráneo del condominio parque tobalaba ii ubicado en avenida tobalaba n° 7311 comuna de la');
    });

    test('Test numero dos con varias direcciones' , ()=>{
        const texto = 'inmuebles de calle el parrón número doscientos veinticuatro, doscientos cuarenta y cuatro, doscientos sesenta y cuatro- a y doscientos sesenta y cuatro-b, de la comuna de la';
        const res = changeWordsToNumbers(texto);
        console.log(res);
    });

    test('Test numero tres con varias direcciones' , ()=>{
        const texto = 'propiedad de la demandada doña angelica nataly villanueva galvez y que consiste en el departamento número cuatrocientos dieciséis del cuarto piso y del estacionamiento número e cero ciento veintitrés del segundo subterráneo, ambos del conjunto habitacional denominado doña petronila, con acceso por calle santa petronila número treinta y dos, comuna de estaci Est santa petronila 32 est 123';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('propiedad de la demandada doña angelica nataly villanueva galvez y que consiste en el departamento n° 416 del cuarto piso y del estacionamiento n° 123 del segundo subterráneo, ambos del conjunto habitacional denominado doña petronila, con acceso por calle santa petronila n° 32 comuna de estaci Est santa petronila 32 est 123');
    });

    test('Test numero cuatro con varias direcciones' , ()=>{
        const texto = 'departamento número mil quinientos seis a del décimo quinto piso y de la bodega número doscientos cincuenta del tercer subterráneo, del edificio con acceso por calle cóndor número setecientos noventa y tres, de la segunda etapa del condominio nueva era san francisco, comuna de santiago Est condor 793 box 121 BOD';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('departamento n° 1506 a del décimo quinto piso y de la bodega n° 250 del tercer subterráneo, del edificio con acceso por calle cóndor n° 793 de la segunda etapa del condominio nueva era san francisco, comuna de santiago Est condor 793 box 121 BOD');
    });

    test('Test numero cinco con varias direcciones' , ()=>{
        const texto = 'parcela número veintiuno originada de la división de la parcela número cuarenta y dos de la colonia peñaflor, comuna de pe';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('parcela n° 21 originada de la división de la parcela n° 42 de la colonia peñaflor, comuna de pe');
    });

    test('Test numero seis con varias direcciones' , ()=>{
        const texto = 'departamento número ochocientos veintiuno del piso octavo de la torre oriente, de la bodega número noventa y cuatro del segundo subterráneo y del Est número nueve del primer piso, todos del denominado edificio novo, con acceso principal por calle portugal número quinientos sesenta y cuatro, comuna de santiago';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('departamento n° 821 del piso octavo de la torre oriente, de la bodega n° 94 del segundo subterráneo y del Est n° 9 del primer piso, todos del denominado edificio novo, con acceso principal por calle portugal n° 564 comuna de santiago');
    });

    test('Test artificial con numero simple' , ()=>{
        const texto = 'propiedad con el numero siete';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('propiedad con el n° 7');
    });

    test('Test artificial con numero simple en propiedad y estacionamiento' , ()=>{
        const texto = 'propiedad con el numero siete y estacionamiento numero trece';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('propiedad con el n° 7 y estacionamiento n° 13');
    });

    test('Test artificial con numero que incluye un y' , ()=>{
        const texto = 'propiedad con el numero siete mil trescientos treinta y uno';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('propiedad con el n° 7331');
    });

    test('Otro test con causa de emol C-6782-2025 4/11' , ()=>{
        const texto = 'departamento número mil ciento siete del piso undécimo y del Est número e cero veintiuno del piso primero, ambos del conjunto habitacional denominado edificio novo, con ingreso por calle santa petronila número treinta y ocho, comuna de estaci';
        const res = changeWordsToNumbers(texto);
        console.log(res)
    });

    test('Otro test con causa de emol C-12721-2024 4/11' , ()=>{
        const texto = 'departamento número setecientos seis del séptimo piso y el Est número veintidós en conjunto con la bodega número treinta y tres, ambos del primer subterráneo, todos del edificio denominado plaza de agua o edificio argomedo trescientos veinte con acceso principal por calle argomedo número trescientos veinte, comuna de santiago';
        const res = changeWordsToNumbers(texto);
        console.log(res)
    });

    test('Test artificial para numero x' , ()=>{
        const texto = 'Parcela numero 345';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Parcela numero 345')
    });

    test('Test artificial para numero x seguido coma' , ()=>{
        const texto = 'Parcela numero 345,';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Parcela numero 345,')
    });

    test('Test artificial para dos no conversiones de numero' , ()=>{
        const texto = 'Parcela numero 345 que colide con edificio tralala y estacionamiento n 35';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Parcela numero 345 que colide con edificio tralala y estacionamiento n 35')
    });

    test('Test artificial para una conversion y una no conversion' , ()=>{
        const texto = 'Parcela numero trescientos cuarenta y cinco que colide con edificio tralala y estacionamiento n 35';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Parcela n° 345 que colide con edificio tralala y estacionamiento n 35')
    });

    test('Test artificial para una no conversion y una conversion' , ()=>{
        const texto = 'Parcela numero 345 que colide con edificio tralala y estacionamiento numero treinta y cinco';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Parcela numero 345 que colide con edificio tralala y estacionamiento n° 35')
    });

});