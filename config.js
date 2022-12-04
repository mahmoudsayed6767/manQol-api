const config = {};
config.mongoUrl = 'mongodb+srv://manQol:manQol@cluster0.5cisa0b.mongodb.net/?retryWrites=true&w=majority'

config.jwtSecret = 'manQol';
config.jwt_secret_mail = 'manQol'
config.encryptSecret = "ZWGcON/5fIQb.U/2";
config.initVector = "mcgw2K5uCV5$%x&n"
config.twilio = {
  accountSid: '',
  authToken: ''
}
config.SENDGRID_API_KEY = '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'

config.confirmMessage = 'verify code: ';
config.cloudinary = {
  cloud_name: 'boody-car',
  api_key: '874358384852174',
  api_secret: 'Y4U-OtSiSwGW_IAuXW6WhNT-SNc'
};
config.LIMIT =  20 ;
config.PAGE = 1;
config.App={
  Name:'manQol'
}
config.baseUrl = 'https://manQol.herokuapp.com/api/v1/'
config.AppSid =""
config.SenderID = ""
// appUrl attr is set in the request
export default config;
