
const tribunales = [
    "Juzgado de Letras Tocopilla",
    "Juzgado de Letras y Gar.de María Elena",
    "1º Juzgado de Letras de Calama",
    "2º Juzgado de Letras de Calama",
    "3º Juzgado de Letras de Calama",
    "Juzgado de Letras y Gar. de Taltal",
    "1º Juzgado de Letras Civil de Antofagasta",
    "2º Juzgado de Letras Civil de Antofagasta",
    "3º Juzgado de Letras Civil de Antofagasta",
    "4° Juzgado de Letras Civil de Antofagasta",
    "Juzgado de Letras y Garantía Mejillones",
    "Juzgado de Letras y Gar. Pozo Almonte",
    "1º Juzgado de Letras de Iquique",
    "2º Juzgado de Letras de Iquique",
    "3º Juzgado de Letras de Iquique",
    "1º Juzgado de Letras de Arica",
    "1º Juzgado De Letras de Arica ex 4°",
    "2º Juzgado de Letras de Arica",
    "2º Juzgado De Letras de Arica ex 4°",
    "3º Juzgado de Letras de Arica",
    "3º Juzgado de Letras de Arica Ex 4º",
    "Juzgado de Letras y Gar. de Chañaral",
    "Juzgado de Letras de Diego de Almagro",
    "1º Juzgado de Letras de Copiapó",
    "2º Juzgado de Letras de Copiapó",
    "3º Juzgado de Letras de Copiapó",
    "Juzgado de Letras y Gar. de Freirina",
    "4º Juzgado de Letras de Copiapó",
    "1º Juzgado de Letras de Vallenar",
    "2º Juzgado de Letras de Vallenar",
    "Juzgado de Letras y Gar. de Caldera",
    "1º Juzgado de Letras de la Serena",
    "2º Juzgado de Letras de la Serena",
    "3º Juzgado de Letras de la Serena",
    "1º Juzgado de Letras de Coquimbo",
    "2º Juzgado de Letras de Coquimbo",
    "3º Juzgado de Letras de Coquimbo",
    "Juzgado de Letras de Vicuña",
    "Juzgado de Letras y Garantía de Andacollo",
    "1º Juzgado de Letras de Ovalle",
    "2º Juzgado de Letras de Ovalle",
    "3º Juzgado de Letras de Ovalle",
    "Juzgado de Letras y Gar. de Combarbalá",
    "Juzgado de Letras de Illapel",
    "Juzgado de Letras y Gar. de los Vilos",
    "1º Juzgado Civil de Valparaíso",
    "2º Juzgado Civil de Valparaíso",
    "3º Juzgado Civil de Valparaíso",
    "4º Juzgado Civil de Valparaíso",
    "5º Juzgado Civil de Valparaíso",
    "1º Juzgado Civil de Viña del Mar",
    "2º Juzgado Civil de Viña del Mar",
    "3º Juzgado Civil de Viña del Mar",
    "1º Juzgado de Letras de Quilpue",
    "2º Juzgado de Letras de Quilpue",
    "Juzgado de Letras de Villa Alemana",
    "Juzgado de Letras de Casablanca",
    "Juzgado de Letras de La Ligua",
    "Juzgado de Letras y Gar. de Petorca",
    "1º Juzgado de Letras de Los Andes",
    "2º Juzgado de Letras de Los Andes",
    "1º Juzgado de Letras de San Felipe",
    "1º Juzgado de Letras de San Felipe Ex 2º",
    "Juzgado de Letras y Gar. de Putaendo",
    "1º Juzgado de Letras de Quillota",
    "2º Juzgado de Letras de Quillota",
    "Juzgado de Letras de La Calera",
    "Juzgado de Letras de Limache",
    "1º Juzgado de Letras de San Antonio",
    "2º Juzgado de Letras de San Antonio",
    "Juzgado de Letras y Gar. de Isla de Pascua",
    "Juzgado de Letras y Gar. de Quintero",
    "1º Juzgado Civil de Rancagua",
    "2º Juzgado Civil de Rancagua",
    "1º Juzgado de Letras de Rengo",
    "Juzgado de Letras de San Vicente de Tagua Tagua",
    "1º Juzgado de Letras y Gar. de Peumo",
    "1º Juzgado de Letras de San Fernando",
    "2º Juzgado de Letras de San Fernando",
    "1º Juzgado de Letras de Santa Cruz",
    "1º Juzgado de Letras de Santa Cruz Ex 2°",
    "Juzgado de Letras y Gar. de Pichilemu",
    "Juzgado de Letras y Gar. de Litueche",
    "Juzgado de Letras y Gar. de Peralillo",
    "1º Juzgado de Letras de Talca",
    "2º Juzgado de Letras de Talca",
    "3º Juzgado de Letras de Talca",
    "4º Juzgado de Letras de Talca",
    "Juzgado de Letras de Constitución",
    "Juzgado de Letras y Gar. de Curepto",
    "1º Juzgado de Letras de Curicó",
    "2º Juzgado de Letras de Curicó",
    "2º Juzgado de Letras de Curicó Ex 3°",
    "Juzgado de Letras y Gar. de Licantén",
    "Juzgado de Letras de Molina",
    "1º Juzgado de Letras de Linares",
    "2º Juzgado de Letras de Linares",
    "Juzgado de Letras de San Javier",
    "Juzgado de Letras de Cauquenes",
    "Juzgado de Letras y Gar. de Chanco",
    "Juzgado de Letras de Parral",
    "1º Juzgado Civil de Chillán",
    "2º Juzgado Civil de Chillán",
    "1º Juzgado de Letras de San Carlos",
    "Juzgado de Letras de Yungay",
    "Juzgado de Letras y Gar. de Bulnes",
    "Juzgado de Letras y Gar. de Coelemu",
    "Juzgado de Letras y Gar. de Quirihue",
    "1º Juzgado de Letras de Los Angeles",
    "2º Juzgado de Letras de Los Angeles",
    "2° Juzgado de Letras de Los Angeles ex 3°",
    "Juzgado de Letras y Gar. de Mulchen",
    "Juzgado de Letras y Gar. de Nacimiento",
    "Juzgado de Letras y Gar. de Laja",
    "Juzgado de Letras y Gar. de Yumbel",
    "1º Juzgado Civil de Concepción",
    "2º Juzgado Civil de Concepción",
    "3º Juzgado Civil de Concepción",
    "1º Juzgado Civil de Talcahuano",
    "2º Juzgado Civil de Talcahuano",
    "Juzgado de Letras de Tomé",
    "Juzgado de Letras y Gar. de Florida",
    "Juzgado de Letras y Gar. de Santa Juana",
    "Juzgado de Letras y Gar. de Lota",
    "1º Juzgado de Letras de Coronel",
    "2º Juzgado de Letras de Coronel",
    "Juzgado de Letras y Gar. de Lebu",
    "Juzgado de Letras de Arauco",
    "Juzgado de Letras y Gar. de Curanilahue",
    "Juzgado de Letras de Cañete",
    "Juzgado de Letras y Gar. de Santa Bárbara",
    "Juzgado de Letras y Gar. de Cabrero",
    "1º Juzgado Civil de Temuco",
    "2º Juzgado Civil de Temuco",
    "Juzgado de Letras de Angol",
    "Juzgado de Letras y Gar. de Collipulli",
    "Juzgado de Letras y Gar. de Traiguén",
    "Juzgado de Letras de Victoria",
    "Juzgado de Letras y Gar. de Curacautin",
    "Juzgado de Letras Loncoche",
    "Juzgado de Letras de Pitrufquen",
    "Juzgado de Letras de Villarrica",
    "Juzgado de Letras de Nueva Imperial",
    "Juzgado de Letras y Gar. de Pucón",
    "Juzgado de Letras de Lautaro",
    "Juzgado de Letras y Gar. de Carahue",
    "3º Juzgado Civil de Temuco",
    "Juzgado de Letras y Gar. de Tolten",
    "Juzgado de Letras y Gar. de Puren",
    "1º Juzgado Civil de Valdivia",
    "2º Juzgado Civil de Valdivia",
    "Juzgado de Letras de Mariquina",
    "Juzgado de Letras y Gar. de Paillaco",
    "Juzgado de Letras Los Lagos",
    "Juzgado de Letras y Gar. de Panguipulli",
    "Juzgado de Letras y Gar. de la Unión",
    "Juzgado de Letras y Gar. de Río Bueno",
    "1º Juzgado de Letras de Osorno",
    "2º Juzgado de Letras de Osorno",
    "Juzgado de Letras de Rio Negro",
    "1º Juzgado Civil de Puerto Montt",
    "2º Juzgado Civil de Puerto Montt",
    "Juzgado de Letras de Puerto Varas",
    "Juzgado de Letras y Gar. de Calbuco",
    "Juzgado de Letras y Gar. de Maullin",
    "Juzgado de Letras de Castro",
    "Juzgado de Letras de Ancud",
    "Juzgado de Letras y Garantía de Achao",
    "Juzgado de Letras y Gar. de Chaitén",
    "Juzgado de Letras y Gar. de Los Muermos",
    "Juzgado de Letras y Gar. de Quellón",
    "Juzgado de Letras y Gar. de Hualaihue",
    "1º Juzgado de Letras de Coyhaique",
    "1º Juzgado de Letras de Coyhaique Ex 2º",
    "Juzgado de Letras y Gar. de Pto. Aysen",
    "Juzgado de Letras y Gar. de Chile Chico",
    "Juzgado de Letras y Gar. de Cochrane",
    "Juzgado de Letras y Gar. de Puerto Cisnes",
    "1º Juzgado de Letras de Punta Arenas",
    "2º Juzgado de Letras de Punta Arenas",
    "3º Juzgado de Letras de Punta Arenas",
    "Juzgado de Letras y Gar. de Puerto Natales",
    "Juzgado de Letras y Gar. de Porvenir",
    "Juzgado de Letras y Garantía de Cabo de Hornos",
    "1º Juzgado Civil de Santiago",
    "2º Juzgado Civil de Santiago",
    "3º Juzgado Civil de Santiago",
    "4º Juzgado Civil de Santiago",
    "5º Juzgado Civil de Santiago",
    "6º Juzgado Civil de Santiago",
    "7º Juzgado Civil de Santiago",
    "8º Juzgado Civil de Santiago",
    "9º Juzgado Civil de Santiago",
    "10º Juzgado Civil de Santiago",
    "11º Juzgado Civil de Santiago",
    "12º Juzgado Civil de Santiago",
    "13º Juzgado Civil de Santiago",
    "14º Juzgado Civil de Santiago",
    "15º Juzgado Civil de Santiago",
    "16º Juzgado Civil de Santiago",
    "17º Juzgado Civil de Santiago",
    "18º Juzgado Civil de Santiago",
    "19º Juzgado Civil de Santiago",
    "20º Juzgado Civil de Santiago",
    "21º Juzgado Civil de Santiago",
    "22º Juzgado Civil de Santiago",
    "23º Juzgado Civil de Santiago",
    "24º Juzgado Civil de Santiago",
    "25º Juzgado Civil de Santiago",
    "26º Juzgado Civil de Santiago",
    "27º Juzgado Civil de Santiago",
    "28º Juzgado Civil de Santiago",
    "29º Juzgado Civil de Santiago",
    "30º Juzgado Civil de Santiago",
    "Juzgado de Letras de Colina",
    "1º Juzgado Civil de San Miguel",
    "2º Juzgado Civil de San Miguel",
    "3º Juzgado Civil de San Miguel",
    "4º Juzgado Civil de San Miguel",
    "1º Juzgado Civil de Puente Alto",
    "1º Juzgado De Letras De Talagante",
    "2º Juzgado De Letras De Talagante",
    "1º Juzgado de Letras de Melipilla",
    "1º Juzgado de Letras de Buin",
    "2º Juzgado de Letras de Buin",
    "Juzgado de Letras de Peñaflor",
    "1º Juzgado de Letras de San Bernardo",
    "1º Juzgado de Letras de San Bernardo Ex 3°",
    "2º Juzgado de Letras de San Bernardo",
    "2º Juzgado de Letras de San Bernardo Ex 3°"
];