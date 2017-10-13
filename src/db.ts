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
      accessKey: this.generateAccessKey(4),
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
  public async getUser(email: string, accessKey: string): Promise<any> {
    const doc = await this.db.get(`user_${email}`) as any;

    if (doc.accessKey !== accessKey) {
      throw new Error("Invalid Access Key provided !");
    }
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
    const doc = await this.getUser(email, accessKey);

    return await this.db.put(Object.assign(doc, data));
  }

  private generateAccessKey(len) {
    return crypto.randomBytes(Math.ceil(len / 2))
      .toString("hex") // convert to hexadecimal format
      .slice(0, len);   // return required number of characters
  }
}
