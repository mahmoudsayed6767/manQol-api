import * as admin from 'firebase-admin';
import User from '../models/user/user.model';
const serviceAccount = require('../service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

 
export async function sendPushNotification(notifi, title) { 

    let user = await User.findById(notifi.targetUser);
    let tokens = user.tokens;
    console.log(tokens);
    const payloadIos = {
        notification: {
            title: notifi.text,
            sound: 'default',
            itemID: notifi.subject.toString(),
            body: notifi.subjectType,
            info:notifi.info?notifi.info:"",
            priority:'high',
        },
        
    }
    const payloadAndroid = {
        data: {
            title: notifi.text,
            sound: 'default',
            itemID: notifi.subject.toString(),
            body: notifi.subjectType,
            info:notifi.info?notifi.info:"",
            priority:'high',
        },
    }
    let iosTokens = [];
    let androidTokens = [];
    for (const token of tokens) {
        if(token.osType =="IOS"){
            iosTokens.push(token.token)
        }else{
            androidTokens.push(token.token)
        }
    }

    if (androidTokens && androidTokens.length >= 1) {
        console.log('ANDROIS TOKENS : ', androidTokens);
        admin.messaging().sendToDevice(androidTokens, payloadAndroid)
            .then(response => {
                console.log('Successfully sent a message')//, response);
            })
            .catch(error => {
                console.log('Error sending a message:', error);
            });
    }
    if (iosTokens && iosTokens.length >= 1) {
        console.log('IOS TOKENS : ', iosTokens);
        admin.messaging().sendToDevice(iosTokens, payloadIos)
            .then(response => {
                console.log('Successfully sent a message')//, response);
            })
            .catch(error => {
                console.log('Error sending a message:', error);
            });
    }

}