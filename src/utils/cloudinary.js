import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log("CLOUD NAME =", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API KEY =", process.env.CLOUDINARY_API_KEY);

const uploadToCloudinary = async (localfilepath) => {
    try {
        

        if (!localfilepath) return null;
        console.log("Uploading file:", localfilepath);

        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto"
        });

        console.log("SUCCESS:", response.secure_url);
          fs.unlink(localfilepath) 
        return response;
    } catch (error) {
        console.log("CLOUDINARY ERROR =>", error);
        console.log("FILE PATH =>", localfilepath);
        return null;
    }
};

export { uploadToCloudinary };