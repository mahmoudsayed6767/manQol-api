import nodemailer from 'nodemailer';
import config  from '../config';

let transporter = nodemailer.createTransport({
    secure: true, 
    service:'gmail',
    ignoreTLS: true,
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'washto7b@gmail.com',
        pass: '123456@algo',
    },
    /*tls:{
        rejectUnauthorized:false
      }
*/
});

export function sendEmail(targetMail, text ,description) {

    let mailOptions = {
        from: `${config.App.Name}`,
        to: targetMail,
        subject: `${config.App.Name} ${description}`,
        text: text,
        html:'<div style="background:`#eceff1`;width:`90%`;height:`600px`;margin:`auto`"><div  style="background:`#50a289`;width:`100%`;height:`90px`"><img src="https://res.cloudinary.com/ishabrawy/image/upload/v1569841454/thjzb95kybkej3lvwnhi.png" style="width:`39px`;margin-left:`41%`;margin-top:`2.7%`"><h1 style="text-align:`center`;display:`inline-block`;color:`#fff`;position:`absolute`;margin-top:`25px`">وش تحب</h1></div><div style="background:`#fff`;width:`50%`;height:`300px`;margin-top:`5%`;margin-left:`22%`;padding:`4%`"><h4>'+ description +' : </h4><p>'+ text +'</p><div></div>'
       

    };

    console.log('targetMail', targetMail, 'options', mailOptions);

   
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
             console.log(error);
        }
        //console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });


    return true;
}