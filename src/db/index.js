const mongoose = require("mongoose");

const connectDb = async () => {
	try {
		const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/gbt`);
		console.log(`MongoDb connection: || DB HOST:  ${connectionInstance.connection.host}`);
	} catch (error) {
		console.error("Error...." + error);
		// throw error;
		process.exit(1);
	}
};

module.exports = connectDb;
