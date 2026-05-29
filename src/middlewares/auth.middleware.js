import { ApiError } from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asynchandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT=asyncHandler(async(req,res,next) => {
    //get token from cookie
   try {
     const token=
     req.cookies?.accessToken || 
     req.header("Authorization")?.replace("Bearer ", "")
      
 
     if(!token){
         throw new ApiError(401,"Unauthorized")
     }
      //if token is present then verify it
      const decodedToken=jwt.verify(token, process.env.JWT_SECRET_KEY)
      
      const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
      if(!user){
         //TODO:discuss about frontend
         throw new ApiError(401,"Unauthorized")
      }

      req.user=user;
      next()


   } catch (error) {
        throw new ApiError(401,error ?.message || "invalid accessToken")
   }

})