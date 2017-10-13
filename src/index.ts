import * as bodyParser from "body-parser";
import * as express from "express";
import DbManager from "./db";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Init db
const dbManager = new DbManager("database-folder");

/**
 * You can set:
 * - req.speech - For the sentence to be displayed
 * - req.contextOut - For outbound context
 */
app.post("/", async (req, res, next) => {
  const action = req.body.result.action;
  const params = req.body.result.parameters;

  // Handle specific job
  switch (action) {
    case "welcome-init":
      welcomeInit(params)
        .then((data) => {
          Object.assign(req, data);
          next();
        });
      break;
    case "check-access-key":
      checkAccessKey(params)
        .then((data) => {
          Object.assign(req, data);
          next();
        });
      break;
    default:
      next();
  }
});

/**
 * Handle welcome init event.
 * This will look for an existing user or create it.
 *
 * @param {object} params - The request params
 */
const welcomeInit = async ({ email, firstname }): Promise<any> => {
  // Search for existing user first
  console.log("=== Matched Welcome INIT ===");
  try {
    console.log(`=== CHECK USER IN THE SYSTEM : ${email}`);
    const doc = await dbManager.getUserUnsecured(email);

    console.log("User found !");
    console.log(doc);
    return {
      followupEvent: {
        data: { email },
        name: "ask-access-key",
      },
    };
  } catch (e) {
    console.log("User not found ! Creating it....");

    // Otherwise create a new one
    await dbManager.createUser(email)
      .catch((error) => {
        console.log("!!! ERROR ON CREATION !!!!");
        console.log(error);
        process.exit();
      });

    let doc = await dbManager.getUserUnsecured(email)
      .catch((error) => {
        console.log("!!! ERROR ON GETTING USER USECURED !!!!");
        console.log(error);
        process.exit();
      });

    doc = await dbManager.patchUser(email, doc.accessKey, { firstname });

    console.log("=== USER CREATED ===");
    console.log(doc);
    console.log("");

    return {
      contextOut: [{ name: "User-Retrieved-Data", lifespan: 10, parameters: { doc } }],
      speech: `Bienvenue ${firstname}, ravi de faire votre connaissance.
      Voici un code qui vous permettra de reprendre notre discussion si vous partez [${doc.accessKey}].
      Que puis-je faire pour vous en cette belle journée ?`,
    };
  }
};

/**
 * Handle welcome init event.
 * This will look for an existing user or create it.
 *
 * @param {object} params - The request params
 */
const checkAccessKey = async ({ email, accessKey }): Promise<any> => {
  // Search for existing user first
  console.log("=== Matched Check Access Key ===");
  try {
    console.log(`=== CHECK KEY : ${accessKey} for email : ${email}`);
    const doc = await dbManager.getUserSecure(email, accessKey);
    console.log("Access key valid ! Continuing");
    return {
      speech: `Merci ! Heureux de vous revoir ${doc.firstname}. TODO : Ask for action`,
    };
  } catch (e) {
    console.log("Invalid access key");

    return {
      contextOut: [{ name: "User-Failed-Auth", lifespan: 1 }],
      speech: `Désolé, j'ai mais ce n'est pas le bon code. Dois-je vous le renvoyer par e-mail ?`,
    };
  }
};

const somethingElse = () => {
  const speech = `J'ai retrouvé notre discussion d'après les informations !
  Vous souhaitiez voyager à pour une durée de  jours.
  Le départ était prévu pour le .  personnes`;

};

// Final formatter
app.use(({ speech, contextOut, followupEvent }, res) => {
  res.setHeader("Content-Type", "application/json");
  const data = {
    contextOut,
    displayText: speech,
    followupEvent,
    source: "NodeJS",
    speech,
  };
  console.log("=== SENDING DATA ===");
  console.log(data);
  res.send(data);
});

app.listen(process.env.PORT || 80, () => {
  console.log(`Node app is running on port ${process.env.PORT || 80}`);
});
