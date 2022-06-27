"use strict";

const imaps = require("imap-simple");
const Env = use("Env");
const parser = require("xml2json");
const EmailRepository = require("../repository/readEmail");

class ReadEmail {
  constructor() {
    this.config = {
      imap: {
        user: Env.get("EMAIL_NAME"),
        password: Env.get("EMAIL_PASSWORD"),
        host: "imap.gmail.com",
        port: "993",
        tls: "true",
        authTimeout: "10000",
        tlsOptions: {
          rejectUnauthorized: false,
        },
      },
    };
    this.EmailRepository = new EmailRepository();
  }

  async getAttachmentFromMessages(messages, connection) {
    let attachments = [];

    messages.forEach(async (message) => {
      let parts = imaps.getParts(message.attributes.struct);
      attachments = attachments.concat(
        parts
          .filter((part) => {
            return (
              part.disposition &&
              part.disposition.type.toUpperCase() === "ATTACHMENT"
            );
          })
          .map(async (part) => {
            // retrieve the attachments only of the messages with attachments
            if (part.subtype.toUpperCase() === "XML") {
              let partData = await connection.getPartData(message, part);
              const xml = parser.toJson(partData);
              return await JSON.parse(xml);
            }
          })
      );
    });

    return await Promise.all(attachments);
  }

  async run() {
    const connection = await imaps.connect(this.config);

    const delay = 72 * 3600 * 1000;
    let yesterday = new Date();
    yesterday.setTime(Date.now() - delay);
    yesterday = yesterday.toISOString();

    await connection.openBox("INBOX");
    const searchCriteria = [
      // [
      //   "OR",
      //   ["FROM", Env.get("EMAIL_FROM_XML_IMPORT")],
      //   ["FROM", Env.get("EMAIL_FROM_XML_IMPORT_SECOND")],
      // ],
      ["UNSEEN", ["SINCE", yesterday]],
    ];

    const fetchOptions = {
      bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)"],
      struct: true,
      markSeen: true,
    };

    // retrieve only the headers of the messages
    const messages = await connection.search(searchCriteria, fetchOptions);

    const attachments = await this.getAttachmentFromMessages(
      messages,
      connection
    );

    if (attachments.length) {
      return await this.EmailRepository.readEmail(attachments);
    }

    return attachments;
  }
}

module.exports = ReadEmail;
