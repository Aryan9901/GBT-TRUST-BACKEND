const User = require("../models/user.model");
const Epin = require("../models/epin.model.js");

const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const Team = require("../models/team.model.js");
const crypto = require("crypto");
const { findById } = require("../models/bank.model.js");

// ?? Admin Register Handler
exports.registerUser = catchAsyncErrors(async (req, res) => {
	const { firstName, lastName, email, contact, city, postalCode, state, password, role, referralCode } = req.body;
	console.log(firstName, lastName, email, contact, city, postalCode, state, password, role, referralCode);

	const existedUser = await User.findOne({
		$or: [{ email }, { contact }],
	});

	console.log(existedUser);

	if (existedUser) {
		throw new ApiError(409, "User with the same email or contact already exists");
	}

	const user = await User.create({
		firstName,
		lastName,
		email,
		contact,
		password,
		role: role || "user",
		city,
		postalCode,
		state: state,
	});

	console.log(user);

	const createdUser = await User.findById(user._id).select("-password");

	if (!createdUser) {
		throw new ApiError(500, "Something went wrong while registering the user");
	}

	return res.status(201).json(new ApiResponse(200, { createdUser, referralCode }, "User registered successfully"));
});

// ?? Admin Login Handler
exports.loginUser = catchAsyncErrors(async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		throw new ApiError(400, "phone number or username and password is required is required");
	}
	const user = await User.findOne({
		email,
	}).select("+password");
	console.log(user);
	if (!user) {
		throw new ApiError(404, "User does not exist");
	}

	const isPasswordValid = await user.comparePassword(password);

	if (!isPasswordValid) {
		throw new ApiError(401, "Invalid user credentials");
	}

	const token = await user.getJwtToken();

	const options = {
		expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
		httpOnly: true,
		// secure: true,
	};

	const userWithoutPassword = { ...user.toObject() };
	delete userWithoutPassword.password;
	delete userWithoutPassword.resetPasswordToken;

	return res
		.status(200)
		.cookie("token", token, options)
		.json(
			new ApiResponse(
				200,
				{
					token,
					user: userWithoutPassword,
				},
				"User logged In Successfully"
			)
		);
});

// ?? Admin Logout Handler
exports.logoutUser = catchAsyncErrors(async (req, res) => {
	res.status(200)
		.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
		.json(new ApiResponse(200, "Logged Out Successfully"));
});

exports.myProfile = catchAsyncErrors(async (req, res) => {
	const user = await User.findById(req.user._id);
	if (!user) {
		throw new ApiError(404, "User not found");
	}
	res.status(200).json(new ApiResponse(200, { success: true, user }));
});

// ?? Team Rising Star Handler
exports.risingStars = catchAsyncErrors(async (req, res) => {
	const users = await User.find({ role: "user" }).sort({ referralIncome: -1 }).limit(10);

	if (!users) {
		throw new ApiError(404, "No user found");
	}

	return res.status(200).json(new ApiResponse(200, users, "Top 10 Rising Stars"));
});

// ?? Single User Handler
exports.singleUser = catchAsyncErrors(async (req, res) => {
	// const users = await User.find({ role: "user" }).sort({ referralIncome: -1 }).limit(10);
	const user = await User.findById(req?.params?.id || req?.query?.id);

	if (!user) {
		throw new ApiError(404, "No user found");
	}

	return res.status(200).json(new ApiResponse(200, user, "Used Details"));
});

// ?? All Users Handler
exports.allUsers = catchAsyncErrors(async (req, res) => {
	// const users = await User.find({ role: "user" }).sort({ referralIncome: -1 }).limit(10);
	const users = await User.find().sort({ userId: -1 });

	if (!users) {
		throw new ApiError(404, "No user found");
	}

	return res.status(200).json(new ApiResponse(200, users, "All Users Details"));
});

// ?? TEAM CONTROLLERS

// ? GROUP CREATION

exports.newGroup = catchAsyncErrors(async (req, res) => {
	const { groupName, groupMembers } = req.body;

	// Map over groupMembers and find corresponding users
	const users = await Promise.all(
		groupMembers.map(async (member) => {
			const user = await User.findOne({ $or: [{ email: member }, { contact: member }] });
			if (!user) {
				throw new ApiError(404, `User with email or contact ${member} does not exist`);
			}
			return user._id;
		})
	);

	// Create new team with group members
	const group = await Team.create({
		groupName,
		groupMembers: users, // Assign resolved user IDs
	});

	// Check if group is created successfully
	if (!group) {
		throw new ApiError(404, "No group found");
	}

	// Send success response
	return res.status(200).json(new ApiResponse(200, group, "Group Created Successfully"));
});

// ?? GROUP UPDATE
exports.updateGroup = catchAsyncErrors(async (req, res) => {
	const { groupName, groupMembers } = req.body;

	// Map over groupMembers and find corresponding users
	const users = await Promise.all(
		groupMembers.map(async (member) => {
			const user = await User.findOne({ $or: [{ email: member }, { contact: member }] });
			if (!user) {
				throw new ApiError(404, `User with email or contact ${member} does not exist`);
			}
			return user._id;
		})
	);

	// Create new team with group members
	const group = await Team.create({
		groupName,
		groupMembers: users, // Assign resolved user IDs
	});

	// Check if group is created successfully
	if (!group) {
		throw new ApiError(404, "No group found");
	}

	// Send success response
	return res.status(200).json(new ApiResponse(200, group, "Group Created Successfully"));
});

