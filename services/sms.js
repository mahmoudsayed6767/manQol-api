const axios = require('axios')
import config from '../config';

export function sendSms(phone,msg) {
  axios.post('https://smsmisr.com/api/v2/?', {
      Username : '',
      password: '',
      language : '2',
      sender: '',
      Mobile :phone,
      message :msg
    })
    .then(res => {
      console.log("done")
    })
    .catch(error => {
      console.error(error)
    })
}