const mongoose = require("mongoose");

const { Schema } = mongoose;

// car Schema
const teamSchema = new Schema(
	{
		groupName:{
            type: String,
            required: [true, "Group Name is required"],
            unique: true,
        },
        groupMembers:[
            {
                type: Schema.Types.ObjectId ,
                ref: "user",
            }
        ],
	},
	{ timestamps: true }
);

const Team = mongoose.model("team", teamSchema);
module.exports = Team;


