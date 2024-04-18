const User = require("../models/user.model.js");
const Bank = require("../models/bank.model.js");
const Epin = require("../models/epin.model.js");

const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const Team = require("../models/team.model.js");
const crypto = require("crypto");

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: process.env.NODEMAILER_EMAIL,
		pass: process.env.NODEMAILER_PASSWORD,
	},
});

// ?? Admin Register Handler
exports.registerUser = catchAsyncErrors(async (req, res) => {
	const { firstName, lastName, email, contact, city, postalCode, state, password, role, referralCode, photo, aadhar, pan } = req.body;
	// console.log(firstName, lastName, email, contact, city, postalCode, state, password, role, referralCode, photo, aadhar, pan);

	const existedUser = await User.findOne({
		$or: [{ email }, { contact }],
	});

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
		aadharCard: aadhar,
		panCard: pan,
		avatar: photo,
	});

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

	// Update lastActive field
	user.lastActive = Date.now();
	await user.save();

	const token = await user.getJwtToken();

	const options = {
		expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
		httpOnly: true,
		// secure: true,
	};
	const userWithoutPassword = { ...user.toObject() };
	delete userWithoutPassword.password;
	delete userWithoutPassword.resetPasswordToken;

	user.activeStatus = "active";
	user.save();

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
	// Update lastActive field
	req.user.lastActive = Date.now();
	req.user.activeStatus = "inactive";
	await req.user.save();

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

