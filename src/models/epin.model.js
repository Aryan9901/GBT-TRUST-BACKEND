const mongoose = require("mongoose");

const { Schema } = mongoose;

// car Schema
const epinSchema = new Schema(
	{
		transferId:{
            type: String,
            // required: [true, "Transfer Id is required"],
            unique: true,
        },
        epin:{
            type: [String],
            required: [true, "Epin is required"],
            unique: true,
        },
        isRedeem : {
            type: Boolean,
            default: false,
        },
        status:{
            type: String,
            enum: ["allocated", "notAllocated"],
            default: "notAllocated",
        },
		user: {
			type: Schema.Types.ObjectId,
			ref: "User", // This should match the model name of your owner schema
		},
	},
	{ timestamps: true }
);

// epinSchema.pre("save", async function (next) {
//     if (this.isNew) {
//         const lastUser = await User.findOne({}, {}, { sort: { 'userId': -1 }     });
//         if (lastUser) {
//             this.userId = Number(lastUser.userId) + 1;
//         } else {
//             this.userId = 1;
//         }
//     }
// 	next();
// });


const Epin = mongoose.model("epin", epinSchema);
module.exports = Epin;


