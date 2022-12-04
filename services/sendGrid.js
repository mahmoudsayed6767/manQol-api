const axios = require('axios')
import config from '../config';
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.SENDGRID_API_KEY);

//ES6
export function sendEmail(targetMail, text ,description){
  const msg = {
    to: targetMail,
    from: 'mahmoudsayed1006@gmail.com', // Use the email address or domain you verified above
    subject: `${config.App.Name} ${description}`,
    text: text,
    html:'<div style="background:`#eceff1`;width:`90%`;height:`600px`;margin:`auto`"><div  style="background:`#117183`;width:`100%`;height:`90px`"><img src="" style="width:`39px`;margin-left:`41%`;margin-top:`2.7%`"><h1 style="text-align:`center`;display:`inline-block`;color:`#fff`;position:`absolute`;margin-top:`25px`">'+config.App.Name+'</h1></div><div style="background:`#fff`;width:`50%`;height:`300px`;margin-top:`5%`;margin-left:`22%`;padding:`4%`"><h4>'+ description +' : </h4><p>'+ text +'</p><div></div>'
       
  };
  sgMail
  .send(msg)
  .then((response) => {
    console.log('email sent',response);
  }, error => {
    console.error(error);
    if (error.response) {
      console.error(error.response.body)
    }
  });
  return true;
}


