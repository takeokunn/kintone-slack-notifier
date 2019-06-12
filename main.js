require('dotenv').config();

const SlackWebhook = require('slack-webhook');
const { Auth, Connection, Record, App } = require('@kintone/kintone-js-sdk');

const { getAccessToken, listEvents } = require('./calendar');

const kintoneTemplate = (today_events, tomorrow_events) => {
    return `
# 本日の業務

## 作業

*
*
*

## カレンダー

${today_events}

# 明日の予定

*
*
*

## カレンダー

${tomorrow_events}

# 一言
`;
};


const handleSlackPostMessage = (text) => {
    const url = process.env.SLACK_WEBHOOK_URL;
    const channel = process.env.SLACK_CHANNEL;
    const slack = new SlackWebhook(url);
    slack.send({
        text: text,
        username: 'take bot',
        icon_emoji: ':lisp_alien:'
    });
};

const handleGenerateRecord = text => {
    const record = {
        "content": {
            "value": text
        }
    };
    return record;
};

const fetchKintoneAddRecord = (record, app_id, my_record, success, failure) => {
    record.addRecord(app_id, my_record)
        .then(res => success(res))
        .catch((err) => failure(err));
};

const handleKintoneAuth = () => {
    const username = process.env.KINTONE_USERNAME;
    const password = process.env.KINTONE_PASSWORD;
    const auth = new Auth();
    auth.setPasswordAuth(username, password);
    return auth;
};

const handleKintoneAddRecord = (text, success, failure) => {
    const domain = process.env.KINTONE_DOMAIN;
    const app_id = process.env.KINTONE_APP_ID;

    const auth = handleKintoneAuth();
    const conn = new Connection(domain, auth);
    const record = new Record(conn);
    const app = new App(conn);

    const my_record = handleGenerateRecord(text);
    fetchKintoneAddRecord(record, app_id, my_record, success, failure);
};

const main = () => {
    const fetchEventSuccess = res => {
        const today = new Date();
        const today_events = res.data.items
              .filter(event => today.toDateString() === new Date(event.start.dateTime).toDateString())
              .reduce((accum, event) => `${accum}* ${event.summary} \n`, "");
        const tomorrow_events = res.data.items
              .filter(event => today.toDateString() === new Date(event.start.dateTime).toDateString())
              .reduce((accum, event) => `${accum}* ${event.summary} \n`, "");
        const text = kintoneTemplate(today_events, tomorrow_events);
        const success = res => {
            const app_id = process.env.KINTONE_APP_ID;
            const kintone_url = `日報: https://uuum.cybozu.com/k/${app_id}/show#record=${res.id}`;
            handleSlackPostMessage(kintone_url);
        };
        const failure = err => console.log(err);
        handleKintoneAddRecord(text, success, failure);
    };
    listEvents(fetchEventSuccess, err => console.log(err));
};

main();
