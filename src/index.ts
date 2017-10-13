import * as bodyParser from "body-parser";
import * as cheerio from "cheerio";
import * as express from "express";
import * as requestmodule from "request";
import DbManager from "./db";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(`${__dirname}/public`));

// views is directory for all template files
app.set("views", `${__dirname}/views`);
app.set("view engine", "ejs");

// Init db
const dbManager = new DbManager("database-folder");

const countryInfo = (country, info, rq, rs) => {
  let speech = "Je ne trouve aucune information pour ce pays, désolé";
  let image = "";
  const url = `http://fr.april-international.com/global/destination/expatriation-${rq.body.result.parameters.country
    .toLowerCase()
    .replace(" ", "-")}`;

  requestmodule(url, (e, r, html) => {
    if (!e) {
      const $ = cheerio.load(html);

      $("#r-header").filter(() => {
        const data = $(this);
        image = data
          .children()
          .find("img")
          .first()
          .attr("src");
      });

      $(`.field-name-field-fiche-pays-${info}`).filter(() => {
        const data = $(this);
        switch (info) {
          case "nb-habitants":
            speech = `${image}\nLa population totale est de ${data
              .children()
              .find(".field-item")
              .first()
              .text()} (${rq.body.result.parameters.country})`;
            break;
          case "pib":
            speech = `${image}\nLe pib est de ${data
              .children()
              .find(".field-item")
              .first()
              .text()} (${rq.body.result.parameters.country})`;
            break;
          case "capitale":
            speech = `${image}\nLa capitale est ${data
              .children()
              .find(".field-item")
              .first()
              .text()} (${rq.body.result.parameters.country})`;
            break;
          default:
            console.error("Default switch case triggered");
        }

        rs.send({ speech, displayText: speech });
      });
    } else {
      console.log(e);
    }
  });
};

const getUserInfo = (email, rs) => {
  const speech = `Bonjour`;
  rs.send({ speech, displayText: speech });
};

app.get("/", (request, res) => {
  res.send("hello");
});

app.post("/", (request, response) => {
  response.setHeader("Content-Type", "application/json");
  const action = request.body.result.action;
  const params = request.body.result.parameters;

  if (typeof params.population !== "undefined" && params.population !== "" && typeof params.country !== "undefined") {
    countryInfo(params.country, "nb-habitants", request, response);
  }
  if (typeof params.capitale !== "undefined" && params.capitale !== "" && typeof params.country !== "undefined") {
    countryInfo(params.country, "capitale", request, response);
  }
  if (typeof params.pib !== "undefined" && params.pib !== "" && typeof params.country !== "undefined") {
    countryInfo(params.country, "pib", request, response);
  }

  switch (action) {
    case "register-email":
      dbManager.createUser(params.email)
        .then(() => {
          console.log(`User ${params.email} created !`);
        });
  }

});

app.listen(process.env.PORT || 80, () => {
  console.log(`Node app is running on port ${process.env.PORT || 80}`);
});
