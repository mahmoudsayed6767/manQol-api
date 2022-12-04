
export async function transformOrder(e,lang,myUser,userId) {
    let index = {
        status:e.status,
        id:e._id,
        date:e.date,
        fromAddress:e.fromAddress,
        toAddress:e.toAddress,
        createdAt:e.createdAt
    }
    if(e.client){
        index.client = {
            firstname:e.client.firstname,
            lastname:e.client.lastname,
            img:e.client.img,
            type:e.client.type,
            id:e.client._id,
        }
    }
    if(e.driver){
        let driver={
            firstname:e.driver.firstname,
            lastname:e.driver.lastname,
            img:e.driver.img,
            type:e.driver.type,
            rate:e.driver.rate,
            id:e.driver._id,
        }
        index.driver = driver
    }
    
    return index
}
export async function transformOrderById(e,lang,myUser,userId) {
    let index = {
        status:e.status,
        id:e._id,
        date:e.date,
        fromAddress:e.fromAddress,
        toAddress:e.toAddress,
        shippingDateMillSec:e.shippingDateMillSec,
        deliveredDateMillSec:e.deliveredDateMillSec,
        video:e.video,
        images:e.images,
        createdAt:e.createdAt
    }
    let items = [];
    for (let val of e.items) {
        let item = {
            count:val.count,
        }
        if(val.item){
            item.item = {
                name:lang=="ar"?val.item.name_ar:val.item.name_en,
                id:val.item._id
            }
        }
        if(val.services){
            console.log(val.services)
            let services = [];
            for (let v of val.services) {
                services.push({
                    name:lang=="ar"?v.name_ar:v.name_en,
                    id:v._id
                })
            }
            item.services = services
        }
        items.push(item)
    }
    index.items = items
    if(e.city){
        index.city = {
            name:lang=="ar"?e.city.name_ar:e.city.name_en,
            id:e.city._id
        }
    }
    if(e.client){
        index.client = {
            firstname:e.client.firstname,
            lastname:e.client.lastname,
            img:e.client.img,
            type:e.client.type,
            id:e.client._id,
        }
    }
    if(e.driver){
        index.driver={
            firstname:e.driver.firstname,
            lastname:e.driver.lastname,
            img:e.driver.img,
            type:e.driver.type,
            rate:e.driver.rate,
            id:e.driver._id,
        }
    }
    
   return index
}
