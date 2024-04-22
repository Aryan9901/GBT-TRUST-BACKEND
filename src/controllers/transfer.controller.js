const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const Transfer = require("../models/transfer.model.js");
const User = require("../models/user.model.js");
const Bank = require("../models/bank.model.js");

// ?? Admin Register Handler
exports.requestTransfer = catchAsyncErrors(async (req, res) => {
	const { accountNumber, ifscCode, accountHolderName, amount, bankName, purpose, accountType, upi } = req.body;

	if (!accountNumber && !ifscCode && !accountHolderName && !amount && !bankName && !purpose && !accountType) {
		throw new ApiError(301, "All Fields are Required");
	}

	const userId = req.user._id;

	const isBankDetailsExist = await Bank.findOne({ user: userId });

	if (!isBankDetailsExist) {
		const bank = await Bank.create({
			user: userId,
			accountNumber,
			accountHolderName,
			ifscCode,
			accountType,
			bankName,
		});
		if (!bank) {
			throw new ApiError(501, "Error while creating bank account");
		}
	}

	const transfer = await Transfer.create({
		user: userId,
		amount,
		upi,
	});

	return res.status(201).json(new ApiResponse(200, transfer, "Withdrawal Request Initiated"));
});

exports.getAllTransferRequest = catchAsyncErrors(async (req, res) => {
	const transfers = await Transfer.find().populate("user");
	if (!transfers || transfers.length === 0) {
		throw new ApiError(404, "No transfer request found");
	}

	return res.status(201).json(new ApiResponse(200, transfers, "Success"));
});

exports.getTransferRequestById = catchAsyncErrors(async (req, res) => {
	const userId = req.user._id;

	const transfers = await Transfer.find({ user: userId }).populate("user");

	if (!transfers || transfers.length === 0) {
		throw new ApiError(404, "No transfer request found");
	}

	return res.status(201).json(new ApiResponse(200, transfers, "Success"));
});

exports.getSingleTransfer = catchAsyncErrors(async (req, res) => {
	const id = req.query.id;

	const transferdata = await Transfer.findById(id).populate("user");
	if (!transferdata) {
		throw new ApiError(404, "No transfer request found");
	}

	const bank = await Bank.findOne({ user: transferdata.user._id });

	if (!bank) {
		transferdata.status = "rejected";
		await transferdata.save();
		return res.status(201).json(new ApiResponse(200, transferdata, "Transfer Request Rejected because Bank Details not found!"));
	}
	// console.log(transferdata);
	// console.log(bank);
	const transfer = {
		transferdata,
		bank,
	};

	return res.status(201).json(new ApiResponse(200, transfer, "Success"));
});

exports.processRequest = catchAsyncErrors(async (req, res) => {
	const { transferId, action, amount } = req.body;

	const transfer = await Transfer.findById(transferId);

	if (!transfer) {
		throw new ApiError(404, "No transfer request found");
	}

	if (!action) {
		transfer.status = "rejected";
		await transfer.save();
		return res.status(201).json(new ApiResponse(200, transferdata, "Transfer Request Rejected!"));
	}

	const user = await User.findById(transfer.user);

	transfer.status = "accepted";
	await transfer.save();

	if (!user) {
		return res.status(201).json(new ApiResponse(200, transferdata, "Transfer Request Rejected because Bank Details not found!"));
	}

	user.balance = user.balance - amount;

	await user.save();

	return res.status(201).json(new ApiResponse(200, transfer, "Success"));
});
