import DbManager from "../db";
import IChatResponse from "../IChatResponse";

/**
 * Handle welcome init event.
 * This will look for an existing user or create it.
 *
 * @param {object} params - The request params
 */
export const welcomeInit = async ({ email, firstname }, dbManager: DbManager): Promise<IChatResponse> => {
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
