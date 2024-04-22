const mongoose = require("mongoose");

const { Schema } = mongoose;

// car Schema
const bankSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "user", // This should match the model name of your owner schema
		},
		accountNumber: {
			type: String,
			required: [true, "Account Number is required"],
			unique: true,
		},
		accountHolderName: {
			type: String,
			required: [true, "Account Holder Name is required"],
		},
		ifscCode: {
			type: String,
			required: [true, "IFSC Code is required"],
		},
		accountType: {
			type: String,
			enum: ["saving", "current"],
			required: [true, "Account Type is required"],
		},
		bankName: {
			type: String,
		},
	},
	{ timestamps: true }
);

const Bank = mongoose.model("bank", bankSchema);
module.exports = Bank;
