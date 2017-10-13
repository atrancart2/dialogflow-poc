import * as crypto from "crypto";
import * as PouchDB from "pouchdb-node";

const TYPE_USER = "user";

/**
 * Handle persistence of User data.
 *
 * @export
 * @class DbManager
 */
export default class DbManager {
  public db: PouchDB.Database;

  constructor(path) {
    this.db = new PouchDB(path);
  }

  /**
   * Create an user and return the document.
   *
   * @param {string} email - In order to find the user in the model.
   * @returns {Promise<any>}
   * @memberof DbManager
   */
  public async createUser(email: string): Promise<any> {
    return await this.db.put({
      _id: `user_${email}`,
      accessKey: this.generateAccessKey(),
      type: TYPE_USER,
    });
  }

  /**
   * Return an user that registered with current-mail
   *
   * @param {string} email - In order to find the user in the model.
   * @param {string} accessKey - The key provided during user first arrival.
   * @returns {Promise<any>}
   * @memberof DbManager
   */
  public async getUserSecure(email: string, accessKey: string): Promise<any> {
    const doc = await this.db.get(`user_${email}`) as any;

    if (doc.accessKey !== accessKey) {
      throw new Error("Invalid Access Key provided !");
    }

    return doc;
  }

  public async getUserUnsecured(email: string): Promise<any> {
    return await this.db.get(`user_${email}`) as any;
  }

  /**
   * Patch the user with new data.
   *
   * @param {string} email - In order to find the user in the model.
   * @param {string} accessKey - The key provided during user first arrival.
   * @param {object} data - An object that will be merged with the current user object.
   * @returns {Promise<any>}
   * @memberof DbManager
   */
  public async patchUser(email: string, accessKey: string, data: object): Promise<any> {
    const doc = await this.getUserSecure(email, accessKey);
    console.log(`=== PATCHING USER : ${email} ===`);
    console.log(doc);
    console.log("");

    await this.db.put(Object.assign(doc, data));
    console.log("Done");
    return await this.getUserUnsecured(email);
  }

  /**
   * Generate an random hex number.
   *
   * @private
   * @param {any} len - The hash len
   * @returns
   * @memberof DbManager
   */
  private generateAccessKey(len = 5) {
    return crypto.randomBytes(Math.ceil(len / 2))
      .toString("hex") // convert to hexadecimal format
      .slice(0, len);   // return required number of characters
  }
}
