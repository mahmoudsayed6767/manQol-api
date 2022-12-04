import twilio from 'twilio';
import config from '../config';

export function sendConfirmCode(phone,verifyCode) {
    let client = new twilio(config.twilio.accountSid, config.twilio.authToken);

    client.messages.create({
        body: config.confirmMessage + verifyCode,
        to: phone,
        from: '+17207073481'
    }).then((message) => {
        console.log(message);
    }).catch(err => console.log('Twilio Error: ', err))
} 
export function sendSms(phone,message) {
    let client = new twilio(config.twilio.accountSid, config.twilio.authToken);

    client.messages.create({
        body: message,
        to: phone,
        from: '+17207073481'
    }).then((message) => {
        console.log(message);
    }).catch(err => console.log('Twilio Error: ', err))
} 

export function sendForgetPassword(password, phone) {
    let client = new twilio(config.twilio.accountSid, config.twilio.authToken);
    client.messages.create({
        body: ' verify Code :'+ password,
        to: phone /*phone*/,
        from: '+17207073481'
    }).then((message) => {
        console.log(message);
    }).catch(err => console.log('Twilio Error: ', err))
}