
import fetch from "node-fetch";
import { start } from "repl";
// Har brukeren brukt programmet riktig?
// ta vare på lokasjonen som brukeren ønsker vær data i fra
const BASE_URL = "https://www.yr.no/api/v0/"
const MAANED_NAVN = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
const DAGER = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
const WEATHER_CONDITIONS = {
    "clearsky": "🌞  Klar himmel",
    "fair": " 🌞  Pent vær",
    "partlycloudy": "🌥️  Delvis skyet",
    "cloudy": " ☁️  Skyet",
    "rain": " 🌧️  Regn",
    "lightrain": "🌧️  Lett regn",
    "lightrainshowers": "🌧️  Lette regnbyger",
    "snow": "🌨️ Snø",
    "lightsnow": "🌨️ Lett snøfall",
    "sleet": "🌨️ Sludd",
    "rainshowers": "🌧️ Regnbyger",
    "rainshowersandthunder": " ⛈️ Regnbyger og torden",
    "sleetshowers": " 🌨️ Sluddbyger",
    "heavyrain": "🌧️ Kraftig regn",
};

//oneliners delivered with help from chatgpt version 3.5
const ONE_LINERS = {
    "clearsky": "Klart himmel, klart sinn 🌞",
    "fair": "Ser ut som en fin dag idag 🌞",
    "partlycloudy": "Sol, skyer vi tar det vi får 🌥️",
    "cloudy": "Skyete, med en sjangse for skyer ☁️ ",
    "rain": "Dette er livet til bergenserene?? 🌧️",
    "lightrain": "En liten dusj i skyene🌧️",
    "snow": "Vil du bli med og lage snømann? ☃️",
    "lightsnow": "Det snør, det snør, tiddelibom! 🌨️",
    "sleet": "Sludd. Flott, våte sokker igjen.🌨️",
    "rainshowers": "Regnbyger, naturens dusj 🌧️",
    "rainshowersandthunder": "Gratis lysshow med torden!⛈️",
    "lightrainshowers": "kanskje lurt med paraply 🌧️",
    "sleetshowers": "Litt sludd, bare nok til å minne oss på vinteren 🌨️",
    "heavyrain": "Paraply og stølver må vi ha idag 🌧️",
};

if (process.argv.length < 3) {
    console.log("Usage: app.mjs <place>");
    process.exit();
}
const args = process.argv.slice(2);

const fullArgumentIndex = args.indexOf("--full");
const hasFullArgument = fullArgumentIndex !== -1;
if (hasFullArgument) {
    args.splice(fullArgumentIndex, 1)
}


const place = args.join(" ");


let dato = new Date().getDate();
let month = new Date().getMonth();

async function fetchData(url) {
    const rawData = await fetch(url);
    return await rawData.json();
}


async function fetchLocationData(place) {
    const searchLocationUrl = `${BASE_URL}locations/Search?q=${place}&accuracy=1000&language=nn`;
    return fetchData(searchLocationUrl);
}

async function fetchForecastData(townID) {
    const foreCastUrl = `${BASE_URL}locations/${townID}/forecast`;
    return fetchData(foreCastUrl);
}

async function fetchCelstialData(townID) {
    const celestialUrl = `${BASE_URL}locations/${townID}/celestialevents`;
    return fetchData(celestialUrl);
}

function windDescription(wind) {
    const max = wind.max;

    if (max <= 0.2) {
        return "stille"
    } else if (max <= 1.5) {
        return "flau vind"
    } else if (max <= 3.3) {
        return "svak vind"
    } else if (max <= 5.4) {
        return "lett bris"
    } else if (max <= 7.9) {
        return "laber bris"
    } else if (max <= 10.7) {
        return "frisk bris";
    } else if (max <= 13.8) {
        return "liten kuling";
    } else if (max <= 17.1) {
        return "stiv kuling";
    } else if (max <= 20.7) {
        return "sterk kuling";
    } else if (max <= 24.4) {
        return "liten storm";
    } else if (max <= 28.4) {
        return "full storm";
    } else if (max <= 32.6) {
        return "sterk storm";
    } else {
        return "orkan";
    }
}

function formatOutput(dag, displayDate, sunRise, sunSet) {
    const dateOutput = `${DAGER[displayDate.getDay()]} ${displayDate.getDate()}.${MAANED_NAVN[month]}`;
    const weatherSymbol = dag.twentyFourHourSymbol.split("_")[0];
    const weatherOutput = weatherSymbol in WEATHER_CONDITIONS ? WEATHER_CONDITIONS[weatherSymbol] : "🌞";
    const temperatureOutput = dag.temperature ? `🌡️  ${dag.temperature.min}/${dag.temperature.max} C` : "";
    const windOutput = dag.wind ? `💨 ${windDescription(dag.wind)}` : "";
    const rainOutput = dag.precipitation ? `💧 ${dag.precipitation.value} mm` : "";
    const getSunriseTime = new Date(sunRise.time);
    const sunriseOutput = `☀️ ⬆️  ${getSunriseTime.getHours()}:${getSunriseTime.getMinutes()}`
    const getSunSetTime = new Date(sunSet.time);
    const sunSetOutput = `☀️ ⬇️   ${getSunSetTime.getHours()}:${getSunSetTime.getMinutes()}`

    console.log(`${dateOutput} ${weatherOutput} ${temperatureOutput} ${windOutput} ${rainOutput} ${sunriseOutput} ${sunSetOutput}`);
}

function processDay(index, vaerData, sunRiseData, sunSetData) {
    const dag = vaerData.dayIntervals[index];
    const today = new Date();
    const displayDate = new Date(today.setDate(today.getDate() + index));
    const sunRise = sunRiseData.slice(1)[index];
    const sunSet = sunSetData.slice(1)[index];
    formatOutput(dag, displayDate, sunRise, sunSet);
}

function displayOneLiner(twentyFourHourSymbol) {
    const oneLinerOutput = twentyFourHourSymbol in ONE_LINERS ? ONE_LINERS[twentyFourHourSymbol] : "";
    console.log(oneLinerOutput)
};

async function weatherApp() {

    const locationData = await fetchLocationData(place);

    if (locationData && locationData.totalResults > 0) {

        const location = locationData._embedded.location[0];
        const townID = location.id;
        const vaerData = await fetchForecastData(townID);
        const celestialData = await fetchCelstialData(townID);
        const sunRiseData = celestialData.events.filter((event) => event.body === "Sun" && event.type === "Rise");
        const sunSetData = celestialData.events.filter((event) => event.body === "Sun" && event.type === "Set");

        if (hasFullArgument) {
            for (let index = 0; index < vaerData.dayIntervals.length; index++) {
                processDay(index, vaerData, sunRiseData, sunSetData);
            }
        } else {
            const day = vaerData.dayIntervals[0];
            processDay(0, vaerData, sunRiseData, sunSetData);
            displayOneLiner(day.twentyFourHourSymbol.split("_")[0]);
        }

    }
}

weatherApp();

