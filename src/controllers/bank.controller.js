const Bank = require("../models/bank.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
exports.getBankDetails = catchAsyncErrors(async (req, res) => {
	const userId = req.user._id;
	const bankDetails = await Bank.findOne({ user: userId });

	if (!bankDetails) {
		throw new ApiError(404, "Bank details not found");
	}

	res.status(200).json(new ApiResponse(201, bankDetails, "Bank details found"));
});
