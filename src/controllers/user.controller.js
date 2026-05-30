import{asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User }  from "../models/user.model.js";
import {uploadToCloudinary} from "../utils/cloudinary.js"
import{ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken=async(userID) => 
{
    try{
        const user=await User.findById(userID)
        const accessToken=await user.generateAccessToken()
        const refreshToken=await user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}
    }catch(error){
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
      }
}


const registerUser = asyncHandler(async (req, res) => {
     console.log("REGISTER USER HIT");
    //get user detail from frontrend
    //validation-not empty
    //check if user already exist:username,email
    //check for image ,check for avatar
    //upload them to cloudinary,avatar
    //crate user object-create entry in database
    //remove password and refresh token field from response
    //check for user creation
    //return response to frontend
     const{fullname,email,username,password}=req.body
     console.log("email: ",email);

    
    if (
    [fullname, email, username, password].some(
        (field) => field?.trim() === ""
    )
) {
    throw new ApiError(400, "All fields are required");
}
  //check if user already exist:username,email
    const existedUser = await User.findOne({ 
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409, "User with this username or email already exists");
    } 
  //check gor image ,check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath ;
    if(req.files && Array.isArray(req.files.
        coverImage)  && req.files.coverImage.length > 0){
            coverImageLocalPath = req.files.coverImage[0].path;
        }


// console.log("FILES =>", req.files);
// console.log("AVATAR PATH =>", avatarLocalPath);
// console.log("COVER IMAGE PATH =>", coverImageLocalPath);


    if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
}

const avatar = await uploadToCloudinary(avatarLocalPath);
//console.log("AVATAR RESPONSE =>", avatar);

const coverImage = await uploadToCloudinary(coverImageLocalPath);
//console.log("COVER IMAGE RESPONSE =>", coverImage);

    if(!avatar){
        throw new ApiError(500, "Failed to upload avatar");
    }

    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })
    
    const createdUser = await User.findById(user._id)
    .select("-password -refreshToken");
    

    if(!createdUser){
        throw new ApiError(500, "Failed to create user");
    }
    
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully") 
    )
    

})

const loginUser=asyncHandler(async(req,res) => {
    //req body->data
    //username or email
    //find user
    //password check
    //access and refresh token
    //send cooke
    const{username,email,password}=req.body
    if(!username && !email){
        throw new ApiError(400,"Username or email is required")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User does not exist")
    }
     
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }
    
    const {accessToken, refreshToken}=await
    generateAccessAndRefreshToken(user._id)
     
    const loggedInUser=await User.findById(user._id).
    select("-password -refreshToken")
     
   //send cookies

   const options={
    httpOnly:true,
    secure:true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken",refreshToken, options)
   .json(
        new ApiResponse(
           200,
           {
            user:loggedInUser,accessToken, refreshToken
           },
              "User logged in successfully"
        
       )
    )
})


//create own middleware for logout user
const logoutUser=asyncHandler(async(req,res) => {
      await User.findByIdAndUpdate(
           req.user._id,
           {
             $set:{
                refreshToken:undefined
             }
           },
           {
            new:true
           }
      )
      const options={
         httpOnly:true,
         secure:true
      }
         return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken=asyncHandler(async(req,res) => {
    //get refresh token from cookie
    const incomingRefreshToken=req.cookies.
    refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }
     
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
        
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const option ={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken, refreshToken:newRefreshToken} = await 
        generateAccessAndRefreshToken(user._id)
        
        return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken",newRefreshToken, option)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken:newRefreshToken}
                ,"Access token refreshed successfully"
    
            )
        )
    } catch (error) {
        throw new ApiError(401,error ?.message || "Invalid refresh token")
    }
})


const changeCurrentPassword=asyncHandler(async(req,res) => {
    const{oldPassword, newPassword}=req.body

    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"))
})

const getCurrentUser=asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res) => {

      const{fullname, username, email}=req.body

      if(!fullname && !email){
        throw new ApiError(400,"At least one field is required to update")
      }

        const user =User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    fullname,
                    email :email
                }
            },
            {
                new:true
            }
        ).select("-password ")
        
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res) => {
      const avatarLocalPath = req.file?.path
        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar file is required")
        }

        const avatar=await uploadToCloudinary(avatarLocalPath)
        if(!avatar){
            throw new ApiError(400,"Error while uploading avatar")
        }
        
        const user=await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar:avatar.url
                }
            },
            {
                new:true
            }
        ).select("-password ")


         return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated successfully"))
})



const updateUserCoverImage=asyncHandler(async(req,res) => {
      const coverImageLocalPath = req.file?.path
        if(!coverImageLocalPath){
            throw new ApiError(400,"Cover image file is required")
        }

        const coverImage=await uploadToCloudinary(coverImageLocalPath)
        if(!coverImage.url){
            throw new ApiError(400,"Error while uploading cover image")
        }
        
        const user=await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage:coverImage.url
                }
            },
            {
                new:true
            }
        ).select("-password ")

        return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"))

})






export { registerUser ,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage


};