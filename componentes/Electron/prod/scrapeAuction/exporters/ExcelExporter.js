const { fixStringDate } = require("../../../../../utils/cleanStrings");
const {createExcel} = require("../../../../excel/createExcel.js");

class ExcelExporter {
    constructor(startDate, endDate, saveFile, config) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.saveFile = saveFile;
        this.emptyMode = config.emptyMode;
        this.type = config.type;
        this.isTestMode = config.isTestMode;

        // this.fixedStartDate = new Date(fixStringDate(this.startDate));
        // this.fixedEndDate = new Date(fixStringDate(this.endDate));
    }

    async export(causas) {
        const excelBuilder = new createExcel(this.saveFile, this.startDate, this.emptyMode, this.type, this.isTestMode);
        // const filePath = excelBuilder.build(causas);

        const fileName = await excelBuilder.writeData(causas)
        
        return fileName;

    }

}


module.exports = ExcelExporter;