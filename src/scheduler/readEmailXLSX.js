const schedule = require('node-schedule');
const ReadEmailXLSX = require('../service/readEmailXLSX');

async function execute() {
  scheduleReadXLSX();
}

async function scheduleReadXLSX() {
  const readEmailXLSX = new ReadEmailXLSX();
  schedule.scheduleJob("*/5 7-23 * * 1-5",
    function () {
      console.log('########## ENTROU schedule Read Email XLSX');
      readEmailXLSX.run();
    }
  );
}

module.exports = { execute };
