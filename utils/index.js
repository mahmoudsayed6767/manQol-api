
import config from '../config';
import ApiError from '../helpers/ApiError';
import * as cloudinary from 'cloudinary';

export * from './token';

cloudinary.config(config.cloudinary);

// Convert Local Upload To Cloudinary Url  toImgUrl
export async function toImgUrl (multerObject) {
  try {
    let result = await cloudinary.v2.uploader.upload(multerObject.path);
    return result.secure_url;
    // multerObject.path = 'https'+'://'+'api.wisht7b.app'+'/'+multerObject.path;
    // console.log("path:  "+multerObject.path);
    // return multerObject.path;

  }
  catch (err) {
    console.log('Cloudinary Error: ', err);
    throw new ApiError(500, 'Failed To Upload An Image due to network issue! Retry again...');
  }
}


// Convert Local Upload To Full Url  toImgUrlCloudinary
export async function toImgUrlCloudinary(multerObject) {

  return `${config.appUrl}/${multerObject.destination}/${multerObject.filename}`;

}

export function parseStringToArrayOfObjectsMw(fieldName, inWhich = 'body') {
  return (req, res, next) => {
      try {
          if (req[inWhich][fieldName]) {
            let arrOfObjectsAsString = req[inWhich][fieldName];
            console.log('the object',typeof arrOfObjectsAsString);
            let handledStringForParsing = arrOfObjectsAsString.replace(/([a-zA-Z0-9]+?):/g, '"$1":').replace(/'/g, '"');
            console.log('the object',handledStringForParsing);
            console.log('the object 333',JSON.parse(handledStringForParsing));
              req[inWhich][fieldName] = JSON.parse(handledStringForParsing);
          }
          next();
      } catch (err) {
          console.log(err);
          next(new ApiError(400, { message: `Failed To Parse "${fieldName}"` }));
      }
  }
}
export function parseStringToArrayOfObjectsMwv2(fieldName, inWhich = 'body') {
  return (req, res, next) => {
      try {
          if (req[inWhich][fieldName]) {
            let arrOfObjectsAsString = req[inWhich][fieldName];
            console.log('the object',typeof arrOfObjectsAsString);
            let handledStringForParsing = arrOfObjectsAsString.replace(/([a-zA-Z0-9]+?):/g, '$1:').replace(/'/g, '"');
            console.log('the object',handledStringForParsing);
            console.log('the object 333',JSON.parse(handledStringForParsing));
              req[inWhich][fieldName] = JSON.parse(handledStringForParsing);
          }
          next();
      } catch (err) {
          console.log(err);
          next(new ApiError(400, { message: `Failed To Parse "${fieldName}"` }));
      }
  }
}
