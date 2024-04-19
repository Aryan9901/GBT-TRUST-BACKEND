const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const Transfer = require("../models/transfer.model.js");
const User = require("../models/user.model.js");
const Bank = require("../models/bank.model.js");

// ?? Admin Register Handler
exports.requestTransfer = catchAsyncErrors(async (req, res) => {
	const { accountNumber, ifscCode, accountHolderName, amount, bankName, purpose, accountType } = req.body;

	if (accountNumber && ifscCode && accountHolderName && amount && bankName && purpose && accountType) {
		throw new ApiError(301, "All Fields are Required");
	}

	const userId = req.user._id;

	const isBankDetailsExist = await Bank.find({ user: userId });

	if (!isBankDetailsExist) {
		const bank = await Bank.create({
			user: userId,
			accountNumber,
			accountHolderName,
			ifscCode,
			accountType,
		});
		if (bank) {
			throw new ApiError(501, "Error while creating bank account");
		}
	}

	const transfer = await Transfer.create({
		user: userId,
		amount,
	});

	return res.status(201).json(new ApiResponse(200, transfer, "Withdrawal Request Initiated"));
});

exports.getAllTransferRequest = catchAsyncErrors(async (req, res) => {
	const transfers = await Transfer.find();

	if (!transfers || transfers.length === 0) {
		throw new ApiError(404, "No transfer request found");
	}

	return res.status(201).json(new ApiResponse(200, transfers, "Success"));
});

exports.getTransferRequestById = catchAsyncErrors(async (req, res) => {
	const userId = req.user._id;

	const transfers = await Transfer.find({ user: userId });

	if (!transfers || transfers.length === 0) {
		throw new ApiError(404, "No transfer request found");
	}

	return res.status(201).json(new ApiResponse(200, transfers, "Success"));
});
