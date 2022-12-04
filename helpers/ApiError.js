
import i18n from 'i18n';

class ApiError extends Error{
    constructor(status,message){
        super();
        if(ApiError.instance == null){
            console.log('\x1b[31m',"singleton first instance");
            this.status = status ;
            this.message = message ;
            ApiError.instance = this

        }else{
            console.log('\x1b[32m%s\x1b[0m', 'singleton fire successfully !');
            ApiError.instance.status = status ;
            ApiError.instance.message = message ;
            return ApiError.instance
        }
        
    }
    
    static NotFound(name) {
        this.status = 404;
        this.message = `${name} `+i18n.__('notFound')
    }

    static BadRequest(message = 'Bad Request, Check your inputs') {
        this.status = 400;
        this.message = message;
    }

    static UnprocessableEntity(message) {
        this.status = 422;
        this.message = message;
    }

    static Forbidden(message) {
        this.status = 403;
        this.message = message;
    }
}



export default ApiError;