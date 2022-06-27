"use strict";

const Schedule = require("node-schedule");
const ReadEmailXLSX = require('../service/readEmailXLSX');

async function schedulerEmail() {
  console.log("---- ReadEmail ----");
  // return await new ReadEmailXLSX().run();
  return await new ReadEmailXLSX.run();
}

async function execute() {
  console.log("ReadEmail Iniciado");
  Schedule.scheduleJob("*/15 * * * *", schedulerEmail);
  // schedulerEmail();
}

module.exports = { execute };
