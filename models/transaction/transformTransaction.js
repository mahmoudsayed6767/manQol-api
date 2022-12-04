
export async function transformTransaction(e,lang) {
    let index = {
        transactionId:e.transactionId,
        type:e.type,
        status:e.status,
        dateMillSec:e.dateMillSec,
        cost:e.cost,
        tax:e.tax,
        totalCost:e.totalCost,
        billUrl:e.billUrl,
        id: e._id,
    }
    if(e.user){
        let user = {
            fullname:e.user.fullname,
            img:e.user.img?e.user.img:"",
            type:e.user.type,
            id:e.user._id, 
        }
        index.user = user
    }
    if(e.booking){
        index.booking = {
            status: e.booking.status,
            createdAt:e.booking.createdAt,
            id: e.booking._id,
        }
        
    }
    return index
}