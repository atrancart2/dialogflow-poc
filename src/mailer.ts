import * as NodeMailer from "nodemailer";

export default class Mailer {
    private transporter: NodeMailer.Transporter;

    constructor() {
        this.transporter = NodeMailer.createTransport({
            host: "mx-gw.infrawan.net",
            port: 25,
        });

        this.transporter.verify()
            .then(() => console.log("Mail Server is ready to take our messages"))
            .catch((e) => console.log(e));
    }

    /**
     * Send a mail to an user.
     * !!! The from is already handled and will be overrided by the method. !!!
     *
     * @param {NodeMailer.SendMailOptions} opts - Some options in order to fill the email.
     *
     * @returns {Promise<NodeMailer.SentMessageInfo>}
     * @memberof Mailer
     */
    public async sendMail(opts: NodeMailer.SendMailOptions): Promise<NodeMailer.SentMessageInfo> {
        const options = Object.assign(opts, { from: `"Chatbot 👻" <ahanss@kaliop.com>` });

        return await this.transporter.sendMail(options);
    }
}
