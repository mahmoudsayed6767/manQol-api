import Schedule from 'node-schedule';
import moment from 'moment';
import Logger from "../services/logger";
const logger = new Logger('cronJop '+ new Date(Date.now()).toDateString())
export function cronJop() {
    try { //    */2 * * * *
        //sec min hour day month year
        Schedule.scheduleJob('*/10 * * * * *', async function(){
            console.log("cron")

        });
    } catch (error) {
        throw error;
    }

}