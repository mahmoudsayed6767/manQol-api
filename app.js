import createError  from 'http-errors';
import cookieParser from 'cookie-parser';
import morganLogger from'morgan';
import express from 'express';
import path from 'path';
import bodyparser from 'body-parser';
import expressValidator from 'express-validator';
import mongoose from 'mongoose';
import url from 'url';
import cors from 'cors';
import helmet from 'helmet';
import mongoose_delete from 'mongoose-delete';
import i18n from 'i18n';
import autoIncrement from 'mongoose-auto-increment';
import config from './config';
import router from './routes'; 
import ApiError from './helpers/ApiError';
import compression from 'compression'
import {cronJop} from './services/cronJop'
import fs from 'fs'
//require('dotenv').config()
import Logger from "./services/logger";
const logger = new Logger('log '+ new Date(Date.now()).toDateString())
const errorsLog = new Logger('errorsLog '+ new Date(Date.now()).toDateString())


var app = express();


mongoose.Promise = global.Promise;

autoIncrement.initialize(mongoose.connection);
//connect to mongodb
mongoose.connect(config.mongoUrl, { 
  useNewUrlParser: true , 
  useUnifiedTopology: true,
  useCreateIndex:true,
  useFindAndModify:false
});
mongoose.connection.on('connected', () => {
  //cronJop();
  console.log('\x1b[32m%s\x1b[0m', '[DB] Connected...');
 
});
mongoose.connection.on('error', err => console.log('\x1b[31m%s\x1b[0m', '[DB] Error : ' + err));
mongoose.connection.on('disconnected', () => console.log('\x1b[31m%s\x1b[0m', '[DB] Disconnected...'));


mongoose.plugin(mongoose_delete, { overrideMethods: true });
app.use(cors());
app.use(helmet());

app.use(compression())


i18n.configure({
    locales: ['en', 'ar'],
    defaultLocale: 'en',
    header: 'accept-language',
    directory:path.join(__dirname, 'locales'),
});

app.use(i18n.init);
app.use(morganLogger('dev'));
// app.use(morganLogger('short', {
//   stream: fs.createWriteStream(path.join(__dirname, `./log/api ${new Date(Date.now()).toDateString()}.log`), { flags: 'a' })
// }))
app.use((req, res, next) => {
  logger.info(`${req.originalUrl} - ${req.method} - ${req.ip} || `);
  next();
});
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true, parameterLimit: 50000 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'docs')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(expressValidator());

// make the file publically accessable 
app.use('/uploads',express.static('uploads'));

//Routes
app.use('/api/v1', router);

// Ensure Content Type
app.use('/', (req, res, next) => {
    // check content type
    let contype = req.headers['content-type'];
    if (contype && !((contype.includes('application/json') || contype.includes('multipart/form-data'))))
        return res.status(415).send({ error: 'Unsupported Media Type (' + contype + ')' });


    // set current host url
    config.appUrl = url.format({
        protocol: req.protocol,
        host: req.get('host')
    });

    next();
});

app.use((req, res, next) => {
  next(new ApiError(404, req.__('notFound')));
});


//ERROR Handler
app.use((err, req, res, next) => {
  errorsLog.error(`${err.status} || ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} || `,err.message);
  if (err instanceof mongoose.CastError)
      err = new ApiError.NotFound(err);

  res.status(err.status || 500).json({
    errors: {
        success:false,
        msg:Array.isArray(err.message)?err.message:[{msg:err.message}]
    }
  });

  // console.log(err);
  // console.log(JSON.stringify(err));
});


module.exports = app;
