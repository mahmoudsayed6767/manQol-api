

export async function transformAddress(e,lang) {
    let index = {
        status:e.status,
        id:e._id,
        address:e.address,
        location:e.location,
        floor:e.floor,
        elevator: e.elevator,
        createdAt:e.createdAt
    }
    if(e.city){
        index.city = {
            name:lang=="ar"?e.city.name_ar:e.city.name_en,
            id:e.city._id
        }
    }
    
   return index
}
