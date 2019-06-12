require('dotenv').config();

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';

const createOAuth2Client = () => {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    const redirect_uri = "urn:ietf:wg:oauth:2.0:oob";
    return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
};

const fetchAccessToken = (client, code, success, failure) => {
    client.getToken(code, (err, token) => {
        if (err) return failure(err);
        return success(token);
    });
};

const fetchCalendarEvent = (calendar, option, success, failure) => {
    calendar.events.list(option, (err, res) => {
        if (err) return failure(err);
        return success(res);
    });
};

const writeTokenFile = token => {
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        return console.log('Token stored to', TOKEN_PATH);
    });
};

const getAccessToken = () => {
    const client = createOAuth2Client();
    const authUrl = client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const cb = code => {
        rl.close();
        const success = token => {
            client.setCredentials(token);
            writeTokenFile(token);
        };
        const failure = err => console.error('Error retrieving access token', err);
        fetchAccessToken(client, code, success, failure);
    };
    rl.question('Enter the code from that page here: ', cb);
};

const listEvents = (success, failure) => {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const client = createOAuth2Client();
    client.setCredentials(token);

    const today = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() + 2);

    const calendar = google.calendar({ version: 'v3', auth: client });
    const option = {
        calendarId: 'primary',
        timeMin: today,
        timeMax: twoDaysAgo,
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    };
    fetchCalendarEvent(calendar, option, success, failure);
};

module.exports = { getAccessToken, listEvents };
