 import mongoose ,{ Schema } from "mongoose";
 import jwt from "jsonwebtoken";
 import bcrypt from "bcryptjs";
 const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
         email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
         fullname:{
            type:String,
            required:true,
            trim:true,
            index=true
        },
        avatar:{
            type:String,  //cloudinary url
            required:true,
        },
        coverImage:{
            type:String,  //cloudinary url
        },
        watchHistory:[{
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
        ],
        password:{
            type:String,
            required:[true,'password is required']

        },
        refreshToken:{
            type:String,

        }

    },{timestamps:true}
)

 userSchema.pre("save", async function(next){
    // agar password modify nahi hua hai to next() call karo
    if(!this.isModified("password")) return next();
    // agar password modify hua hai to usko hash karo
     this.password=await bcrypt.hash(this.password,10)
     next()   
 })

 userSchema.methods.isPasswordCorrect=async function
 (password){
    return await bcrypt.compare(password,this.password)  //password jo user na dala hai aur this.password jo database me hai usko compare karo
 }

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fillname:this.fullname,

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRES
        }
    )
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id,
        
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRES
        }
    )
}

 export const User=mongoose.model("User", userSchema)