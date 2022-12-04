import fs from 'fs';
import ApiError from '../../helpers/ApiError';
import { validationResult } from 'express-validator/check';
import { matchedData } from 'express-validator/filter';
import { toImgUrl } from '../../utils';
import i18n from 'i18n';
import crypto from 'crypto';
import config from '../../config'
function deleteTempImages(req) {
  if (req.file || req.files) {
    let files = req.file ? Array.from(req.file) : req.files;
    for (let file of files) {
      fs.unlink(file.path, function (err) {
        if (err) return console.log(err);
        // Under Experimental 
        console.log(file.filename + ' deleted successfully');
      });
    }
  }
}

export const localeFn = (localeName) => (value, { req }) => req.__(localeName);

export function checkValidations(req) {
  console.log("h")
  const validationErrors = validationResult(req).array({ onlyFirstError: true });
  if (validationErrors.length > 0) {
    //deleteTempImages(req);
    console.log(validationErrors)
    let msg= []
    for (let i = 0; i < validationErrors.length; i++) {
      let value = {
        "msg":validationErrors[i].msg
      }
      msg.push(value);
    }
    throw new ApiError(422, msg);
  }

  return matchedData(req);
}


export async function handleImgs(req, { attributeName = 'images', isUpdate = false } = {}) {
  if (req.files && req.files.length > 0 || (isUpdate && req.body[attributeName])) { // .files contain an array of 'images'  
    let images = [];
    if (isUpdate && req.body[attributeName]) {
      if (Array.isArray(req.body[attributeName]))
        images = req.body[attributeName];
      else
        images.push(req.body[attributeName]);
    }

    for (const img of req.files) {
      images.push(await toImgUrl(img));
    }
    return images;
  }
  throw new ApiError.UnprocessableEntity(`${attributeName} `+i18n.__('areRequired'));
}

export async function handleImg(req, { attributeName = 'img', isUpdate = false } = {}) {
  if (req.file || (isUpdate && req.body[attributeName])) {
    return req.body[attributeName] || await toImgUrl(req.file);

  }
  throw new ApiError.UnprocessableEntity(`${attributeName} `+ i18n.__('areRequired'));
}
export function distance(lat1, lon1, lat2, lon2, unit) {
  if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
  }
  else {
      var radlat1 = Math.PI * lat1/180;
      var radlat2 = Math.PI * lat2/180;
      var theta = lon1-lon2;
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
          dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit=="K") { dist = dist * 1.609344 }
      if (unit=="N") { dist = dist * 0.8684 }
      return dist;
  }
}
export async function encryptedData(content,securitykey) {
  const algorithm = "aes-256-cbc"; 
  const initVector = config.initVector//crypto.randomBytes(16);
  // the cipher function
  const cipher = crypto.createCipheriv(algorithm, securitykey, initVector);
  let dataAfterEncrypted = cipher.update(content, "utf-8", "hex");
  dataAfterEncrypted += cipher.final("hex");
  return dataAfterEncrypted
}
export async function decryptedData(encryptedData,securitykey) {
  const algorithm = "aes-256-cbc"; 
  const initVector = config.initVector//crypto.randomBytes(16);
  // the cipher function
  const decipher = crypto.createDecipheriv(algorithm, securitykey, initVector);
  let dataAfterDecrypted = decipher.update(encryptedData, "hex", "utf-8");
  dataAfterDecrypted += decipher.final("utf8");
  return dataAfterDecrypted
}
export async function convertLang(req) {
  i18n.setLocale(req.headers['accept-language']?req.headers['accept-language']:'en' )
}
export async function convertLangSocket(lang) {
  i18n.setLocale(lang?lang:'en')
}


