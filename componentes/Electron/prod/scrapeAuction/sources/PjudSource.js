
class PjudSource{
    constructor(){

    }

    getName(){ return 'pjud'; }

    async fetch(startDate, endDate, { event, mainWindow, emptyMode, testMode }) {

        if (emptyMode) return [];

        try {
            await this.launchPuppeteer_inElectron();
            const endDateModified = stringToDate(endDateOrigin);
            endDateModified.setDate(endDateModified.getDate() + 1); // Aumentar un dia para incluir el ultimo dia
            const startDate = dateToPjud(stringToDate(startDateOrigin));
            const endDate = dateToPjud(endDateModified);

            casos = await this.searchCasesByDay(startDate, endDate);
            casos.reverse(); // Invertir el orden de los casos para que aparezcan del mas reciente al mas antiguo

            const gestorRemates = new GestorRematesPjud(casos, event, this.mainWindow, NORMAL);
            const result = await gestorRemates.getInfoFromAuctions();

            logger.info("Cantidad de casos obtenidos de pjud: ", casos.length);
        } catch (error) {
            console.error("Error en el pjud :", error.message);
        }

        return casos;
    }
}