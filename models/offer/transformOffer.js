import { isInArray } from "../../helpers/CheckMethods";
export async function transformOffer(e,lang,myUser,userId) {
    let index = {
        status:e.status,
        id:e._id,
        price:e.price,
        location:e.location,
        createdAt:e.createdAt
    }
    if(e.driver){
        index.driver = {
            firstname:e.driver.firstname,
            lastname:e.driver.lastname,
            img:e.driver.img,
            type:e.driver.type,
            online:e.driver.online,
            lastSeen:e.driver.lastSeen,
            id:e.driver._id,
        }
    }
    
    return index
}
export async function transformOfferById(e,myUser,userId) {
    let index = {
        status:e.status,
        id:e._id,
        price:e.price,
        location:e.location,
        createdAt:e.createdAt
    }
    if(e.driver){
        index.driver = {
            firstname:e.driver.firstname,
            lastname:e.driver.lastname,
            img:e.driver.img,
            type:e.driver.type,
            online:e.driver.online,
            lastSeen:e.driver.lastSeen,
            id:e.driver._id,
        }
    }
    if(e.client){
        index.client = {
            firstname:e.client.firstname,
            lastname:e.client.lastname,
            img:e.client.img,
            type:e.client.type,
            online:e.client.online,
            lastSeen:e.client.lastSeen,
            id:e.client._id,
        }
    }
   return index
}
