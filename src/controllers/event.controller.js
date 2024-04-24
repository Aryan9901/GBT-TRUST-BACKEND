const Event = require("../models/event.model.js");
const User = require("../models/user.model.js");
const Bank = require("../models/bank.model.js");

const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");

exports.createEventRequest = catchAsyncErrors(async (req, res) => {
	const { eventName, eventPurpose, eventBudget, peopleJoin, eventDate, eventTime, eventDuration, guestEmails, eventLocation, bankDetails } =
		req.body;

	// Assuming eventManager is obtained from req.user or passed along with the request
	const eventManager = req.user._id; // Adjust this based on your authentication mechanism

	// Check if all required fields are present
	if (!eventName || !eventPurpose || !eventBudget || !peopleJoin || !eventDate || !eventTime || !eventDuration || !eventManager) {
		throw new ApiError(400, "Missing required fields");
	}

	const eventDateTime = new Date(`${eventDate}T${eventTime}`);

	// Check if the eventDate is in the future
	if (eventDateTime < new Date() - 1) {
		throw new ApiError(400, "Event date cannot be in the past");
	}

	// Check if the eventDuration is greater than 0
	if (eventDuration <= 0) {
		throw new ApiError(400, "Event duration must be greater than 0");
	}

	// Check if the eventBudget is greater than 0
	if (eventBudget <= 0) {
		throw new ApiError(400, "Event budget must be greater than 0");
	}

	// Check if the peopleJoin is greater than 0
	if (peopleJoin <= 0) {
		throw new ApiError(400, "People join must be greater than 0");
	}

	let parsedGuestEmails = guestEmails; // Declare as let variable

	// Convert the list of guest emails in array with type string when given with separated commas
	if (guestEmails) {
		parsedGuestEmails = guestEmails.split(",").map((email) => email.trim());
		// console.log("guestEmails : ", parsedGuestEmails);
	}

	// Create a new event object
	const newEvent = new Event({
		eventName,
		eventPurpose,
		eventBudget,
		peopleJoin,
		eventDate: eventDateTime,
		eventTime,
		eventDuration,
		eventManager,
		guestEmails: parsedGuestEmails, // Use the parsedGuestEmails variable here
		eventLocation,
		status: "notapproved", // Default status for a new event request
	});

	const user = await User.findById(req.user._id);
	user.events.push(newEvent._id);

	if (bankDetails) {
		let bank = await Bank.findOne({ user: user._id }); // Find bank details by user ID
		if (!bank) {
			// Create bank details if not found
			bank = new Bank({
				user: user._id,
				accountNumber: bankDetails.accountNumber,
				ifscCode: bankDetails.ifsc,
				accountType: bankDetails.accountType,
				accountHolderName: bankDetails.accountHolderName,
			});
		} else {
			// Update bank details if found
			if (bankDetails.accountNumber !== undefined) {
				bank.accountNumber = bankDetails.accountNumber;
			}
			if (bankDetails.ifscCode !== undefined) {
				bank.ifscCode = bankDetails.ifscCode;
			}
			if (bankDetails.accountHolderName !== undefined) {
				bank.accountHolderName = bankDetails.accountHolderName;
			}
			if (bankDetails.accountType !== undefined) {
				bank.accountType = bankDetails.accountType;
			}
		}
		await bank.save();
	}

	await user.save();

	// Validate the event
	if (!newEvent) {
		throw new ApiError(500, "Error creating event");
	}

	// Save the new event in the database
	await newEvent.save();

	// Respond with success message
	res.status(201).json(new ApiResponse(201, newEvent, "Event request created successfully"));
});

exports.getAllEvents = catchAsyncErrors(async (req, res) => {
	// Create a new event object
	const events = await Event.find({}).populate("eventManager");

	// console.log(events);

	// Validate the event
	if (!events) {
		throw new ApiError(500, "No event found");
	}

	res.status(201).json(new ApiResponse(201, events, ""));
});

exports.acceptEvent = catchAsyncErrors(async (req, res) => {
	// Create a new event object
	const id = req?.query?.id;

	// console.log(id);

	const event = await Event.findById(id);

	if (!event) {
		throw new ApiError(404, "Event not found");
	}

	// console.log(event);

	event.status = "approved";

	await event.save();

	res.status(201).json(new ApiResponse(201, event, "Event Accepted Successfully"));
});
