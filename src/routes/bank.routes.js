const { Router } = require("express");
const { authUser } = require("../middlewares/auth.middleware.js");
const { getBankDetails } = require("../controllers/bank.controller.js");
const { transferToBank } = require("../controllers/razorpayController.js");
const router = Router();
// !! secured routes --------------------------------
router.route("/get/bankdetails").get(authUser, getBankDetails);
router.route("/rz/transfer/bank").post(authUser, transferToBank);

module.exports = router;
