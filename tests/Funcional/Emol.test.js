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
        expect(caso1857.comuna).toEqual('Antofagasta');
        expect(caso1857.anno).toEqual(2013);
        expect(caso1857.montoMinimo).toEqual(83547301);
        expect(caso1857.moneda).toEqual('Pesos');
        expect(caso1857.porcentaje).toEqual(10);
        // expect(caso1857.diaEntrega).toEqual('dia habil anterior');
        expect(caso1857.partes).toEqual('progarantía sagr/ constructora e ingeniería smot');
        expect(caso1857.fechaRemate).toEqual(new Date('2025/07/08'));
        expect(caso1857.diaEntrega).toEqual('a más tardar a las 14:00 horas del día hábil anterior a la subasta');
        expect(caso1857.direccion).toEqual(`propiedad corresponde a la casa n° 57 del 'condominio san marcos la portada, lote sm siete', cuyo ingreso es por calle los conquistadores n° 13960 comuna y región de antofagasta`);
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
        expect(caso1666.diaEntrega).toEqual('a más tardar el día viernes anterior a la subasta');
        // expect(caso1666.montoMinimo).toEqual({
        //     moneda: 
        //     monto: 1031.99465
        // });
        expect(caso1666.direccion).toEqual('propiedad ubicada en el sitio 10 de la manzana d - 1, ubicado en calle 4 arnaldo toro godoy n° 01241 del conjunto habitacional arturo alessandri palma ii de la ciudad de linares comuna de linares');
    });

    test('Caso C-2226-2023',()=>{
        const caso2226 = new Caso(new Date(), new Date(), 'emol', 1);
        const normalizedText = normalizeDescription(Extractos.ex2226);
        caso2226.texto = normalizedText;
        procesarDatosRemate(caso2226);
        expect(caso2226.juzgado).toEqual('2° JUZGADO DE LETRAS DE LINARES');
        expect(caso2226.fechaRemate).toEqual(new Date('2025/07/15'));
        expect(caso2226.comuna).toEqual('Linares');
        expect(caso2226.anno).toEqual(2017);
        expect(caso2226.unitRol).toEqual('1121-2');
        expect(caso2226.formatoEntrega).toEqual('vale vista');
        expect(caso2226.causa).toEqual('C-2226-2023');
        expect(caso2226.montoMinimo).toEqual(31541959);
        expect(caso2226.moneda).toEqual('Pesos');
        // expect(caso2226.diaEntrega).toEqual('dia viernes anterior');
        expect(caso2226.partes).toEqual('banco de credito e inversiones con zavala');
        expect(caso2226.diaEntrega).toBeNull();
        expect(caso2226.direccion).toEqual('casa y sitio ubicado en pasaje los planetas nº0466, que corresponde al sitio nº 2 de la manzana 2 del plano de loteo respectivo del conjunto habitacional denominado nemesio antúnez 1 etapa, de la comuna de linares')
    });

    test('Caso C-2240-2024',()=>{
        const caso2240 = new Caso(new Date(), new Date(), 'emol', 1);
        const normalizedText = normalizeDescription(Extractos.ex2240);
        caso2240.texto = normalizedText;
        procesarDatosRemate(caso2240);
        expect(caso2240.juzgado).toEqual('3° JUZGADO DE LETRAS DE LA SERENA');
        expect(caso2240.fechaRemate).toEqual(new Date('2025/06/06'));
        expect(caso2240.comuna).toEqual('Coquimbo');
        expect(caso2240.anno).toEqual(2020);
        expect(caso2240.unitRol).toEqual('4132-400');
        expect(caso2240.formatoEntrega).toEqual('vale vista');
        expect(caso2240.causa).toEqual('C-2240-2024');
        expect(caso2240.montoMinimo).toEqual(81520345);
        expect(caso2240.moneda).toEqual('Pesos');
        expect(caso2240.porcentaje).toEqual(10);
        expect(caso2240.partes).toEqual('santander-chile con muñoz zepeda”');
        expect(caso2240.diaEntrega).toBeNull();
        expect(caso2240.direccion).toEqual('inmueble consistente en el departamento n°1104, situado en la planta o piso 11, la bodega n°140, ubicada en la planta subterráneo, ambos del edificio ii, y el Est de superficie n°e - 381, ubicado en el área del terreno común destinado a estacionamientos, todos del condominio alto hacienda, etapa 2, con acceso principal por avenida rené schneider n°2031, de la comuna de coquimbo')
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
        expect(caso800.diaEntrega).toBeNull();
        expect(caso800.direccion).toEqual('propiedad del departamento n° 46 del cuarto piso y el Est cubierto n° 24 del edificio “la alhambra”, ubicado en avenida del mar n° 2550 de la serena e inscrito a fojas 3043 número 2791 del registro de propiedad del conservador de bienes raíces')
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
        expect(caso18731.montoMinimo).toEqual(500);
        expect(caso18731.moneda).toEqual('UF');
        expect(caso18731.diaEntrega).toEqual('día precedente a la fecha de la subasta, entre las 11:00 y 12:00 horas');
        expect(caso18731.direccion).toEqual('inmueble ubicado en calle gran bretaña nº 3079, población armando alarcón del canto, hualpén, inscrito a fojas 1621, nº 1265 del registro propiedad año 2006, conservador bienes raíces talcahuano.')
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
        expect(caso460.montoMinimo).toEqual(59396684);
        expect(caso460.moneda).toEqual('Pesos');
        expect(caso460.fechaRemate).toEqual(new Date('2025/08/07'));
        expect(caso460.partes).toEqual('banco santander-chile sa/prinea');
        expect(caso460.diaEntrega).toEqual('fijado el 04 agosto 2025, entre 09:00 y 11:00 horas');
        expect(caso460.direccion).toEqual('departamento nº 1317 y derechos comunes, ubicado en conde del maule nº 4470, estación central, región metropolitana, inscrita a fs.');
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
        expect(caso10926.comuna).toEqual('Santiago');
        expect(caso10926.corte).toEqual('90');
        expect(caso10926.numeroJuzgado).toEqual('272');
        expect(caso10926.getCausaPjud()).toEqual('10926');
        expect(caso10926.montoMinimo).toEqual(33199521);
        expect(caso10926.moneda).toEqual('Pesos');
        expect(caso10926.partes).toEqual('banco itaú chile contra sanhueza mendoza');
        expect(caso10926.diaEntrega).toEqual('susceptible de ser endosado al momento de la subasta');
        expect(caso10926.direccion).toEqual('departamento nº 2406 (dos mil cuatrocientos seis) del vigésimo cuarto piso, del edificio conexión, con acceso por calle san diego nº 255 (doscientos cincuenta y cinco), comuna de santiago');
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
        expect(caso345.comuna).toEqual('Salamanca');
        expect(caso345.corte).toEqual('25');
        expect(caso345.numeroJuzgado).toEqual('52');
        expect(caso345.getCausaPjud()).toEqual('345');
        expect(caso345.montoMinimo).toEqual(39084038);
        expect(caso345.moneda).toEqual('Pesos');
        expect(caso345.diaEntrega).toBeNull();
        expect(caso345.direccion).toEqual('inmueble: sitio n, ubicado en batuco, comuna de salamanca, provincia del choapa, región de coquimbo');
    });

    test('Caso C-156-2023',()=>{
        const caso156 = new Caso();
        const normalizedText = normalizeDescription(Extractos.exV156);
        caso156.texto = normalizedText;
        procesarDatosRemate(caso156);
        expect(caso156.formatoEntrega).toEqual('vale vista');
        expect(caso156.juzgado).toEqual('24° JUZGADO CIVIL DE SANTIAGO');
        expect(caso156.comuna).toEqual('Las Condes');
        expect(caso156.anno).toEqual(2011);
        // expect(caso156.causa).toEqual('C-156-2023');
        // expect(caso156.porcentaje).toEqual(10);
        expect(caso156.fechaRemate).toEqual(new Date('2025/08/20'));
        expect(caso156.montoMinimo).toEqual(3693);
        expect(caso156.moneda).toEqual('UF');
        expect(caso156.diaEntrega).toBeNull();
        expect(caso156.direccion).toEqual('inmueble ubicado calle homs n° 6945 depto. 205, estac. 58 y bg. 44 del 2° subterráneo, comuna las');
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
        expect(caso11613.comuna).toEqual("Ñuñoa");
        expect(caso11613.corte).toEqual('90');
        expect(caso11613.numeroJuzgado).toEqual('280');
        expect(caso11613.getCausaPjud()).toEqual('11613');
        expect(caso11613.montoMinimo).toEqual(118639031);
        expect(caso11613.moneda).toEqual('Pesos');
        expect(caso11613.diaEntrega).toEqual('el día jueves inmediatamente anterior a la fecha de la subasta, entre las 10:00 y las 12:30 horas');
        expect(caso11613.direccion).toEqual('departamento 206, Est 33 y bodega 31, todos del edificio tempo, con acceso por los aliaga 5500, comuna de');
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
        expect(caso18187.comuna).toEqual('Maipú');
        expect(caso18187.corte).toEqual('90');
        expect(caso18187.numeroJuzgado).toEqual('279');
        expect(caso18187.getCausaPjud()).toEqual('18187');
        expect(caso18187.montoMinimo).toEqual(47647595);
        expect(caso18187.moneda).toEqual('Pesos');
        expect(caso18187.diaEntrega).toEqual('los días martes y jueves, anterior a la realización de la subasta, según correspondiere, entre las 10:00 y las 12:00 horas');
        expect(caso18187.direccion).toEqual('propiedad ubicada pasaje constantino n° 1191 que corresponde al lote n° 39 de la manzana d del plano de loteo respectivo, comuna de maip');
    });

    test('Caso C-3252-2024', ()=>{
        const caso3252 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex3252);
        caso3252.texto = normalizedText;
        procesarDatosRemate(caso3252);
        expect(caso3252.causa).toEqual('C-3252-2024');
        expect(caso3252.diaEntrega).toEqual('día lunes 25 de agosto de 2025, entre las 09:00 y las 11:00 horas');
        expect(caso3252.direccion).toEqual('inmueble ubicado en puente alto, provincia cordillera, calle v centenario nº 2570, que corresponde al lote 3, de la manzana i, construido en calle ángel pimentel número 064, que corresponde al lote a reserva propietario, proveniente de la subdivisión del lote vii, de la subdivisión del resto del inmueble de mayor extensión compuesto por dos lotes que forman un solo paño de terreno ubicado en la población granjas, ex fundo el peñón. el título de dominio se encuentra inscrito a fojas 189 vuelta número 237, del registro de propiedad del conservador de bienes raíces');
    });

    test('Caso C-12068-2023', ()=>{
        const caso12068 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex12068);
        caso12068.texto = normalizedText;
        procesarDatosRemate(caso12068);
        expect(caso12068.causa).toEqual('C-12068-2023');
        expect(caso12068.diaEntrega).toEqual('día precedente a la fecha fijada para la realización de la subasta, entre las 11:00 y 12:00 horas');
        expect(caso12068.direccion).toEqual('inmueble ubicado en la comuna de puente alto, provincia cordillera, pasaje el quetru nº 4661, que corresponde al sitio nº 30 de la manzana 33, etapa w, del conjunto habitacional las perdices ii, que según plano archivado bajo el nº 2483 al final del registro del conservador de bienes raíces');
    });

    test('Caso C-939-2023', ()=>{
        const caso939 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex939);
        caso939.texto = normalizedText;
        procesarDatosRemate(caso939);
        expect(caso939.causa).toEqual('C-939-2023');
        expect(caso939.diaEntrega).toEqual('con 48 horas de antelación a la subasta');
        expect(caso939.direccion).toEqual('parcela nº 80, resultante de la división de los siguientes predios: a) fundo denominado actualmente puerta de hierro; b) parcela nº 39 del proyecto de parcelación viluco, santa julia, la esperanza, los encinos y los carolinos; y c) parcela nº 40, del proyecto de parcelación denominado parte de la hijuela santa julia de viluco, san andrés de viluco, santa eugenia de cervera, santa maría de cervera y san luis de cervera, de la comuna de buin');
    });

    test('Caso C-18853-2023', ()=>{
        const caso18853 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex18853);
        caso18853.texto = normalizedText;
        procesarDatosRemate(caso18853);
        expect(caso18853.causa).toEqual('C-18853-2018');
        expect(caso18853.tipoDerecho).toEqual('50% de los derechos')
        // expect(caso18853.diaEntrega).toEqual('con 48 horas de antelación a la subasta');
        // expect(caso18853.direccion).toEqual('parcela nº 80, resultante de la división de los siguientes predios: a) fundo denominado actualmente puerta de hierro; b) parcela nº 39 del proyecto de parcelación viluco, santa julia, la esperanza, los encinos y los carolinos; y c) parcela nº 40, del proyecto de parcelación denominado parte de la hijuela santa julia de viluco, san andrés de viluco, santa eugenia de cervera, santa maría de cervera y san luis de cervera, de la comuna de buin');
    });

    test('Caso C-19532-2024', ()=>{
        const caso19532 = new Caso();
        const normalizedText = normalizeDescription(Extractos.ex19532);
        caso19532.texto = normalizedText;
        procesarDatosRemate(caso19532);
        expect(caso19532.causa).toEqual('C-19532-2024');
        expect(caso19532.tipoDerecho).toBeNull();
        expect(caso19532.montoMinimo).toEqual(925.7465);
        expect(caso19532.moneda).toEqual('UF');
        // expect(caso18853.diaEntrega).toEqual('con 48 horas de antelación a la subasta');
        // expect(caso18853.direccion).toEqual('parcela nº 80, resultante de la división de los siguientes predios: a) fundo denominado actualmente puerta de hierro; b) parcela nº 39 del proyecto de parcelación viluco, santa julia, la esperanza, los encinos y los carolinos; y c) parcela nº 40, del proyecto de parcelación denominado parte de la hijuela santa julia de viluco, san andrés de viluco, santa eugenia de cervera, santa maría de cervera y san luis de cervera, de la comuna de buin');
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