require('dotenv').config();

const SlackWebhook = require('slack-webhook');
const { Auth, Connection, Record, App } = require('@kintone/kintone-js-sdk');

const handleSlackPostMessage = (text) => {
    const url = process.env.SLACK_WEBHOOK_URL;
    const channel = process.env.SLACK_CHANNEL;
    const slack = new SlackWebhook(url);
    slack.send({
        text: 'some text',
        username: 'new username',
        icon_emoji: ':scream_cat:',
        channel: '#another-channel'
    });
};

const handleGenerateRecord = () => {
    const record = {
        "content": {
            "value": "おれのかんぺきなにっぽう:stub_parrot:"
        }
    };
    return record;
};

const fetchKintoneAddRecord = (app_id, record, success, failure) => {
    record.addRecord(app_id, record)
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

const handleKintoneAddRecord = (success, failure) => {
    const domain = process.env.KINTONE_DOMAIN;
    const app_id = process.env.KINTONE_APP_ID;

    const auth = handleKintoneAuth();
    const conn = new Connection(domain, auth);
    const record = new Record(conn);
    const app = new App(conn);

    const my_record = handleGenerateRecord();
    fetchKintoneAddRecord(app_id, my_record, success, failure);
};


const main = () => {
    const success = (res) => {
        console.log(res);
    };
    const failure = (err) => {
        console.log(err);
    };
    handleKintoneAddRecord(success, failure);
};
