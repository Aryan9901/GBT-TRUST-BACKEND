const cloud = require("cloudinary");
const fs = require("fs");

const cloudinary = cloud.v2;

cloudinary.config({
	cloud_name: "dqmf9ciah",
	api_key: "174674496974711",
	api_secret: "OIbN_uKEnQRxr15K7X-S3SaDpzk",
});

const uploadOnCloudinary = async (localFilePath) => {
	try {
		if (!localFilePath) return null;
		//upload the file on cloudinary
		const response = await cloudinary.uploader.upload(localFilePath, {
			resource_type: "auto",
		});
		// file has been uploaded successfull
		console.log("file is uploaded on cloudinary ", response.url);
		fs.unlinkSync(localFilePath);
		return response;
	} catch (error) {
		console.log(error);
		fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
		return null;
	}
};

module.exports = { uploadOnCloudinary };