// ?? Referral Code GENERATOR
//  TODO: Referral Code Generator USE #Frontend To generate Referral Code
exports.referralCodeGenerate = catchAsyncErrors(async (req, res) => {
	try {
		if (req.user.referralCode !== undefined) {
			return res.status(200).json(new ApiResponse(200, req.user.referralCode, "Referral code already generated"));
		}
		console.log(req.user._id.toString());
		const { _id } = req.user;
		const userId = _id.toString();
		// Generate a unique referral code
		const referralCode = await generateReferralCode(userId);

		// Update the user's record with the generated referral code
		const updatedUser = await User.findByIdAndUpdate(userId, { referralCode }, { new: true });

		if (!updatedUser) {
			return res.status(404).json(new ApiResponse(404, null, "User not found"));
		}

		return res.status(200).json(new ApiResponse(200, updatedUser, "Referral code generated successfully"));
	} catch (error) {
		throw new ApiError(404, "Error generating referral code");
	}
});

// ?? Referral Link GENERATOR
exports.referralLinkGenerate = catchAsyncErrors(async (req, res) => {
	const { referralCode } = req.user;
	try {
		if (!req.user) {
			throw new ApiError(404, "User not found");
		}
		req.user.referralUrl = `${getBaseUrl(req)}/referral/generated-link/:referralCode=${referralCode}`;
		await req.user.save();

		// Redirect to home page or any other page after processing the referral
		return res.status(200).json(new ApiResponse(200, req.user.referralUrl, "Referral link generated successfully"));
	} catch (error) {
		console.error("Error processing referral:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

// ?? Referral Link Access Handler
exports.referralLinkAccess = catchAsyncErrors(async (req, res) => {
	const referralCode = req?.params?.referralCode.split("=")[1];
	try {
		if (!referralCode) {
			throw new ApiError(404, "Referral code not found");
		}
		const owner = await User.findOne({ referralCode });
		if (!owner) {
			throw new ApiError(404, "Owner not found");
		}

		if (owner.refers.includes(req.user._id)) {
			return res.status(200).json(new ApiResponse(200, owner, "Referral link already accessed"));
		}

		console.log(req.user._id.toString());
		owner.refers.push(req.user._id); // Assuming the user ID is stored in req.user._id
		await owner.save();

		if (owner.refers.length % 2 === 0) {
			// Add referral bonus to owner's account
			const referralBonus = 300; // Assuming the referral bonus is 300 rupees

			// Add referral bonus to balance
			owner.balance += referralBonus;

			// Add referral bonus to totalBonus
			owner.totalBonus += referralBonus;

			// Add referral bonus to referralIncome
			owner.referralIncome += referralBonus;

			await owner.save();
		}

		// Redirect to home page or any other page after processing the referral
		return res.status(200).json(new ApiResponse(200, owner, "Referral link accessed successfully"));
	} catch (error) {
		console.error("Error processing referral:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

// exports.referralLinkAccess = catchAsyncErrors(async (req, res) => {
// 	const referralCode = req?.params?.referralCode.split("=")[1];
// 	try {
// 		if (!referralCode) {
// 			throw new ApiError(404, "Referral code not found");
// 		}
// 		const owner = await User.findOne({ referralCode });
// 		if (!owner) {
// 			throw new ApiError(404, "Owner not found");
// 		}

// 		// Store the referral link access status or any relevant data in session or cookies for later retrieval
// 		req.session.referralLinkAccessed = true;
// 		req.session.referralOwnerId = owner._id;

// 		// Redirect the user to the signup page
// 		res.redirect("http://localhost:5173/signup");
// 	} catch (error) {
// 		console.error("Error processing referral:", error);
// 		return res.status(500).json({ error: "Internal Server Error" });
// 	}
// });

// ?? Epin Generator Handler
exports.epinGenerator = catchAsyncErrors(async (req, res) => {
	try {
		const { memberId, numberOfPins } = req.body;

		// Generate ePINs based on memberId and numberOfPins
		const ePins = generateEPINs(memberId, numberOfPins);

		// For demonstration purposes, we'll just log the generated ePINs
		console.log(`Generated ePINs for Member ID ${memberId}:`, ePins);

		// You can perform further processing like saving ePINs to the database, etc.

		const user = await User.findById(memberId);

		await user.epinManager.epin.push(ePins.toString());
		user.totalEpin += `${numberOfPins}`;
		user.epinManager.isRedeem = true;
		user.epinManager.status = "allocated";
		await user.save();
		console.log(user);

		// Send success response
		return res.status(200).json(new ApiResponse(200, ePins, `Successfully generated ${numberOfPins} ePIN(s) for Member ID ${memberId}`));
	} catch (error) {
		throw new ApiError(404, "Error generating ePINs:");
	}
});

// Function to generate ePINs based on Member ID and numberOfPins
function generateEPINs(memberId, numberOfPins) {
	const ePins = [];
	for (let i = 0; i < numberOfPins; i++) {
		const ePin = generateSecureEPIN(memberId);
		ePins.push(ePin);
	}
	return ePins;
}

// Function to generate a secure ePIN using crypto module
function generateSecureEPIN(memberId) {
	// Concatenate memberId with a random string for added security
	const secret = memberId + generateRandomString();

	// Generate SHA-256 hash of the concatenated string
	const hash = crypto.createHash("sha256");
	hash.update(secret);
	const ePin = hash.digest("hex").substring(0, 8); // Take the first 8 characters of the hash as ePIN

	return ePin;
}

// Function to generate a random string for salting
function generateRandomString() {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Function to generate a referral code for a given user ID
async function generateReferralCode(userId) {
	const user = await User.findById(userId);

	const secretKey = `${user.email}${user.contact}${Date.now()}`.toString(); // Replace with your secret key
	const hash = crypto.createHmac("sha256", secretKey).update(userId).digest("hex");
	return hash.substring(0, 8); // Use the first 8 characters of the hash as the referral code
}

// Function to get the base URL of the current request
function getBaseUrl(req) {
	return `${req.protocol}://${req.get("host")}/api/v1/user`;
}
