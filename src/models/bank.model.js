const mongoose = require("mongoose");

const { Schema } = mongoose;

// car Schema
const bankSchema = new Schema(
	{
		user : {
            type: Schema.Types.ObjectId,
            ref: "user", // This should match the model name of your owner schema
        },
        accountNumber:{
            type: String,
            required: [true, "Account Number is required"],
            unique: true,
        },
        ifscCode:{
            type: String,
            required: [true, "IFSC Code is required"],
        },
        accountType:{
            type: String,
            enum: ["Saving", "Current"],
            default: "Saving",
        },
        
	},
	{ timestamps: true }
);



const Bank = mongoose.model("bank", bankSchema);
module.exports = Bank;


