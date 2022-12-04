
import multer from 'multer';
import path from 'path';
import mkdirp from 'mkdirp';
import ApiError from '../helpers/ApiError';
import mime from 'mime';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs'

const fileFilter = (req, file, cb) => {
    console.log("file : "+ file)
    console.log("file type: "+path.extname(file.originalname).toLowerCase())
    console.log("file mimetype: "+file.mimetype)
    if(file.mimetype === "application/octet-stream" ){
        return cb(new ApiError(500, 'Can not upload this file'));
    }
    const filetypes = ['.m4a','.docx','.jpeg','.jpg','.png','.gif','.mp4','.bmp','.mov','.avi','.mp3','.woff','.woff2','.jfif','.pdf','.txt','csv','.html','.3gp','.webm','.flv','.zip'];
    console.log("exe",filetypes.includes(path.extname(file.originalname).toLowerCase()))

    if (filetypes.includes(path.extname(file.originalname).toLowerCase())) {
        return cb(null, true);
    }
    cb(new ApiError.UnprocessableEntity('File upload only supports types'));
    return cb(null, true);
};

export function multerSaveTo(folderName) {
    let storage = multer.diskStorage({
        
        destination: function (req, file, cb) {
            console.log('file',file)
            console.log('In Body: ', req.body);

            let dest = 'uploads';
            // create destination if don't exist
            mkdirp(dest, function (err) {
                if (err)
                    return cb(new ApiError(500, 'Couldn\'t create dest'));

                cb(null, dest);
            });
        },
        
        filename: function (req, file, cb) {
            let extension = file.mimetype.split('/')[1]
            if(!file.originalname.includes('.')){
                console.log("extension",extension)
                file.originalname = file.originalname +'.'+extension;
                console.log("new file name ===> " +file.originalname);
            
                
            }
            // generate a unique random name with file extension
            cb(null, uuidv4() + path.extname(file.originalname));
            
        }
    });

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: 1024 * 1024 * 10 // limit 10mb
        }
    });
}

