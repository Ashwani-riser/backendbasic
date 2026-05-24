class ApiError extends Error {
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        statck=""

    ){ //overwrite the default constructor of error class
        super(message) //call the parent constructor of error class
        this.data=null
        this.message=message
        this.success=false;
        this.errors=errors

        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
        
}
export {ApiError} 