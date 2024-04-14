const mongoose = require("mongoose");

const { Schema } = mongoose;

// car Schema
const eventSchema = new Schema(
	{
		eventName: {
			type: String,
			required: [true, "Event Name is required"],
			unique: true,
		},
		eventPurpose: {
			type: String,
			required: [true, "Event Purpose is required"],
		},
		eventBudget: {
			type: Number,
			required: [true, "Event Budget is required"],
		},
		peopleJoin: {
			type: Number,
			required: [true, "People Join is required"],
		},
		eventDate: {
			type: Date,
			required: [true, "Event Date is required"],
		},
		eventTime: {
			type: String,
			required: [true, "Event Time is required"],
		},
		eventDuration: {
			type: Number,
			required: [true, "Event Duration is required"],
		},
		guestEmails: [
			{
				type: String,
				required: [true, "Guest Emails is required"],
			},
		],
		eventLocation: {
			type: String,
			required: [true, "Event Location is required"],
		},

		status: {
			type: String,
			enum: ["approved", "completed", "notapproved", "ongoing"],
			default: "notapproved",
		},
		eventManager: {
			type: Schema.Types.ObjectId,
			ref: "user", // This should match the model name of your owner schema
		},
	},
	{ timestamps: true }
);

const Event = mongoose.model("event", eventSchema);
module.exports = Event;
