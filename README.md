# webScrappingInmobiliaria
---

Esta aplicacion esta creada para obtener datos de remates a travez de web scrapping, esta construida con Electron para su uso en varios sistemas operativos.
La aplicacion realiza el web scrapping a travez de axios y puppeteer.
La aplicacion corre puppeteer con el navegador que viene con Electron


- **npm start** : Ejecuta la aplicacion principal.
- **npm run empty**: Test para revisar si la aplicacion puede generar un excel vacio.
- **npm run dev**: Para ejecutar la aplicacion en modo desarrollador.

En caso de que aparezca algun error con la version de node actual
- **npm run rebuild**

Aparte de estos comandos universales existen test creados en **./componentes/economico/testEconomico.js** los cuales estan documentas si se corre el programa sin ningun argumento.
 