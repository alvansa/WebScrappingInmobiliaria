const comunas = [
    "Aisén",
    "Algarrobo",
    "Alhué",
    "Alto Biobío",
    "Alto del Carmen",
    "Alto Hospicio",
    "Ancud",
    "Andacollo",
    "Angol",
    "Antofagasta",
    "Antuco",
    "Arauco",
    "Arica",
    "Buin",
    "Bulnes",
    "Cabildo",
    "Cabo de Hornos",
    "Cabrero",
    "Calama",
    "Calbuco",
    "Caldera",
    "Calera",
    "Calera de Tango",
    "Calle Larga",
    "Camarones",
    "Camiña",
    "Canela",
    "Cañete",
    "Carahue",
    "Cartagena",
    "Casablanca",
    "Castro",
    "Catemu",
    "Cauquenes",
    "Cerrillos",
    "Cerro Navia",
    "Chaitén",
    "Chanco",
    "Chañaral",
    "Chépica",
    "Chiguayante",
    "Chile Chico",
    "Chillán",
    "Chillán Viejo",
    "Chimbarongo",
    "Cholchol",
    "Chonchi",
    "Cisnes",
    "Cobquecura",
    "Cochamó",
    "Cochrane",
    "Codegua",
    "Coelemu",
    "Coihaique",
    "Coihueco",
    "Coinco",
    "Colbún",
    "Colchane",
    "Colina",
    "Collipulli",
    "Coltauco",
    "Combarbalá",
    "Concepción",
    "Conchalí",
    "Concón",
    "Constitución",
    "Contulmo",
    "Copiapó",
    "Coquimbo",
    "Coronel",
    "Corral",
    "Cunco",
    "Curacautín",
    "Curacaví",
    "Curaco de Vélez",
    "Curanilahue",
    "Curarrehue",
    "Curepto",
    "Curicó",
    "Dalcahue",
    "Diego de Almagro",
    "Doñihue",
    "El Bosque",
    "El Carmen",
    "El Monte",
    "El Quisco",
    "El Tabo",
    "Empedrado",
    "Ercilla",
    "Estación Central",
    "Florida",
    "Freire",
    "Freirina",
    "Fresia",
    "Frutillar",
    "Futaleufú",
    "Futrono",
    "Galvarino",
    "General Lagos",
    "Gorbea",
    "Graneros",
    "Guaitecas",
    "Hijuelas",
    "Hualaihué",
    "Hualañé",
    "Hualpén",
    "Hualqui",
    "Huara",
    "Huasco",
    "Huechuraba",
    "Illapel",
    "Independencia",
    "Iquique",
    "Isla de Maipo",
    "Isla de Pascua",
    "Juan Fernández",
    "La Cisterna",
    "La Cruz",
    "La Estrella",
    "La Florida",
    "La Granja",
    "La Higuera",
    "La Ligua",
    "La Pintana",
    "La Reina",
    "La Serena",
    "La Unión",
    "Lago Ranco",
    "Lago Verde",
    "Laguna Blanca",
    "Laja",
    "Lampa",
    "Lanco",
    "Las Cabras",
    "Las Condes",
    "Lautaro",
    "Lebu",
    "Licantén",
    "Limache",
    "Linares",
    "Litueche",
    "Llaillay",
    "Llanquihue",
    "Lo Barnechea",
    "Lo Espejo",
    "Lo Prado",
    "Lolol",
    "Loncoche",
    "Longaví",
    "Lonquimay",
    "Los Alamos",
    "Los Andes",
    "Los Angeles",
    "Los Lagos",
    "Los Muermos",
    "Los Sauces",
    "Los Vilos",
    "Lota",
    "Lumaco",
    "Machalí",
    "Macul",
    "Máfil",
    "Maipú",
    "Malloa",
    "Marchihue",
    "María Elena",
    "María Pinto",
    "Mariquina",
    "Maule",
    "Maullín",
    "Mejillones",
    "Melipeuco",
    "Melipilla",
    "Molina",
    "Monte Patria",
    "Mostazal",
    "Mulchén",
    "Nacimiento",
    "Nancagua",
    "Natales",
    "Navidad",
    "Negrete",
    "Ninhue",
    "Nogales",
    "Nueva Imperial",
    "Ñiquén",
    "Ñuñoa",
    "O'Higgins",
    "Olivar",
    "Ollagüe",
    "Olmué",
    "Osorno",
    "Ovalle",
    "Padre Hurtado",
    "Padre Las Casas",
    "Paiguano",
    "Paillaco",
    "Paine",
    "Palena",
    "Palmilla",
    "Panguipulli",
    "Panquehue",
    "Papudo",
    "Paredones",
    "Parral",
    "Pedro Aguirre Cerda",
    "Pelarco",
    "Pelluhue",
    "Pemuco",
    "Pencahue",
    "Penco",
    "Peñaflor",
    "Peñalolén",
    "Peralillo",
    "Perquenco",
    "Petorca",
    "Peumo",
    "Pica",
    "Pichidegua",
    "Pichilemu",
    "Pinto",
    "Pirque",
    "Pitrufquén",
    "Placilla",
    "Portezuelo",
    "Porvenir",
    "Pozo Almonte",
    "Primavera",
    "Providencia",
    "Puchuncaví",
    "Pucón",
    "Pudahuel",
    "Puente Alto",
    "Puerto Montt",
    "Puerto Octay",
    "Puerto Varas",
    "Pumanque",
    "Punitaqui",
    "Punta Arenas",
    "Puqueldón",
    "Purén",
    "Purranque",
    "Putaendo",
    "Putre",
    "Puyehue",
    "Queilén",
    "Quellón",
    "Quemchi",
    "Quilaco",
    "Quilicura",
    "Quilleco",
    "Quillón",
    "Quillota",
    "Quilpué",
    "Quinchao",
    "Quinta de Tilcoco",
    "Quinta Normal",
    "Quintero",
    "Quirihue",
    "Rancagua",
    "Ranquil",
    "Rauco",
    "Recoleta",
    "Renaico",
    "Renca",
    "Rengo",
    "Requínoa",
    "Retiro",
    "Rinconada",
    "Río Bueno",
    "Río Claro",
    "Río Hurtado",
    "Río Ibáñez",
    "Río Negro",
    "Río Verde",
    "Romeral",
    "Saavedra",
    "Sagrada Familia",
    "Salamanca",
    "San Antonio",
    "San Bernardo",
    "San Carlos",
    "San Clemente",
    "San Esteban",
    "San Fabián",
    "San Felipe",
    "San Fernando",
    "San Gregorio",
    "San Ignacio",
    "San Javier",
    "San Joaquín",
    "San José de Maipo",
    "San Juan de la Costa",
    "San Miguel",
    "San Nicolás",
    "San Pablo",
    "San Pedro",
    "San Pedro de Atacama",
    "San Pedro de la Paz",
    "San Rafael",
    "San Ramón",
    "San Rosendo",
    "San Vicente",
    "Santa Bárbara",
    "Santa Cruz",
    "Santa Juana",
    "Santa María",
    "Santiago",
    "Santo Domingo",
    "Sierra Gorda",
    "Talagante",
    "Talca",
    "Talcahuano",
    "Taltal",
    "Temuco",
    "Teno",
    "Teodoro Schmidt",
    "Tierra Amarilla",
    "Tiltil",
    "Timaukel",
    "Tirúa",
    "Tocopilla",
    "Toltén",
    "Tomé",
    "Torres del Paine",
    "Tortel",
    "Traiguén",
    "Treguaco",
    "Tucapel",
    "Valdivia",
    "Vallenar",
    "Valparaíso",
    "Vichuquén",
    "Victoria",
    "Vicuña",
    "Vilcún",
    "Villa Alegre",
    "Villa Alemana",
    "Villarrica",
    "Viña del Mar",
    "Vitacura",
    "Yerbas Buenas",
    "Yumbel",
    "Yungay",
    "Zapallar"
  ];
