"use strict";
const imaps = require('imap-simple');
const XLSX = require('xlsx');
const EmailRepository = require("../repository/readEmail");
// ('use strict');

class ReadXLSXEmail {
  constructor() {
    this.config = {
      imap: {
        user: process.env.EMAIL_NAME,
        password: process.env.EMAIL_PASSWORD,
        host: 'imap.gmail.com',
        port: '993',
        tls: 'true',
        authTimeout: '10000',
        tlsOptions: {
          rejectUnauthorized: false,
        },
      },
    };
    this.EmailRepository = new EmailRepository();
  }

  async getAttachmentFromMessages(messages, connection) {
    let attachments = [];

    messages.forEach(async message => {
      let parts = imaps.getParts(message.attributes.struct);
      attachments = attachments.concat(
        parts
          .filter(part => {
            return (
              part.disposition &&
              part.disposition.type.toUpperCase() === 'ATTACHMENT'
            );
          })
          .map(async part => {
            // retrieve the attachments only of the messages with attachments
            let partData = await connection.getPartData(message, part);
            return {
              filename: part.params.name,
              data: partData,
            };
          })
      );

      console.log(message);

      // Marca email como lido
      //await connection.addFlags(message.attributes.uid, 'SEEN');
    });

    return await Promise.all(attachments);
  }

  async run() {
    const connection = await imaps.connect(this.config);

    let delay = 72 * 3600 * 1000;
    let yesterday = new Date();
    yesterday.setTime(Date.now() - delay);
    yesterday = yesterday.toISOString();

    let today = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    await connection.openBox('INBOX');
    const searchCriteria = [
      // ['FROM', process.env.EMAIL_FROM_XML_IMPORT],
      ["UNSEEN", ['SINCE', today]],
    ];
    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
      struct: true,
      markSeen: true,
    };

    // retrieve only the headers of the messages
    let messages = await connection.search(searchCriteria, fetchOptions);

    let attachments = await this.getAttachmentFromMessages(
      messages,
      connection
    );

    if (attachments[0]) {
      let workbook = XLSX.read(attachments[0].data, {
        type: 'buffer',
        cellDates: true,
      });
      let first_worksheet = workbook.Sheets[workbook.SheetNames[0]];
      //const firstColumn = first_worksheet.A1 ? first_worksheet.A1.v : null;
      let body = await XLSX.utils.sheet_to_json(first_worksheet, {
        header: 0,
      });

      console.log("Body Email", body);
      this.EmailRepository.readEmail(body);
    }

    return attachments;
  }
}

module.exports = ReadXLSXEmail;
