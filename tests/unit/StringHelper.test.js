const StringHelper = require('../../componentes/caso/Normalizers/StringHelper');

const PJUD = 2;


describe('Test de partes',()=>{
    test('Partes nulas',()=>{
        expect(StringHelper.partes(null,null)).toBeNull();
    });
});

describe('Test de comunas',()=>{
    test('Comuna nula',()=>{
        expect(StringHelper.comuna(null)).toBeNull();
    });

    test('Comuna de chillan sin tilde', ()=>{
        const comuna = "chillan";
        expect(StringHelper.comuna(comuna)).toBe("Chillán");
    });

    test('Comuna de curacavi sin tilde', ()=>{
        const comuna = "curacavi";
        expect(StringHelper.comuna(comuna)).toBe("Curacaví");
    });

    test('Comuna de curico sin tilde', ()=>{
        const comuna = "curico";
        expect(StringHelper.comuna(comuna)).toBe("Curicó");
    });

    test('Comuna de ñuñoa con tilde', ()=>{
        const comuna = "Ñuñoa";
        expect(StringHelper.comuna(comuna)).toBe("Ñuñoa");
    });

    test('Comuna de conchali con tilde', ()=>{
        const comuna = "conchali";
        expect(StringHelper.comuna(comuna)).toBe('Conchalí');
    });

    test('Comuna de conchali con tilde', ()=>{
        const comuna = "machali";
        expect(StringHelper.comuna(comuna)).toBe('Machalí');
    });

    test('Comuna de maipu con tilde', ()=>{
        const comuna = "maipu";
        expect(StringHelper.comuna(comuna)).toBe('Maipú');
    });

    test('Comuna de peñalolen con tilde', ()=>{
        const comuna = "peñalolen";
        expect(StringHelper.comuna(comuna)).toBe('Peñalolén');
    });

    test('Comuna de pte alto', ()=>{
        const comuna = "pte alto";
        expect(StringHelper.comuna(comuna)).toBe('Puente Alto');
    });

    test('Comuna de quilpue con tilde', ()=>{
        const comuna = "quilpue";
        expect(StringHelper.comuna(comuna)).toBe('Quilpué');
    });

    test('Comuna de aysen con tilde', ()=>{
        const comuna = "aysen";
        expect(StringHelper.comuna(comuna)).toBe('Aysén');
    });
});