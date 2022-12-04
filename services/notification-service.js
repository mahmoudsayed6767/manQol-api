import { sendPushNotification } from './push-notification-service';

/**
 * @param {Object} notifi
 * @param {number} notifi.targetUser
 * @param {number} notifi.fromUser
 * @param {string} notifi.text
 * @param {number} notifi.subject
 * @param {string} notifi.subjectType
 * @param {string} title
 */
export async function sendNotifiAndPushNotifi(notifi, title = 'اشعار جديد') {
    try {
        sendPushNotification(notifi, title);
    }
    catch (err) {
        console.log('Notifi Err: ', err);
    }
}
