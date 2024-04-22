const mongoose = require("mongoose");

const { Schema } = mongoose;

// Function to generate a random string of specified length
const generateRandomString = (length) => {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};

// car Schema
const transferSchema = new Schema(
	{
		transferId: {
			type: String,
			unique: true,
			default: function () {
				// Generate a random string of 6 characters
				return `TSX-${generateRandomString(6)}`;
			},
			validate: {
				validator: function (value) {
					// Validate the format
					return /^TSX-[a-zA-Z0-9]{6}$/.test(value);
				},
				message: (props) => `${props.value} is not a valid transferId!`,
			},
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "user",
		},
		upi: {
			type: String,
		},
		amount: {
			type: Number,
			required: [true, "Amount is required"],
		},
		status: {
			type: String,
			default: "pending",
			enum: ["pending", "accepted", "rejected"],
		},
	},
	{ timestamps: true }
);

const Transfer = mongoose.model("transfer", transferSchema);
module.exports = Transfer;
