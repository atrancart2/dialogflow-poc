import DbManager from "../db";
import { Assertion } from "../entities";
import IChatResponse from "../IChatResponse";
import Mailer from "../mailer";

/**
 * Handle welcome init event.
 * This will look for an existing user or create it.
 *
 * @param {object} params - The request params
 */
export const checkAccessKey = async ({ email, accessKey }, dbManager: DbManager): Promise<IChatResponse> => {
    // Search for existing user first
    console.log("=== Matched Check Access Key ===");
    try {
        console.log(`=== CHECK KEY : ${accessKey} for email : ${email}`);
        const doc = await dbManager.getUserSecure(email, accessKey);
        console.log("Access key valid ! Continuing");
        let speech = `Merci ! Heureux de vous revoir ${doc.firstname}`;
        
        if(doc.destination)
        {
          speech += `
Lors de notre dernière conversation vous m'aviez dit vouloir voyager vers ${doc.destination}`;
        }
        
        speech += `
Que puis-je pour vous ?`;        
        
        return {
            contextOut: [{ name: "User-Retrieved-Data", lifespan: 10, parameters: { doc } }],
            speech
        };
    } catch (e) {
        console.log("Invalid access key");

        return {
            contextOut: [
              { name: "Asked-Password-Recovery", lifespan: 1, parameters: { email } },
              { name: "User-Retrieved-Data", lifespan: 0 },
            ],
            speech: `Désolé, mais ce n'est pas le bon code. Dois-je vous le renvoyer par e-mail ?`,
        };
    }
};

export const askPasswordRecovery = async (
    params,
    dbManager: DbManager,
    mailer: Mailer,
): Promise<IChatResponse> => {
    if (params["user-accept-password-recovery"] === Assertion.NON) {
        return { speech: "D'accord, à une prochaine fois alors." };
    }

    const email = params.email;
    const doc = await dbManager.getUserUnsecured(email);

    await mailer.sendMail({
        subject: "Votre récupération de mot de passe",
        text: `
        Bonjour ${doc.firstname},
        voici le code permettant d'accéder à notre discussion [${doc.accessKey}].
        À tout de suite !`,
        to: email,
    });

    return {
        contextOut: [{ name: "AskAccessKeyContext", lifespan: 2 }], // Display the waitpassword window and prompted.
        speech: "D'accord, je vais vous l'envoyer dans ce cas. Donnez le moi quand vous le recevrez",
    };
};
