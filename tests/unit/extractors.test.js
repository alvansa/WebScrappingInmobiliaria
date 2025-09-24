const {changeWordsToNumbers} = require('../../componentes/economico/extractors/directionExtractor');



describe('test de convertir frases con numeros escritos en palabras a numeros',()=>{
    test('Partes nulas',()=>{
        expect(changeWordsToNumbers(null)).toBeNull();
    });

    test('Test numero uno con varias direcciones' , ()=>{
        const texto = 'inmueble consistente en el departamento número ciento tres del primer piso del edificio número cuatro y del Est número ochenta y seis del segundo subterráneo del condominio parque tobalaba ii ubicado en avenida tobalaba número siete mil trescientos once, comuna de la';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('inmueble consistente en el departamento n° 103 del primer piso del edificio n° 4 del Est n° 86 del segundo subterráneo del condominio parque tobalaba ii ubicado en avenida tobalaba n° 7311 comuna de la');
    });

    test('Test numero dos con varias direcciones' , ()=>{
        const texto = 'inmuebles de calle el parrón número doscientos veinticuatro, doscientos cuarenta y cuatro, doscientos sesenta y cuatro- a y doscientos sesenta y cuatro-b, de la comuna de la';
        const res = changeWordsToNumbers(texto);
        console.log(res);
    });

    test('Test numero tres con varias direcciones' , ()=>{
        const texto = 'propiedad de la demandada doña angelica nataly villanueva galvez y que consiste en el departamento número cuatrocientos dieciséis del cuarto piso y del estacionamiento número e cero ciento veintitrés del segundo subterráneo, ambos del conjunto habitacional denominado doña petronila, con acceso por calle santa petronila número treinta y dos, comuna de estaci Est santa petronila 32 est 123';
        const res = changeWordsToNumbers(texto);
        console.log(res);
    });

    test('Test numero cuatro con varias direcciones' , ()=>{
        const texto = 'departamento número mil quinientos seis a del décimo quinto piso y de la bodega número doscientos cincuenta del tercer subterráneo, del edificio con acceso por calle cóndor número setecientos noventa y tres, de la segunda etapa del condominio nueva era san francisco, comuna de santiago Est condor 793 box 121 BOD';
        const res = changeWordsToNumbers(texto);
        console.log(res);
    });
});