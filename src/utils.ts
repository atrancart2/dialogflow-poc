import * as cheerio from "cheerio";
import * as requestmodule from "request";

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
