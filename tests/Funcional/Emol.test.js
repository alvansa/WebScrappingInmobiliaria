const { normalizeOptions } = require('electron-builder/out/builder');
const Caso = require('../../componentes/caso/caso');
const {procesarDatosRemate, normalizeDescription} = require('../../componentes/economico/datosRemateEmol');
const {obtainCorteJuzgadoNumbers} = require('../../utils/corteJuzgado');

const Extractos = require('../textos/Extracto');

describe('procesarDatosRemate',()=>{
    test('Caso C-1857-2024',()=>{
        const caso1857 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex1857);
        caso1857.texto = normalizedText;
        procesarDatosRemate(caso1857);
        expect(caso1857.formatoEntrega).toEqual('vale vista');
        expect(caso1857.causa).toEqual('C-1857-2024');
        expect(caso1857.comuna).toEqual('antofagasta');
        expect(caso1857.anno).toEqual(2013);
        expect(caso1857.montoMinimo).toEqual({
            monto: 83547301,
            moneda: 'Pesos'
        });
        expect(caso1857.porcentaje).toEqual(10);
        // expect(caso1857.diaEntrega).toEqual('dia habil anterior');
        expect(caso1857.partes).toEqual('progarantía sagr/ constructora e ingeniería smot');
        expect(caso1857.fechaRemate).toEqual(new Date('2025/07/08'));
    });

    test('Caso C-1666-2014',()=>{
        const caso1666 = new Caso(new Date(), new Date(), 'emol', 1);
        const normalizedText = normalizeDescription(Extractos.ex1666);
        caso1666.texto = normalizedText;
        procesarDatosRemate(caso1666);
        expect(caso1666.formatoEntrega).toEqual('vale vista');
        expect(caso1666.causa).toEqual('C-1666-2014');
        expect(caso1666.fechaRemate).toEqual(new Date('2025/07/17'));
        // expect(caso1666.diaEntrega).toEqual('dia viernes anterior');
        expect(caso1666.partes).toEqual('fondo de inversion larrain vial con castillo');
        // expect(caso1666.montoMinimo).toEqual({
        //     moneda: 'UF',
        //     monto: 1031.99465
        // });
    });

    test('Caso C-2226-2023',()=>{
        const caso2226 = new Caso(new Date(), new Date(), 'emol', 1);
        const normalizedText = normalizeDescription(Extractos.ex2226);
        caso2226.texto = normalizedText;
        procesarDatosRemate(caso2226);
        expect(caso2226.juzgado).toEqual('2° JUZGADO DE LETRAS DE LINARES');
        expect(caso2226.fechaRemate).toEqual(new Date('2025/07/15'));
        expect(caso2226.comuna).toEqual('linares');
        expect(caso2226.anno).toEqual(2017);
        expect(caso2226.unitRol).toEqual('1121-2');
        expect(caso2226.formatoEntrega).toEqual('vale vista');
        expect(caso2226.causa).toEqual('C-2226-2023');
        expect(caso2226.montoMinimo).toEqual({
            monto: 31541959,
            moneda: 'Pesos'
        });
        // expect(caso2226.diaEntrega).toEqual('dia viernes anterior');
        expect(caso2226.partes).toEqual('banco de credito e inversiones con zavala');
    });

    test('Caso C-2240-2024',()=>{
        const caso2240 = new Caso(new Date(), new Date(), 'emol', 1);
        const normalizedText = normalizeDescription(Extractos.ex2240);
        caso2240.texto = normalizedText;
        procesarDatosRemate(caso2240);
        expect(caso2240.juzgado).toEqual('3° JUZGADO DE LETRAS DE LA SERENA');
        expect(caso2240.fechaRemate).toEqual(new Date('2025/06/06'));
        expect(caso2240.comuna).toEqual('coquimbo');
        expect(caso2240.anno).toEqual(2020);
        expect(caso2240.unitRol).toEqual('4132-400');
        expect(caso2240.formatoEntrega).toEqual('vale vista');
        expect(caso2240.causa).toEqual('C-2240-2024');
        expect(caso2240.montoMinimo).toEqual({
            monto: 81520345,
            moneda: 'Pesos'
        });
        expect(caso2240.porcentaje).toEqual(10);
        expect(caso2240.partes).toEqual('santander-chile con muñoz zepeda”');
    });


    test('Caso C-800-2025',()=>{
        const caso800 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex800);
        caso800.texto = normalizedText;
        procesarDatosRemate(caso800);
        expect(caso800.juzgado).toEqual("1° JUZGADO DE LETRAS DE LA SERENA");
        expect(caso800.formatoEntrega).toEqual('vale vista');
        expect(caso800.causa).toEqual('C-800-2025');
        expect(caso800.fechaRemate).toEqual(new Date('2025/07/15'));
        expect(caso800.porcentaje).toEqual(10);
        expect(caso800.anno).toEqual(2005);
        expect(caso800.unitRol).toEqual('965-296');
        expect(caso800.partes).toEqual('comunidad edificio alhambra/melendez');
    });

    test('Caso C-18731-2007',()=>{
        const caso18731 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex18731);
        caso18731.texto = normalizedText;
        procesarDatosRemate(caso18731);
        expect(caso18731.juzgado).toEqual('16° JUZGADO CIVIL DE SANTIAGO');
        expect(caso18731.fechaRemate).toEqual(new Date('2025/08/07'));
        expect(caso18731.formatoEntrega).toEqual('vale vista');
        expect(caso18731.causa).toEqual('C-18731-2007');
        expect(caso18731.porcentaje).toEqual(10);
        expect(caso18731.anno).toEqual(2006);
        expect(caso18731.partes).toEqual('compañía de seguros de vida con escobar fica');
        expect(caso18731.montoMinimo).toEqual({
            moneda: "UF",
            monto: 500
        });
    });

    test('Caso C-460-2024 de Emol', ()=>{
        const caso460 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex460);
        caso460.texto = normalizedText;
        procesarDatosRemate(caso460);
        expect(caso460.formatoEntrega).toEqual('vale vista');
        expect(caso460.juzgado).toEqual('23° JUZGADO CIVIL DE SANTIAGO');
        expect(caso460.causa).toEqual('C-460-2024');
        expect(caso460.fechaRemate).toEqual(new Date('2025/08/07'));
        expect(caso460.comuna).toEqual('Estación Central');
        expect(caso460.porcentaje).toEqual(10);
        expect(caso460.anno).toEqual(2019);
        expect(caso460.montoMinimo).toEqual({
            monto: 59396684,
            moneda: 'Pesos'
        });
        expect(caso460.fechaRemate).toEqual(new Date('2025/08/07'));
        expect(caso460.partes).toEqual('banco santander-chile sa/prinea');
    });

    test('Caso C-10926-2024', () => {
        const caso10926 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex10926);
        caso10926.texto = normalizedText;
        procesarDatosRemate(caso10926);
        const casos = [caso10926];
        obtainCorteJuzgadoNumbers(casos);
        expect(caso10926.formatoEntrega).toEqual('vale vista');
        expect(caso10926.causa).toEqual('C-10926-2024');
        expect(caso10926.porcentaje).toEqual(10);
        expect(caso10926.anno).toEqual(2014);
        expect(caso10926.juzgado).toEqual('14° JUZGADO CIVIL DE SANTIAGO')
        expect(caso10926.fechaRemate).toEqual(new Date('2025/08/27'));
        expect(caso10926.comuna).toEqual('santiago');
        expect(caso10926.corte).toEqual('90');
        expect(caso10926.numeroJuzgado).toEqual('272');
        expect(caso10926.getCausaPjud()).toEqual('10926');
        expect(caso10926.montoMinimo).toEqual({
            monto: 33199521,
            moneda: 'Pesos'
        });
        expect(caso10926.partes).toEqual('banco itaú chile contra sanhueza mendoza');
    });

    test('Caso C-345-2019', () => {
        const caso345 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex345);
        caso345.texto = normalizedText;
        procesarDatosRemate(caso345);
        const casos = [caso345];
        obtainCorteJuzgadoNumbers(casos);
        expect(caso345.formatoEntrega).toEqual('vale vista');
        expect(caso345.causa).toEqual('C-345-2019');
        expect(caso345.anno).toEqual(2002);
        expect(caso345.juzgado).toEqual('JUZGADO DE LETRAS DE ILLAPEL')
        expect(caso345.fechaRemate).toEqual(new Date('2025/08/29'));
        expect(caso345.comuna).toEqual('salamanca');
        expect(caso345.corte).toEqual('25');
        expect(caso345.numeroJuzgado).toEqual('52');
        expect(caso345.getCausaPjud()).toEqual('345');
        expect(caso345.montoMinimo).toEqual({
            "moneda" : "Pesos",
            "monto" : 39084038
        });
    });

    test('Caso C-156-2023',()=>{
        const caso156 = new Caso();
        const normalizedText = normalizeDescription(Extractos.exV156);
        caso156.texto = normalizedText;
        procesarDatosRemate(caso156);
        expect(caso156.formatoEntrega).toEqual('vale vista');
        expect(caso156.juzgado).toEqual('24° JUZGADO CIVIL DE SANTIAGO');
        expect(caso156.comuna).toEqual('las condes');
        expect(caso156.anno).toEqual(2011);
        // expect(caso156.causa).toEqual('C-156-2023');
        // expect(caso156.porcentaje).toEqual(10);
        expect(caso156.fechaRemate).toEqual(new Date('2025/08/20'));
        expect(caso156.montoMinimo).toEqual({
            monto: 3693,
            moneda: "UF"
        });
    });

    test('Caso C-11613-2024', () => {
        const caso11613 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex11613);
        caso11613.texto = normalizedText;
        procesarDatosRemate(caso11613);
        const casos = [caso11613];
        obtainCorteJuzgadoNumbers(casos);
        expect(caso11613.formatoEntrega).toEqual('vale vista');
        expect(caso11613.causa).toEqual('C-11613-2024');
        expect(caso11613.anno).toEqual(2021);
        expect(caso11613.juzgado).toEqual('22° JUZGADO CIVIL DE SANTIAGO')
        expect(caso11613.fechaRemate).toEqual(new Date('2025/09/01'));
        expect(caso11613.comuna).toEqual("ñuñoa");
        expect(caso11613.corte).toEqual('90');
        expect(caso11613.numeroJuzgado).toEqual('280');
        expect(caso11613.getCausaPjud()).toEqual('11613');
        expect(caso11613.montoMinimo).toEqual({
            "moneda" : "Pesos",
            "monto" : 118639031
        });
    });

    test('Caso C-18187-2017', () => {
        const caso18187 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex18187);
        caso18187.texto = normalizedText;
        procesarDatosRemate(caso18187);
        const casos = [caso18187];
        obtainCorteJuzgadoNumbers(casos);
        expect(caso18187.formatoEntrega).toEqual('vale vista');
        expect(caso18187.causa).toEqual('C-18187-2017');
        expect(caso18187.anno).toEqual(1992);
        expect(caso18187.juzgado).toEqual('21° JUZGADO CIVIL DE SANTIAGO')
        expect(caso18187.fechaRemate).toEqual(new Date('2025/08/28'));
        expect(caso18187.comuna).toEqual('maipú');
        expect(caso18187.corte).toEqual('90');
        expect(caso18187.numeroJuzgado).toEqual('279');
        expect(caso18187.getCausaPjud()).toEqual('18187');
        expect(caso18187.montoMinimo).toEqual({
            "moneda" : "Pesos",
            "monto" : 47647595
        });
    });

    test('Caso con texto nulo con toObject()',()=>{
        let caso1666 = new Caso(new Date(), new Date(), 'emol', 1);
        const normalizedText = normalizeDescription(null);
        caso1666.texto = normalizedText;
        procesarDatosRemate(caso1666);
        caso1666 = caso1666.toObject();

        expect(caso1666.formatoEntrega).toBeNull();
        expect(caso1666.causa).toBeNull();
        expect(caso1666.fechaRemate).toBeNull();
        expect(caso1666.anno).toBeNull();
        expect(caso1666.partes).toBeNull();
        expect(caso1666.montoMinimo).toBeNull();
        expect(caso1666.porcentaje).toBeNull();
        expect(caso1666.diaEntrega).toBeNull();
        expect(caso1666.comuna).toBeNull();
        expect(caso1666.juzgado).toBeNull();
        expect(caso1666.porcentaje).toBeNull();
        expect(caso1666.moneda).toBeNull();
        expect(caso1666.foja).toBeNull();
        expect(caso1666.numero).toBeNull();
        expect(caso1666.tipoPropiedad).toBeNull();
        expect(caso1666.tipoDerecho).toBeNull();
        expect(caso1666.martillero).toBeNull();
        expect(caso1666.direccion).toBeNull();
        expect(caso1666.diaEntrega).toBeNull();
        expect(caso1666.aviso).toBeNull();
        expect(caso1666.rolPropiedad).toBeNull();
        expect(caso1666.avaluoPropiedad).toBeNull();
        expect(caso1666.estadoCivil).toBeNull();
        expect(caso1666.corte).toBeNull();
        expect(caso1666.numeroJuzgado).toBeNull();
        expect(caso1666.rolEstacionamiento).toBeNull();
        expect(caso1666.avaluoEstacionamiento).toBeNull();
        expect(caso1666.direccionEstacionamiento).toBeNull();
        expect(caso1666.rolBodega).toBeNull();
        expect(caso1666.avaluoBodega).toBeNull();
        expect(caso1666.hasEstacionamiento).toEqual(false);
        expect(caso1666.hasBodega).toEqual(false);
        expect(caso1666.montoCompra).toBeNull();
        expect(caso1666.isPaid).toEqual(false);
        expect(caso1666.deudaHipotecaria).toBeNull();
        expect(caso1666.alreadyAppear).toBeNull();
        expect(caso1666.unitRol).toBeNull();
        expect(caso1666.unitAvaluo).toBeNull();
        expect(caso1666.unitDireccion).toBeNull();
    });

    test('Caso con texto nulo sin el toObject',()=>{
        let caso1666 = new Caso(new Date(), new Date(), 'emol', 1);
        const normalizedText = normalizeDescription(null);
        caso1666.texto = normalizedText;
        procesarDatosRemate(caso1666);
        expect(caso1666.formatoEntrega).toBeNull();
        expect(caso1666.causa).toBeNull();
        expect(caso1666.fechaRemate).toBeNull();
        expect(caso1666.anno).toBeNull();
        expect(caso1666.partes).toBeNull();
        expect(caso1666.montoMinimo).toBeNull();
        expect(caso1666.porcentaje).toBeNull();
        expect(caso1666.diaEntrega).toBeNull();
        expect(caso1666.comuna).toBeNull();
        expect(caso1666.juzgado).toBeNull();
        expect(caso1666.porcentaje).toBeNull();
        expect(caso1666.moneda).toBeNull();
        expect(caso1666.foja).toBeNull();
        expect(caso1666.numero).toBeNull();
        expect(caso1666.tipoPropiedad).toBeNull();
        expect(caso1666.tipoDerecho).toBeNull();
        expect(caso1666.martillero).toBeNull();
        expect(caso1666.direccion).toBeNull();
        expect(caso1666.diaEntrega).toBeNull();
        expect(caso1666.aviso).toBeNull();
        expect(caso1666.rolPropiedad).toBeNull();
        expect(caso1666.avaluoPropiedad).toBeNull();
        expect(caso1666.estadoCivil).toBeNull();
        expect(caso1666.corte).toBeNull();
        expect(caso1666.numeroJuzgado).toBeNull();
        expect(caso1666.rolEstacionamiento).toBeNull();
        expect(caso1666.avaluoEstacionamiento).toBeNull();
        expect(caso1666.direccionEstacionamiento).toBeNull();
        expect(caso1666.rolBodega).toBeNull();
        expect(caso1666.avaluoBodega).toBeNull();
        expect(caso1666.hasEstacionamiento).toEqual(false);
        expect(caso1666.hasBodega).toEqual(false);
        expect(caso1666.montoCompra).toBeNull();
        expect(caso1666.isPaid).toEqual(false);
        expect(caso1666.deudaHipotecaria).toBeNull();
        expect(caso1666.alreadyAppear).toBeNull();
        expect(caso1666.unitRol).toBeNull();
        expect(caso1666.unitAvaluo).toBeNull();
        expect(caso1666.unitDireccion).toBeNull();
    });

});


function createCase(causa,juzgado){
    const caso1 = new Caso("1/1/2025");
    caso1.causa = causa;
    caso1.juzgado = juzgado;
    return caso1;
}