const CLIENT_ID = "815972521774-m3jqqvj7kap5i2m3vtmhaqgc4h5kpehh.apps.googleusercontent.com";
const API_KEY = "AIzaSyAHlH7ZjFxCc6RDGfsl2wjaQFuIhXvzvQ8";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/calendar";
const CALENDAR_ID = "c_c81885e2c4242a209f68e2476c34660c4061e0a8731930c7e5873f23fcfa3001@group.calendar.google.com";

let tokenClient;
let gapiInited = false;
let gisInited = false;
function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
}
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "", // defined later
  });
  gisInited = true;
}
function createGoogleEvent(eventDetails, COLABORADORES) {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }
    await scheduleEvent(eventDetails, COLABORADORES);
  };
  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    tokenClient.requestAccessToken({ prompt: "" });
  }
}
function scheduleEvent(eventDetails, COLABORADORES) {
  let attendees = []
  let recurrenceRules = []
  for (let i = 0; i < COLABORADORES.length; i++) {
    const element = COLABORADORES[i];
    for (let i = 0; i < eventDetails.COLABORADORES.length; i++) {
      const colaborador = eventDetails.COLABORADORES[i];
      if (colaborador === element.USUARIO) {
        if (element.EMAIL !== undefined && element.EMAIL !== null) {
          attendees.push({ email: element.EMAIL })
        }
      }
    }
  }
if (eventDetails.recurrenceRule !== undefined && eventDetails.recurrenceRule !== null) {
  recurrenceRules = [
    {
      'rrule': {
        'freq': eventDetails.recurrenceRule.FRECUENCIA,
        'interval': eventDetails.recurrenceRule.INTERVALO_FRECUENCIA,
        'byDay': eventDetails.recurrenceRule.PERIODO_FRECUENCIA_DIA,     // El primer lunes del mes
        'bySetPos': 1,     // El primer lunes
        'until': eventDetails.recurrenceRule.FIN_FRECUENCIA // Hasta fin de año
      }
    }
  ]
}
  const event = {
    summary: eventDetails.nameEvent,
    location: "800 Howard St., San Francisco, CA 94103",
    description: eventDetails.descripcion,
    start: {
      dateTime: eventDetails.startDate,
      timeZone: "America/Bogota",
    },
    end: {
      dateTime: eventDetails.startDate,
      timeZone: "America/Bogota",
    },
    recurrence: recurrenceRules,
    attendees: attendees,
    visibility: 'default',
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };
  const request = gapi.client.calendar.events.insert({
    calendarId: CALENDAR_ID,
    resource: event,
  });
  request.execute(function (event) {
    console.info("Event created: " + event.htmlLink);
  });
}