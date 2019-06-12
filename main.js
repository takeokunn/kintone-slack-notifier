require('dotenv').config();

const SlackWebhook = require('slack-webhook');
const { Auth, Connection, Record, App } = require('@kintone/kintone-js-sdk');

const kintoneTemplate = `
# 本日の業務

*
*
*


# 明日の予定

*
*
*

# 一言
`;


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

const handleGenerateRecord = () => {
    const record = {
        "content": {
            "value": kintoneTemplate
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

const handleKintoneAddRecord = (success, failure) => {
    const domain = process.env.KINTONE_DOMAIN;
    const app_id = process.env.KINTONE_APP_ID;

    const auth = handleKintoneAuth();
    const conn = new Connection(domain, auth);
    const record = new Record(conn);
    const app = new App(conn);

    const my_record = handleGenerateRecord();
    fetchKintoneAddRecord(record, app_id, my_record, success, failure);
};

const main = () => {
    const success = (res) => {
        const app_id = process.env.KINTONE_APP_ID;
        const kintone_url = `日報: https://uuum.cybozu.com/k/${app_id}/show#record=${res.id}`;
        handleSlackPostMessage(kintone_url);
    };
    const failure = err => console.log(err);
    handleKintoneAddRecord(success, failure);
};
