import { isInArray } from "../../helpers/CheckMethods"
export async function transformUser(e,lang,myUser,userId) {
    let index = {
        firstname:e.firstname,
        lastname:e.lastname,
        email:e.email,
        phone:e.phone,
        id:e._id,
        type:e.type,
        img:e.img,
        rate:e.rate,
        online: e.online,
        block:e.block,
        active:e.active,
        verify:e.verify,
    }
    if(e.country){
        index.country = {
            name:lang=="ar"?e.country.name_ar:e.country.name_en,
            id:e.country._id
        }
    }
    return index;
}
export async function transformUserById(e,lang,myUser,userId) {
    let index = {
        firstname:e.firstname,
        lastname:e.lastname,
        email:e.email,
        phone:e.phone,
        id:e._id,
        type:e.type,
        img:e.img,
        rate:e.rate,
        online:e.online,
        block:e.block,
        active:e.active,
        verify:e.verify,
        carNumber:e.carNumber,
        carLicense:e.carLicense,
        driverLicense:e.driverLicense,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        
    }
    if(e.country){
        index.country = {
            name:lang=="ar"?e.country.name_ar:e.country.name_en,
            id:e.country._id
        }
    }
    if(e.city){
        index.city = {
            name:lang=="ar"?e.city.name_ar:e.city.name_en,
            id:e.city._id
        }
    }
    return index;
}
