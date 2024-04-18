// const axios = require('axios');
const Razorpay = require("razorpay");
const axios = require("axios");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors.js");
const User = require("../models/user.model.js");
require("dotenv").config();

const instance = new Razorpay({
	key_id: process.env.RZ_ID,
	key_secret: process.env.RZ_KEY_SECRET,
});

const createRazorpayOrder = async (req, res) => {
	console.log("id", process.env.RZ_ID);

	try {
		const { amount, currency, receipt } = req.body;

		const options = {
			amount: amount,
			currency: currency,
			receipt: receipt,
		};

		instance.orders.create(options, (err, order) => {
			if (err) {
				// console.error("Error creating Razorpay order:", err);
				res.status(500).json({ success: false, message: "Internal Server Error" });
			} else {
				// console.log(order);
				res.status(200).json({
					success: true,
					order_id: order.id,
					amount: order.amount,
					currency: order.currency,
					razorpay_key: process.env.RZ_ID, // Provide your Razorpay Key ID to the frontend
				});
			}
		});
	} catch (error) {
		console.error("Error creating Razorpay order:", error);
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

const verifyRazorpayPayment = async (req, res) => {
	try {
		const { order_id, payment_id } = req.body;

		// Make a request to the Razorpay API to verify the payment
		instance.payments.capture(payment_id, 650 * 100, "INR", (err, response) => {
			// console.log(response);
			if (err) {
				console.error("Error verifying Razorpay payment:", err);
				res.status(200).json({ success: true, message: "Payment verification failed" });
			} else {
				if (response.status === "captured") {
					// Payment is successful
					// You can update your database or perform other necessary actions here

					res.status(200).json({ success: true, message: "Payment verified successfully" });
				} else {
					// Payment failed
					res.status(400).json({ success: false, message: "Payment verification failed" });
				}
			}
		});
	} catch (error) {
		console.error("Error verifying Razorpay payment:", error);
		res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

const updatePlan = async (req, res) => {
	try {
		const { plan } = req.body;
		const userId = req.user._id;
		console.log("***************************************************************");
		console.log(plan, userId);
		console.log("***************************************************************");
		// Validation
		if (!plan || !userId) {
			return res.status(400).json({ success: false, message: "Missing required fields." });
		}

		// Assuming you have a Mongoose User model
		const user = await User.findOne({ _id: userId });

		// Validation: Check if the user exists
		if (!user) {
			return res.status(404).json({ success: false, message: "User not found." });
		}

		// Validation: Check if the provided plan is valid (you might want to customize this based on your plans)
		const validPlans = ["basic", "premium", "pro"];
		if (!validPlans.includes(plan)) {
			return res.status(400).json({ success: false, message: "Invalid plan." });
		}
		console.log("****************************************************");
		console.log("plan: " + plan);
		// Update user plan
		user.plan = plan;

		// Save the updated user
		await user.save();

		return res.status(200).json({ success: true, message: "Plan updated successfully." });
	} catch (error) {
		console.error("Error updating plan:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error." });
	}
};

const transferToBank = catchAsyncErrors(async (req, res) => {
	const { accountNumber, ifscCode, accountHolderName, amount, bankName, purpose } = req.body;
	console.log("hello");
	const payload = {
		account: {
			account_number: accountNumber,
			name: accountHolderName,
			ifsc: ifscCode,
			bank_name: "Bank Name", // You can fetch this dynamically using IFSC code API
		},
		amount: amount * 100, // Amount in paisa
		currency: "INR",
	};

	try {
		const response = await axios.post("https://api.razorpay.com/v1/payouts", payload, {
			auth: {
				username: process.env.RZ_ID,
				password: process.env.RZ_KEY_SECRET,
			},
			headers: {
				"Content-Type": "application/json",
			},
		});

		console.log("Payout initiated:", response.data);

		// Sending success response
		res.status(200).json(new ApiResponse(200, "Transferred to bank successfully"));
	} catch (error) {
		console.error("Error initiating bank transfer:", error.response ? error.response.data : error.message);

		// Sending error response
		res.status(500).json(new ApiResponse(500, "Failed to transfer to bank", error.message));
	}
});

module.exports = {
	verifyRazorpayPayment,
	createRazorpayOrder,
	updatePlan,
	transferToBank,
};

// !! razorpay payout
// Example payload for a bank transfer
// const payoutPayload = {
// 	account_number: "ACC_NUMBER",
// 	fund_account_id: "FUND_ACCOUNT_ID",
// 	amount: 10000, // Amount in paisa (e.g., 10000 paisa = ₹100)
// 	currency: "INR",
// 	mode: "IMPS", // Transfer mode (IMPS/NEFT/RTGS)
// 	purpose: "payout", // Purpose of the payout
// 	queue_if_low_balance: true, // Queue payout if balance is low
// 	reference_id: "YOUR_REFERENCE_ID",
// };
