const mongoose = require("mongoose");

const { Schema } = mongoose;

// car Schema
const epinSchema = new Schema(
	{
		TransferId:{
            type: String,
            required: [true, "Transfer Id is required"],
            unique: true,
        },
        Epin:{
            type: String,
            required: [true, "Epin is required"],
            unique: true,
        },
        status:{
            type: String,
            enum: ["Successful", "Not Delivered"],
            default: "unused",
        },
		user: {
			type: Schema.Types.ObjectId,
			ref: "user", // This should match the model name of your owner schema
		},
	},
	{ timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (this.isNew) {
        const lastUser = await User.findOne({}, {}, { sort: { 'userId': -1 }     });
        if (lastUser) {
            this.userId = Number(lastUser.userId) + 1;
        } else {
            this.userId = 1;
        }
    }
	next();
});


const Epin = mongoose.model("Epin", epinSchema);
module.exports = Epin;


