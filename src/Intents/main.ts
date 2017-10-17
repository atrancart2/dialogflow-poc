import DbManager from "../db";
import IChatResponse from "../IChatResponse";
import { searchTrains, searchStations } from "../api";
import * as moment from 'moment';

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
            contextOut: [{ name: "AskAccessKeyContext", lifespan: 1 }],
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
 * Handle train trip research.
 * This will look for trips according to user's criterias.
 *
 * @param {object} params - The request params
 */
export const searchTrainsAction = async (params, dbManager: DbManager): Promise<IChatResponse> => {
  // Ca ca attends que la promise se résolve et ça met la data dedans
  console.log("=== TRAINS CALL ===");
  
  moment.locale('fr');
  
  //TRAJET ALLER
  //On construit les paramètres en JSON à envoyer à l'api de recherche de trajet de train
  const trainParams = await buildSearchTrainsParams(params, false);
  //envoi de la requête
  const response = await searchTrains(trainParams);
  
  if(!response.ok){
    console.error("L'appel a foiré");
  }
  
  var speech = buildSpeechTrainResults(params, response, false);
  
  if(params.return_date != null){
    //TRAJET RETOUR
    //On construit les paramètres en JSON à envoyer à l'api de recherche de trajet de train
    const trainParams = await buildSearchTrainsParams(params, true);
    //envoi de la requête
    const response = await searchTrains(trainParams);
    
    if(!response.ok){
      console.error("L'appel a foiré");
    }
    
    speech += `
    
    `;
    speech += buildSpeechTrainResults(params, response, true);
  }
  
  console.log(speech);
  
  return {
    speech: speech
  }
  
};

/**
 * Call trainline api to get train station id from user input.
 * Exemple : user enter "Paris", api return 4916
 *
 * @param {object} params - The request params
 */
const getStation = async(params) => {
    const stationResponse = await searchStations({ context:"search", q:params });
    
    return stationResponse.data["stations"][0];
} 

/**
 * Build trainline api parameters
 *
 * @param {object} params - The request params
 */
const buildSearchTrainsParams = async(params, isReturn) => {
  
  const origin_station = await getStation(params.origin);
  const destination_station = await getStation(params.destination);

  var ret = {
      "search": {
      "departure_date": isReturn ? params.return_date : params.departure_date,
      "departure_station_id": isReturn ? destination_station.id : origin_station.id,
      "arrival_station_id": isReturn ? origin_station.id : destination_station.id,
      "return_date": null,
      "passengers":[  
             {  
                "id": "ef107e2d-d6c6-4d08-a65f-690eb3b522fa",
                "label": "adult",
                "age": 26,
                "cards": [  
                ],
                "cui": null
             }
         ],
         "systems":[  
             "sncf",
             "db",
             "idtgv"
          ],
          "exchangeable_part":null,
          "via_station_id":null,
          "exchangeable_pnr_id":null
    }
  };

  console.log(ret);
  
  return ret;
  
}

/**
 * Build output speech according to trainline api result
 *
 * @param {object} params - The request params
 */
const buildSpeechTrainResults = (params, response, isReturn) => {
  
  console.log("=== TRAINS RESULTS TRIPS ===");
  console.log("");
  const trips = response.data["trips"];
  const segments = response.data["segments"];
  const folders = response.data["folders"];
  const departure = isReturn ? moment(params.return_date) : moment(params.departure_date);
  const trip_type = isReturn ? "Retour" : "Aller";
  //Construction du message de retour
  var speech = `Trajet ${trip_type} : ${params.origin} -> ${params.destination}, le ${departure.format('dddd Do MMMM YYYY')}`;
  
  for(var i = 0; i < trips.length; i++)
  {
    var trip = trips[i];
    var segment = segments[i];
    var folder = folders[i];
    
    //On filtre sur les trains (pas les bus) et sur les horaires standards (non pro = flexible)
    if(segment.transportation_mean == "train" && folder.flexibility == "nonflexi")
    {
      var departure_time = moment(trip.departure_date);
      var arrival_time = moment(trip.arrival_date);
      var departure_minutes = departure_time.minutes() < 10 ? "0"+departure_time.minutes() : departure_time.minutes();
      var departure_hours = departure_time.hour() < 10 ? "0"+departure_time.hour() : departure_time.hour();
      var arrival_minutes = arrival_time.minutes() < 10 ? "0"+arrival_time.minutes() : arrival_time.minutes();
      var arrival_hours = arrival_time.hour() < 10 ? "0"+arrival_time.hour() : arrival_time.hour();
      var travel_class = segment.travel_class == "economy" ? "2ème classe" : "1ère classe";
    
      speech += `
        Départ : ${departure_hours}:${departure_minutes} -> Arrivée : ${arrival_hours}:${arrival_minutes} pour ${trip.cents/100}€ en ${travel_class}`;
    }
  }
  
  return speech;
  
}
