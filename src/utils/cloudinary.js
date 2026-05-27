import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

   cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadToCloudinary=async(localfilepath)=>{
        try {
            if(!localfilepath) return null;
            //upload file to cloudinary
            const response=await cloudinary.uploader.upload(localfilepath,{
                resource_type:"auto"
            })
            //file has been uploaded to cloudinary.
            console.log("file uploaded to cloudinary",response);
            return response;
        } catch (error) {
         console.log("Cloudinary Error:", error);
         fs.unlinkSync(localfilepath);
          return null;
}
    }
    export{uploadToCloudinary}