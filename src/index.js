const dotenv = require("dotenv");
const connectDB = require("./db/index.js");
const app = require("./app");
dotenv.config({
	path: "./.env",
});

var admin = require("firebase-admin");

var serviceAccount = require("../gbt-mlm-firebase-adminsdk-6b5yu-99a08ce259.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


connectDB()
	.then(() => {
		app.listen(process.env.PORT || 8000, () => {
			console.log(`⚙️  Server is running at port : ${process.env.PORT}`);
		});
	})
	.catch((err) => {
		console.log("MONGO db connection failed !!! ", err);
	});

