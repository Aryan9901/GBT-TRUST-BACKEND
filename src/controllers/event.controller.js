const Event = require("../models/event.model.js");

const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");

exports.createEventRequest = catchAsyncErrors(async (req, res) => {
	const { eventName, eventPurpose, eventBudget, peopleJoin, eventDate, eventTime, eventDuration, guestEmails, eventLocation } = req.body;

	// Assuming eventManager is obtained from req.user or passed along with the request
	const eventManager = req.user._id; // Adjust this based on your authentication mechanism

	// Create a new event object
	const newEvent = new Event({
		eventName,
		eventPurpose,
		eventBudget,
		peopleJoin,
		eventDate,
		eventTime,
		eventDuration,
		guestEmails,
		eventLocation,
		eventManager,
		status: "notapproved", // Default status for a new event request
	});

	// Save the new event in the database
	await newEvent.save();

	// Respond with success message
	res.status(201).json(new ApiResponse(201, newEvent, "Event request created successfully"));
});