// ?? UPDATE PROFILE
exports.updateProfile = catchAsyncErrors(async (req, res) => {
	const { firstName, lastName, gender, dob, contact, whatsapp, linkedin, facebook, bankDetails } = req.body;
	const userId = req.user._id; // Assuming you're using authentication middleware to attach the user object to the request
	// Find the user by userId
	const user = await User.findById(userId);
	if (!user) {
		throw new ApiError(404, "User not found");
	}
	// Update user fields if they are provided and not undefined
	if (firstName) {
		user.firstName = firstName;
	}
	if (lastName) {
		user.lastName = lastName;
	}
	if (gender) {
		user.gender = gender;
	}
	if (dob) {
		user.dob = dob;
	}
	if (contact) {
		user.contact = contact;
	}
	if (whatsapp) {
		user.whatsapp = whatsapp;
	}
	if (linkedin) {
		user.linkedin = linkedin;
	}
	if (facebook) {
		user.facebook = facebook;
	}
	// Add conditions for other fields as needed
	// Save the updated user object
	await user.save();

	// Update or create bank details if provided
	if (bankDetails) {
		let bank = await Bank.findOne({ user: userId }); // Find bank details by user ID
		if (!bank) {
			// Create bank details if not found
			bank = new Bank({
				user: userId,
				accountNumber: bankDetails.accountNumber,
				ifscCode: bankDetails.ifscCode,
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

	res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"));
});

// ?? get team details
exports.getTeamMembers = catchAsyncErrors(async (req, res) => {
	const teams = await User.findById(req.user._id).populate("refers");
	if (!teams) {
		throw new ApiError(404, "teams not found");
	}
	res.status(200).json(new ApiResponse(200, { success: true, teams: teams.refers }));
});

// ?? Team Rising Star Handler
exports.risingStars = catchAsyncErrors(async (req, res) => {
	const users = await User.find({ role: "user" }).sort({ referralIncome: -1 }).limit(10);

	if (!users) {
		throw new ApiError(404, "No user found");
	}

	return res.status(200).json(new ApiResponse(200, users, "Top 10 Rising Stars"));
});

exports.sendMail = catchAsyncErrors(async (req, res) => {
	const mailOptions = {
		from: process.env.NODEMAILER_EMAIL,
		to: req.body.email,
		subject: "Invitation Regarding Program/Event.",
		html: "I hope this email finds you well. We are excited to extend an invitation to you for [provide details about the event/program/platform].",
	};
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			throw new ApiError(404, error, "Email not sent");
		}
	});
	console.log(information);
	return res.status(200).json(new ApiResponse(200, information, "Email sent successfully"));
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

exports.referralLinkAccess = catchAsyncErrors(async (req, res) => {
	const referralCode = req?.params?.referralCode.split("=")[1];
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

	owner.refers.push(req.user._id); // Assuming the user ID is stored in
	owner.referralIncome += referralBonus;
	req.user._id;
	await owner.save();

	// Add parent reference to the user being referred
	const userBeingReferred = await User.findById(req.user._id);
	if (userBeingReferred) {
		userBeingReferred.parent = owner._id;
		await userBeingReferred.save();
	}

	if (owner.refers.length % 2 === 0) {
		// Add referral bonus to owner's account
		const referralBonus = 300; // Assuming the referral bonus is 300 rupees

		// Add referral bonus to balance
		owner.balance += referralBonus;

		// Add referral bonus to totalBonus
		owner.totalBonus += referralBonus;

		// Add referral bonus to referralIncome

		await owner.save();

		// Add referral bonus to parent and their parent recursively
		let parent = owner.parent;
		let bonusToParent = referralBonus / 2;
		while (parent) {
			const parentUser = await User.findById(parent);
			if (parentUser) {
				parentUser.balance += bonusToParent;
				parentUser.totalBonus += bonusToParent;
				parentUser.referralIncome /= bonusToParent;
				await parentUser.save();
			}
			parent = parentUser.parent;
			bonusToParent /= 2; // Halve the bonus for the next parent
		}
	}

	// Redirect to home page or any other page after processing the referral
	return res.status(200).json(new ApiResponse(200, owner, "Referral link accessed successfully"));
});

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

// Controller function to generate the user tree
exports.generateUserTree = catchAsyncErrors(async (req, res) => {
	const { userId } = req.query; // Assuming the user ID is passed in the request parameters

	// Generate the tree starting from the specified root user
	const tree = await generateTree(userId, 0);

	// Return the generated tree
	res.status(200).json(new ApiResponse(200, tree, "Tree Generated Successfully"));
});

// Controller to Find Active users
exports.activeUsers = catchAsyncErrors(async (req, res) => {
	const users = await User.find({ activeStatus: "active" });
	if (!users) {
		throw new ApiError(404, "No active users found");
	}
	res.status(200).json(new ApiResponse(200, users, "Active Users Found Successfully"));
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

// !! tree formation
// Function to recursively generate the tree nodes
async function generateTree(userId, depth) {
	const user = await User.findById(userId);
	if (!user) return null;

	const name = `${user.firstName} ${user.lastName}`;
	const attributes = {
		rank: user.rank,
	};
	const children = [];

	// Fetch the children IDs from the database
	const childIds = user.refers;

	// Recursively generate tree nodes for each child
	for (const childId of childIds) {
		const childNode = await generateTree(childId, depth + 1);
		children.push(childNode);
	}

	return {
		name,
		attributes,
		children,
	};
}

async function updateUserActivityStatus() {
	const inactiveThreshold = 60; // 60 minutes of inactivity threshold

	const users = await User.find({ activeStatus: "active" });

	const currentTime = new Date();

	users.forEach(async (user) => {
		const lastActiveTime = user.lastActive;
		const timeDifference = currentTime - lastActiveTime;
		const minutesDifference = timeDifference / (1000 * 60);

		if (minutesDifference > inactiveThreshold) {
			user.activeStatus = "inactive";
			await user.save();
		}
	});
}

// ?? setting the approval status
exports.verifyUser = catchAsyncErrors(async (req, res) => {
	const id = req.query.id;
	const { status } = req.body;
	console.log("*************************************************");
	console.log(id, status);

	const user = await User.findById(id);
	if (!user) {
		throw new ApiError(403, "User not found");
	}

	user.verified = status === true ? "approved" : "pending";
	await user.save();
	// Return the generated tree
	res.status(200).json(new ApiResponse(200, null, "user" + status === true ? "approved" : "not approved"));
});

// Run this function periodically using setInterval or a job scheduler

setInterval(updateUserActivityStatus, 1000 * 60 * 1); // Check in every 1/2 hrs
