const User = require("../models/user.model");

const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");

// ?? Admin Register Handler
exports.registerUser = catchAsyncErrors(async (req, res) => {
	const { firstName, lastName,email, contact, city, postalCode, state, password, role } = req.body;

	if ([firstName, lastName, email, contact, password, city, postalCode, state].some((field) => field?.trim() === "")) {
		throw new ApiError(400, "All fields are required");
	}

	const existedUser = await User.findOne({
		$or: [{ email }, { contact }],
	});

	if (existedUser) {
		throw new ApiError(409, "User with same email or contact already exists");
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
        state
	});

	const createdUser = await User.findById(user._id).select("-password");

	if (!createdUser) {
		throw new ApiError(500, "Something went wrong while registering the user");
	}

	return res.status(201).json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

// ?? Admin Login Handler
exports.loginUser = catchAsyncErrors(async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		throw new ApiError(400, "phone number or username and password is required is required");
	}
	const user = await User.findOne({
		$or: [{ contact: username }, { email: username }],
	}).select("+password");

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

// ?? Team Rising Star Handler
exports.risingStars = catchAsyncErrors(async (req, res) => {
	const users = await User.find({ role: "user" }).sort({ referralIncome: -1 }).limit(10);

    if (!users) {
        throw new ApiError(404, "No user found");
    }

    return res.status(200).json(new ApiResponse(200, users, "Top 10 Rising Stars"));
});

