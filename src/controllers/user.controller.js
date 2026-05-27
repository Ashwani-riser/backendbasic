import{asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User }  from "../models/user.model.js";
import {uploadToCloudinary} from "../utils/cloudinary.js"
import{ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async (req, res) => {
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
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
}
    const avatar=await uploadToCloudinary(avatarLocalPath);
    const coverImage=await uploadToCloudinary(coverImageLocalPath);

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
export { registerUser };