const express = require("express");
const app = express();
const scheduleEmail = require("./scheduler/readEmail");
const scheduleEmailXLSX = require("./scheduler/readEmailXLSX");

// Scheduler
scheduleEmail.execute();
scheduleEmailXLSX.execute();

const port = process.env.PORT || 8000;

app.listen(port, () =>{
  console.log(`Iniciado port: ${port}`);
});