const tribunales = ["1° JUZGADO DE LETRAS DE ARICA", 
  "2° JUZGADO DE LETRAS DE ARICA", 
  "3° JUZGADO DE LETRAS DE ARICA", 
  "4° JUZGADO DE LETRAS DE ARICA",
   "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE ARICA", 
   "JUZGADO DE GARANTIA DE ARICA", 
   "Juzgado de Familia Arica", 
   "JUZGADO DE LETRAS Y GARANTIA DE POZO ALMONTE", 
   "JUZGADO DEL TRABAJO DE IQUIQUE", 
   "1° JUZGADO DE LETRAS DE IQUIQUE", 
   "2° JUZGADO DE LETRAS DE IQUIQUE", 
   "3° JUZGADO DE LETRAS DE IQUIQUE", 
   "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE IQUIQUE", 
   "JUZGADO DE GARANTIA DE IQUIQUE", 
   "Juzgado de Familia Iquique", 
   "JUZGADO DE LETRAS DE TOCOPILLA", 
   "JUZGADO DE LETRAS Y GARANTIA DE MARIA ELENA",
    "JUZGADO DE MENORES DE CALAMA", "1° JUZGADO DE LETRAS DE CALAMA", 
    "2° JUZGADO DE LETRAS DE CALAMA",
     "JUZGADO DEL TRABAJO DE ANTOFAGASTA", 
     "1° JUZGADO DE MENORES DE ANTOFAGASTA", 
     "JUZGADO DE LETRAS Y GARANTIA DE TALTAL", 
     "3° JUZGADO DE LETRAS DE CALAMA", 
     "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE CALAMA", 
     "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE ANTOFAGASTA", 
     "JUZGADO DE GARANTIA DE TOCOPILLA", 
     "JUZGADO DE GARANTIA DE CALAMA", 
     "JUZGADO DE GARANTIA DE ANTOFAGASTA", 
     "1° JUZGADO DE LETRAS EN LO CIVIL DE ANTOFAGASTA", 
     "2° JUZGADO DE LETRAS EN LO CIVIL DE ANTOFAGASTA", 
     "3° JUZGADO DE LETRAS EN LO CIVIL DE ANTOFAGASTA", 
     "4° JUZGADO DE LETRAS EN LO CIVIL DE ANTOFAGASTA", 
     "Juzgado de Familia Antofagasta", 
     "Juzgado de Familia Calama", 
     "JUZGADO DE LETRAS Y GARANTIA DE CHAÑARAL", 
     "JUZGADO DE LETRAS DE DIEGO DE ALMAGRO", 
     "1° JUZGADO DE LETRAS DE COPIAPO", 
     "2° JUZGADO DE LETRAS DE COPIAPO", 
     "3° JUZGADO DE LETRAS DE COPIAPO", 
     "JUZGADO DE LETRAS Y GARANTIA DE FREIRINA", 
     "1° JUZGADO DE LETRAS DE VALLENAR", 
     "2° JUZGADO DE LETRAS DE VALLENAR", 
     "JUZGADO DE LETRAS Y GARANTIA DE CALDERA", 
     "4° JUZGADO DE LETRAS DE COPIAPO", 
     "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE COPIAPO", 
     "JUZGADO DE GARANTIA DE DIEGO DE ALMAGRO", 
     "JUZGADO DE GARANTIA DE COPIAPO", 
     "JUZGADO DE GARANTIA DE VALLENAR", 
     "Juzgado de Familia Copiapó", 
     "Juzgado de Familia Vallenar", 
     "JUZGADO DEL TRABAJO DE LA SERENA", 
     "JUZGADO DE MENORES DE LA SERENA", 
     "1° JUZGADO DE LETRAS DE LA SERENA", 
     "2° JUZGADO DE LETRAS DE LA SERENA", 
     "3° JUZGADO DE LETRAS DE LA SERENA", 
     "1° JUZGADO DE LETRAS DE COQUIMBO", 
     "2° JUZGADO DE LETRAS DE COQUIMBO", 
     "3° JUZGADO DE LETRAS DE COQUIMBO", 
     "JUZGADO DE LETRAS DE VICUÑA", 
     "JUZGADO DE LETRAS Y GARANTIA DE ANDACOLLO", 
     "1° JUZGADO DE LETRAS DE OVALLE", 
     "2° JUZGADO DE LETRAS DE OVALLE", 
     "3° JUZGADO DE LETRAS DE OVALLE", 
     "JUZGADO DE LETRAS Y GARANTIA DE COMBARBALA", 
     "JUZGADO DE LETRAS DE ILLAPEL", 
     "JUZGADO DE LETRAS Y GARANTIA DE LOS VILOS", 
     "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE LA SERENA", 
     "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE OVALLE", 
     "JUZGADO DE GARANTIA DE LA SERENA", 
     "JUZGADO DE GARANTIA DE COQUIMBO", 
     "JUZGADO DE GARANTIA DE VICUÑA", 
     "JUZGADO DE GARANTIA DE OVALLE", 
     "JUZGADO DE GARANTIA DE ILLAPEL", 
     "Juzgado de Familia Coquimbo", 
     "Juzgado de Familia La Serena", 
     "Juzgado de Familia Ovalle", 
     "1° JUZGADO CIVIL DE VALPARAISO", 
     "2° JUZGADO CIVIL DE VALPARAISO", 
     "3° JUZGADO CIVIL DE VALPARAISO", 
     "1° JUZGADO CIVIL DE VIÑA DEL MAR", 
     "2° JUZGADO CIVIL DE VIÑA DEL MAR", 
     "4° JUZGADO CIVIL DE VALPARAISO", 
     "5° JUZGADO CIVIL DE VALPARAISO", 
     "3° JUZGADO CIVIL DE VIÑA DEL MAR", 
     "2° JUZGADO DEL CRIMEN DE VALPARAISO", 
     "2° JUZGADO DEL CRIMEN DE VIÑA DEL MAR", 
     "1° JUZGADO DEL TRABAJO DE VALPARAISO", 
     "2° JUZGADO DEL TRABAJO DE VALPARAISO", 
     "3° JUZGADO DE MENORES DE VALPARAISO", 
     "1° JUZGADO DE MENORES DE VIÑA DEL MAR", 
     "2° JUZGADO DE MENORES DE VIÑA DEL MAR", 
     "1° JUZGADO DE LETRAS DE QUILPUE", 
     "2° JUZGADO DE LETRAS DE QUILPUE", 
     "JUZGADO DE LETRAS DE VILLA ALEMANA", 
     "JUZGADO DE LETRAS DE CASABLANCA", 
     "JUZGADO DE LETRAS DE LA LIGUA", 
     "JUZGADO DE LETRAS Y GARANTIA DE PETORCA", 
     "1° JUZGADO DE LETRAS DE LOS ANDES", 
     "2° JUZGADO DE LETRAS DE LOS ANDES", 
     "1° JUZGADO DE LETRAS DE SAN FELIPE", 
     "2° JUZGADO DE LETRAS DE SAN FELIPE", 
     "JUZGADO DE LETRAS Y GARANTIA DE PUTAENDO",
      "JUZGADO DE MENORES DE QUILLOTA", 
      "1° JUZGADO DE LETRAS DE QUILLOTA", 
      "2° JUZGADO DE LETRAS DE QUILLOTA", 
      "JUZGADO DE LETRAS DE CALERA", 
      "JUZGADO DE LETRAS DE LIMACHE", 
      "JUZGADO DE MENORES DE SAN ANTONIO", 
      "1° JUZGADO DE LETRAS DE SAN ANTONIO", 
      "2° JUZGADO DE LETRAS DE SAN ANTONIO", 
      "JUZGADO DE LETRAS Y GARANTIA DE ISLA DE PASCUA", 
      "JUZGADO DE LETRAS Y GARANTIA DE QUINTERO", 
      "JUZGADO DE GARANTIA DE VALPARAISO", 
      "JUZGADO DE GARANTIA DE VIÑA DEL MAR", 
      "JUZGADO DE GARANTIA DE QUILPUE", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL VIÑA DEL MAR", 
      "JUZGADO DE GARANTIA DE SAN ANTONIO", 
      "JUZGADO DE GARANTIA DE CASABLANCA", 
      "JUZGADO DE GARANTIA DE LA LIGUA", 
      "JUZGADO DE GARANTIA DE SAN FELIPE", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE QUILLOTA", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE VALPARAISO", 
      "JUZGADO DE GARANTIA DE LIMACHE", 
      "JUZGADO DE GARANTIA DE LA CALERA", 
      "JUZGADO DE GARANTIA DE QUILLOTA", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE LOS ANDES", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE SAN FELIPE", 
      "JUZGADO DE GARANTIA DE LOS ANDES", 
      "JUZGADO DE GARANTIA DE VILLA ALEMANA", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL SAN ANTONIO", 
      "Juzgado de Familia Casablanca", 
      "Juzgado de Familia La Ligua", 
      "Juzgado de Familia Limache", 
      "Juzgado de Familia Los Andes", 
      "Juzgado de Familia Quillota", 
      "Juzgado de Familia Quilpué", 
      "Juzgado de Familia San Antonio", 
      "Juzgado de Familia San Felipe", 
      "Juzgado de Familia Valparaíso", 
      "Juzgado de Familia Villa Alemana", 
      "Juzgado de Familia Viña del Mar", 
      "Juzgado de Cobranza Laboral y Previsional de Valparaíso", 
      "JUZGADO DEL TRABAJO DE RANCAGUA", 
      "1° JUZGADO DE MENORES DE RANCAGUA", 
      "1° JUZGADO DEL CRIMEN DE RANCAGUA", 
      "1° JUZGADO CIVIL DE RANCAGUA", 
      "1° JUZGADO DE LETRAS DE RENGO", 
      "JUZGADO DE LETRAS DE SAN VICENTE",
      "1° JUZGADO DE LETRAS Y GARANTIA DE PEUMO", 
      "1° JUZGADO DE LETRAS DE SAN FERNANDO", 
      "2° JUZGADO DE LETRAS DE SAN FERNANDO", 
      "1° JUZGADO DE LETRAS DE SANTA CRUZ", 
      "JUZGADO DE LETRAS Y GARANTIA DE PICHILEMU",
      "2° JUZGADO CIVIL DE RANCAGUA", 
      "JUZGADO DE GARANTIA DE SAN FERNANDO", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE SANTA CRUZ", 
      "JUZGADO DE GARANTIA DE SANTA CRUZ", 
      "JUZGADO DE GARANTIA DE RENGO", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL SAN FERNANDO", 
      "JUZGADO DE GARANTIA DE GRANEROS", 
      "JUZGADO DE GARANTIA DE RANCAGUA", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE RANCAGUA", 
      "JUZGADO DE GARANTIA DE SAN VICENTE DE TAGUA-TAGUA", 
      "JUZGADO DE LETRAS Y GARANTIA DE  LITUECHE", 
      "JUZGADO DE LETRAS Y GARANTIA DE PERALILLO", 
      "Juzgado de Familia Rancagua", 
      "Juzgado de Familia Rengo", 
      "Juzgado de Familia San Fernando", 
      "Juzgado de Familia Santa Cruz", 
      "Juzgado de Familia Curico", 
      "1° JUZGADO DE MENORES DE TALCA", 
      "1° JUZGADO DE LETRAS DE TALCA", 
      "2° JUZGADO DE LETRAS DE TALCA", 
      "3° JUZGADO DE LETRAS DE TALCA", 
      "4° JUZGADO DE LETRAS DE TALCA", 
      "JUZGADO DE LETRAS DE CONSTITUCION", 
      "JUZGADO DE LETRAS Y GARANTIA DE CUREPTO", 
      "1° JUZGADO DE LETRAS DE CURICO", 
      "2° JUZGADO DE LETRAS DE CURICO", 
      "3° JUZGADO DE LETRAS DE CURICO", 
      "JUZGADO DE LETRAS Y GARANTIA  DE LICANTEN", 
      "JUZGADO DE LETRAS DE MOLINA", 
      "1° JUZGADO DE LETRAS DE LINARES", 
      "2° JUZGADO DE LETRAS DE LINARES", 
      "JUZGADO DE LETRAS DE SAN JAVIER", 
      "JUZGADO DE LETRAS DE CAUQUENES", 
      "JUZGADO DE LETRAS Y GARANTIA DE CHANCO", 
      "JUZGADO DE LETRAS DE PARRAL", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE CURICO", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE TALCA", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE LINARES", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE CAUQUENES", 
      "JUZGADO DE GARANTIA DE CURICO", 
      "JUZGADO DE GARANTIA DE MOLINA", 
      "JUZGADO DE GARANTIA DE CONSTITUCION", 
      "JUZGADO DE GARANTIA DE TALCA", 
      "JUZGADO DE GARANTIA DE SAN JAVIER",
      "JUZGADO DE GARANTIA DE CAUQUENES", 
      "JUZGADO DE GARANTIA DE LINARES", 
      "JUZGADO DE GARANTIA DE PARRAL", 
      "Juzgado de Familia Constitución", 
      "Juzgado de Familia Linares", 
      "Juzgado de Familia Parral", 
      "Juzgado de Familia Talca", 
      "JUZGADO DE MENORES DE CHILLAN", 
      "2° JUZGADO DEL CRIMEN DE CHILLAN", 
      "1° JUZGADO CIVIL DE CHILLAN", 
      "2° JUZGADO CIVIL DE CHILLAN", 
      "1° JUZGADO DE LETRAS DE SAN CARLOS", 
      "JUZGADO DE LETRAS DE YUNGAY", 
      "JUZGADO DE LETRAS Y GARANTIA DE BULNES", 
      "JUZGADO DE LETRAS Y GARANTIA DE COELEMU", 
      "JUZGADO DE LETRAS Y GARANTIA DE QUIRIHUE", 
      "JUZGADO DE GARANTIA DE CHILLAN", 
      "JUZGADO DE GARANTIA DE YUNGAY", 
      "JUZGADO DE GARANTIA DE SAN CARLOS", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE CHILLAN", 
      "Juzgado de Familia Chillan", 
      "JUZGADOS DE MENORES DE LOS ANGELES", 
      "1° JUZGADO DE LETRAS DE LOS ANGELES", 
      "2° JUZGADO DE LETRAS DE LOS ANGELES", 
      "3° JUZGADO DE LETRAS DE LOS ANGELES", 
      "JUZGADO DE LETRAS Y GARANTIA DE MULCHEN", 
      "JUZGADO DE LETRAS Y GARANTIA DE NACIMIENTO", 
      "JUZGADO DE LETRAS Y GARANTIA  DE LAJA", 
      "JUZGADO DE LETRAS Y GARANTIA DE YUMBEL", 
      "1° JUZGADO CIVIL DE CONCEPCION", 
      "2° JUZGADO CIVIL DE CONCEPCION", 
      "3° JUZGADO CIVIL DE CONCEPCION", 
      "3° JUZGADO  DEL CRIMEN DE CONCEPCION", 
      "1° JUZGADO DEL TRABAJO DE CONCEPCION", 
      "2° JUZGADO DEL TRABAJO DE CONCEPCION", 
      "1° JUZGADO  CIVIL DE TALCAHUANO", 
      "2° JUZGADO CIVIL DE TALCAHUANO", 
      "JUZGADO DE MENORES DE TALCAHUANO", 
      "JUZGADO DE LETRAS DE TOME", 
      "JUZGADO DE LETRAS Y GARANTIA DE FLORIDA", 
      "JUZGADO DE LETRAS Y GARANTIA DE SANTA JUANA", 
      "JUZGADO DE LETRAS Y GARANTIA DE LOTA", 
      "1° JUZGADO DE LETRAS DE CORONEL", 
      "2° JUZGADO DE LETRAS DE CORONEL", 
      "JUZGADO DE LETRAS Y GARANTIA DE LEBU", 
      "JUZGADO DE LETRAS DE ARAUCO", 
      "JUZGADO DE LETRAS Y GARANTIA DE CURANILAHUE", 
      "JUZGADO DE LETRAS DE CAÑETE", 
      "JUZGADO DE LETRAS Y GARANTIA DE SANTA BARBARA", 
      "JUZGADO DE MENORES DE CORONEL", 
      "JUZGADO DE GARANTIA DE SAN PEDRO DE LA PAZ", 
      "JUZGADO DE GARANTIA DE CAÑETE", 
      "JUZGADO DE GARANTIA DE ARAUCO", 
      "JUZGADO DE GARANTIA DE CORONEL", 
      "JUZGADO DE GARANTIA DE TOME", 
      "JUZGADO DE GARANTIA DE TALCAHUANO", 
      "JUZGADO DE GARANTIA DE CHIGUAYANTE", 
      "JUZGADO DE GARANTIA DE CONCEPCION", 
      "JUZGADO DE GARANTIA DE LOS ANGELES", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE CONCEPCION", 
      "JUZGADO DE LETRAS Y GARANTIA DE CABRERO", 
      "Juzgado de Familia Concepción", 
      "Juzgado de Familia Coronel", 
      "Juzgado de Familia Los Angeles", 
      "Juzgado de Familia Talcahuano", 
      "Juzgado de Familia Tomé", "Juzgado de Familia Yumbel", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE LOS ANGELES", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE CAÑETE", 
      "Juzgado de Cobranza Laboral y Previsional de Concepción", 
      "1° JUZGADO CIVIL DE TEMUCO", 
      "2° JUZGADO CIVIL DE TEMUCO",
      "1° JUZGADO DEL CRIMEN DE TEMUCO", 
      "2° JUZGADO DE MENORES DE TEMUCO", 
      "1° JUZGADO DE LETRAS DE ANGOL", 
      "JUZGADO DE LETRAS Y GARANTIA DE COLLIPULLI", 
      "JUZGADO DE LETRAS Y GARANTIA DE TRAIGUEN", 
      "JUZGADO DE LETRAS DE VICTORIA", 
      "JUZGADO DE LETRAS Y GARANTIA DE CURACAUTIN", 
      "JUZGADO DE LETRAS DE LONCOCHE", 
      "JUZGADO DE LETRAS DE PITRUFQUEN", 
      "JUZGADO DE LETRAS DE VILLARRICA", 
      "JUZGADO DE LETRAS DE NUEVA IMPERIAL", 
      "JUZGADO DE LETRAS Y GARANTIA DE PUCON", 
      "JUZGADO DE LETRAS DE LAUTARO", 
      "JUZGADO DE LETRAS Y GARANTIA DE CARAHUE", 
      "3° JUZGADO CIVIL DE TEMUCO", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE TEMUCO", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE ANGOL", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE VILLARRICA", 
      "JUZGADO DE GARANTIA DE TEMUCO", 
      "JUZGADO DE GARANTIA DE PITRUFQUEN", 
      "JUZGADO DE GARANTIA DE VILLARRICA", 
      "JUZGADO DE GARANTIA  DE ANGOL", 
      "JUZGADO DE GARANTIA DE VICTORIA", 
      "JUZGADO DE GARANTIA DE NUEVA IMPERIAL", 
      "JUZGADO DE GARANTIA DE LAUTARO", 
      "JUZGADO DE GARANTIA DE LONCOCHE", 
      "JUZGADO DE LETRAS Y GARANTIA DE TOLTEN", 
      "JUZGADO DE LETRAS Y GARANTIA DE PUREN", 
      "Juzgado de Familia Angol", 
      "Juzgado de Familia Temuco", 
      "2° JUZGADO DEL CRIMEN DE VALDIVIA", 
      "1° JUZGADO CIVIL DE VALDIVIA", 
      "2° JUZGADO CIVIL DE VALDIVIA", 
      "JUZGADO DE LETRAS DE MARIQUINA", 
      "JUZGADO DE LETRAS Y GARANTIA  DE PAILLACO", 
      "JUZGADO DE LETRAS DE LOS LAGOS", 
      "JUZGADO DE LETRAS Y GARANTIA DE PANGUIPULLI", 
      "JUZGADO DE LETRAS Y GARANTIA DE LA UNION", 
      "JUZGADO DE LETRAS Y GARANTIA  DE RIO BUENO", 
      "1° JUZGADO DE LETRAS DE OSORNO", 
      "2° JUZGADO DE LETRAS DE OSORNO", 
      "3° JUZGADO DE LETRAS DE OSORNO", 
      "JUZGADO DE LETRAS DE RIO NEGRO", 
      "JUZGADO DE GARANTIA DE VALDIVIA", 
      "JUZGADO DE GARANTIA DE MARIQUINA", 
      "JUZGADO DE GARANTIA DE LOS LAGOS", 
      "JUZGADO DE GARANTIA DE RIO NEGRO", 
      "JUZGADO DE GARANTIA DE OSORNO", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE VALDIVIA", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE OSORNO", 
      "Juzgado de Familia Osorno", 
      "Juzgado de Familia Valdivia", 
      "JUZGADO DE MENORES DE PUERTO MONTT", 
      "2° JUZGADO DEL CRIMEN DE PUERTO MONTT", 
      "1° JUZGADO CIVIL DE PUERTO MONTT", 
      "1° JUZGADO DE LETRAS DE PUERTO VARAS", 
      "JUZGADO DE LETRAS Y GARANTIA DE CALBUCO", 
      "JUZGADO DE LETRAS Y GARANTIA DE MAULLIN", 
      "JUZGADO DE LETRAS DE CASTRO", 
      "JUZGADO DE LETRAS DE ANCUD", 
      "JUZGADO DE LETRAS Y GARANTIA DE ACHAO", 
      "JUZGADO DE LETRAS Y GARANTIA  DE CHAITEN", 
      "JUZGADO DE LETRAS Y GARANTIA  DE LOS MUERMOS", 
      "JUZGADO DE MENORES DE CASTRO", 
      "JUZGADO DE LETRAS Y GARANTIA DE QUELLON", 
      "2° JUZGADO CIVIL DE PUERTO MONTT", 
      "JUZGADO DE LETRAS Y GARANTIA  DE HUALAIHUE", 
      "JUZGADO DE GARANTIA DE CASTRO", 
      "JUZGADO DE GARANTIA DE PUERTO MONTT", 
      "JUZGADO DE GARANTIA DE PUERTO VARAS", 
      "JUZGADO DE GARANTIA DE ANCUD", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL PUERTO MONTT", 
      "Juzgado de Familia Ancud", 
      "Juzgado de Familia Castro", 
      "Juzgado de Familia Puerto Montt", 
      "Juzgado de Familia Puerto Varas",
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE CASTRO", 
      "1° JUZGADO DE LETRAS DE COYHAIQUE", 
      "2° JUZGADO DE LETRAS DE COYHAIQUE", 
      "JUZGADO DE LETRAS Y GARANTIA DE PUERTO AYSEN", 
      "JUZGADO DE LETRAS Y GARANTIA DE CHILE CHICO", 
      "JUZGADO DE LETRAS Y GARANTIA DE COCHRANE", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE COYHAIQUE", 
      "JUZGADO DE GARANTIA DE COYHAIQUE", 
      "JUZGADO DE LETRAS Y GARANTIA DE PUERTO CISNES", 
      "Juzgado de Familia Coyhaique", 
      "JUZGADO DEL TRABAJO DE PUNTA ARENAS", 
      "JUZGADO DE MENORES DE PUNTA ARENAS", 
      "1° JUZGADO DE LETRAS DE PUNTA ARENAS", 
      "2° JUZGADO DE LETRAS DE PUNTA ARENAS", 
      "3° JUZGADO DE LETRAS DE PUNTA ARENAS", 
      "JUZGADO DE LETRAS Y GARANTIA DE PUERTO NATALES", 
      "JUZGADO DE LETRAS Y GARANTIA DE PORVENIR", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL PUNTA ARENAS", 
      "JUZGADO DE GARANTIA DE PUNTA ARENAS", 
      "Juzgado de Familia Punta Arenas", 
      "1° JUZGADO CIVIL DE SANTIAGO", 
      "2° JUZGADO CIVIL DE SANTIAGO", 
      "3° JUZGADO CIVIL DE SANTIAGO", 
      "4° JUZGADO CIVIL DE SANTIAGO", 
      "5° JUZGADO CIVIL DE SANTIAGO", 
      "6° JUZGADO CIVIL DE SANTIAGO", 
      "7° JUZGADO CIVIL DE SANTIAGO", 
      "8° JUZGADO CIVIL DE SANTIAGO", 
      "9° JUZGADO CIVIL DE SANTIAGO", 
      "10° JUZGADO CIVIL DE SANTIAGO", 
      "11° JUZGADO CIVIL DE SANTIAGO", 
      "12° JUZGADO CIVIL DE SANTIAGO", 
      "13° JUZGADO CIVIL DE SANTIAGO", 
      "14° JUZGADO CIVIL DE SANTIAGO", 
      "15° JUZGADO CIVIL DE SANTIAGO", 
      "16° JUZGADO CIVIL DE SANTIAGO", 
      "17° JUZGADO CIVIL DE SANTIAGO", 
      "18° JUZGADO CIVIL DE SANTIAGO", 
      "19° JUZGADO CIVIL DE SANTIAGO", 
      "20° JUZGADO CIVIL DE SANTIAGO", 
      "21° JUZGADO CIVIL DE SANTIAGO", 
      "22° JUZGADO CIVIL DE SANTIAGO", 
      "23° JUZGADO CIVIL DE SANTIAGO", 
      "24° JUZGADO CIVIL DE SANTIAGO", 
      "25° JUZGADO CIVIL DE SANTIAGO", 
      "26° JUZGADO CIVIL DE SANTIAGO", 
      "27° JUZGADO CIVIL DE SANTIAGO", 
      "28° JUZGADO CIVIL DE SANTIAGO", 
      "29° JUZGADO CIVIL DE SANTIAGO", 
      "30° JUZGADO CIVIL DE SANTIAGO", 
      "1° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "2° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "3° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "4° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "5° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "6° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "7° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "8° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "9° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "10° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "11° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "12° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "13° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "14° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "15° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "16° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "17° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "18° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "19° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "20° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "21° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "22° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "23° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "24° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "25° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "26° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "27° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "28° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "29° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "30° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "31° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "32° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "33° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "34° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "35° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "35° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "36° JUZGADO DEL CRIMEN DE SANTIAGO", 
      "1° JUZGADO DEL TRABAJO DE SANTIAGO", 
      "2° JUZGADO DEL TRABAJO DE SANTIAGO", 
      "3° JUZGADO DEL TRABAJO DE SANTIAGO", 
      "4° JUZGADO DEL TRABAJO DE SANTIAGO", 
      "5° JUZGADO DEL TRABAJO DE SANTIAGO", 
      "6° JUZGADO DEL TRABAJO DE SANTIAGO", 
      "7° JUZGADO DEL TRABAJO DE SANTIAGO", 
      "8° JUZGADO DEL TRABAJO DE SANTIAGO", 
      "9° JUZGADO DEL TRABAJO DE SANTIAGO", 
      "2° JUZGADO DE MENORES DE SANTIAGO", 
      "7° JUZGADO DE MENORES DE SANTIAGO", 
      "2° JUZGADO DE MENORES DE PUDAHUEL", 
      "JUZGADO DE LETRAS DE COLINA", 
      "1° JUZGADO DE GARANTIA DE SANTIAGO", 
      "2° JUZGADO DE GARANTIA DE SANTIAGO", 
      "3° JUZGADO DE GARANTIA DE SANTIAGO", 
      "4° JUZGADO DE GARANTIA DE SANTIAGO", 
      "5° JUZGADO DE GARANTIA DE SANTIAGO", 
      "6° JUZGADO DE GARANTIA DE SANTIAGO", 
      "7° JUZGADO DE GARANTIA DE SANTIAGO", 
      "8° JUZGADO DE GARANTIA DE SANTIAGO", 
      "9° JUZGADO DE GARANTIA DE SANTIAGO", 
      "13° JUZGADO DE GARANTIA DE SANTIAGO", 
      "14° JUZGADO DE GARANTIA DE SANTIAGO", 
      "JUZGADO DE GARANTIA DE COLINA", 
      "1° TRIBUNAL DE JUICIO ORAL EN LO PENAL DE SANTIAGO", 
      "2° TRIBUNAL DE JUICIO ORAL EN LO PENAL DE SANTIAGO", 
      "3° TRIBUNAL DE JUICIO ORAL EN LO PENAL DE SANTIAGO", 
      "4° TRIBUNAL DE JUICIO ORAL EN LO PENAL DE SANTIAGO", 
      "5° TRIBUNAL DE JUICIO ORAL EN LO PENAL DE SANTIAGO", 
      "7° TRIBUNAL DE JUICIO ORAL EN LO PENAL DE SANTIAGO", 
      "1° Juzgado de Familia Santiago", 
      "2° Juzgado de Familia Santiago", 
      "3° Juzgado de Familia Santiago", 
      "4° Juzgado de Familia Santiago", 
      "Juzgado de Familia Colina", 
      "Juzgado de Familia Pudahuel", 
      "TRIBUNAL DE JUICIO ORAL EN LO PENAL DE COLINA", 
      "Juzgado de Cobranza Laboral y Previsional de Santiago", 
      "1° JUZGADO CIVIL DE SAN MIGUEL", 
      "2° JUZGADO CIVIL DE SAN MIGUEL", 
     "3° JUZGADO CIVIL DE SAN MIGUEL", 
     "1° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "2° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "3° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "4° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "5° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "6° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "7° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "8° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "9° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "10° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "11° JUZGADO DEL CRIMEN SAN MIGUEL", 
     "1° JUZGADO DEL TRABAJO SAN MIGUEL", 
     "2° JUZGADO DEL TRABAJO SAN MIGUEL", 
     "1° JUZGADO DE MENORES DE SAN MIGUEL", 
     "2° JUZGADO DE MENORES DE SAN MIGUEL", 
     "4° JUZGADO DE MENORES DE SAN MIGUEL", 
     "1° JUZGADO CIVIL DE PUENTE ALTO", 
     "2° JUZGADO DEL CRIMEN DE PUENTE ALTO", 
     "JUZGADO DE MENORES DE SAN BERNARDO", 
     "JUZGADO DE MENORES DE PUENTE ALTO", 
     "1° JUZGADO DE LETRAS DE TALAGANTE", 
     "2° JUZGADO DE LETRAS DE TALAGANTE", 
     "1° JUZGADO DE LETRAS DE MELIPILLA", 
     "1° JUZGADO DE LETRAS DE BUIN", 
     "2° JUZGADO DE LETRAS DE BUIN", 
     "JUZGADO DE LETRAS DE PEÑAFLOR", 
     "4° JUZGADO CIVIL DE SAN MIGUEL", 
     "1° JUZGADO DE LETRAS DE SAN BERNARDO", 
     "2° JUZGADO DE LETRAS DE SAN BERNARDO", 
     "10° JUZGADO DE GARANTIA DE SANTIAGO", 
     "11° JUZGADO DE GARANTIA DE SANTIAGO", 
     "12° JUZGADO DE GARANTIA DE SANTIAGO", 
     "15° JUZGADO DE GARANTIA DE SANTIAGO", 
     "JUZGADO DE GARANTIA DE PUENTE ALTO", 
     "JUZGADO DE GARANTIA DE SAN BERNARDO", 
     "JUZGADO DE GARANTIA DE MELIPILLA", 
     "JUZGADO DE GARANTIA DE CURACAVI", 
     "JUZGADO DE GARANTIA DE TALAGANTE", 
     "6° TRIBUNAL DE JUICIO ORAL EN LO PENAL DE SANTIAGO", 
     "1° Juzgado de Familia San Miguel", 
     "2° Juzgado de Familia San Miguel", 
     "Juzgado de Familia Buin", "Juzgado de Familia Melipilla", 
     "Juzgado de Familia Peñaflor", 
     "Juzgado de Familia Puente Alto", 
     "Juzgado de Familia San Bernardo", 
     "Juzgado de Familia Talagante", 
     "TRIBUNAL DE JUICIO ORAL EN LO PENAL TALAGANTE", 
     "TRIBUNAL DE JUICIO ORAL EN LO PENAL PUENTE ALTO", 
     "TRIBUNAL DE JUICIO ORAL EN LO PENAL SAN BERNARDO", 
     "Juzgado de Cobranza Laboral y Previsional de San Miguel",
      "tribunal arbitral",
      "Juzgado de Letras del Trabajo de San Bernardo"
    ]

  module.exports = {comunas,tribunales};
  