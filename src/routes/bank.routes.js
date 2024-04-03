const { Router } = require("express");
const { authUser } = require("../middlewares/auth.middleware.js");
const { getBankDetails } = require("../controllers/bank.controller.js");
const router = Router();
// !! secured routes --------------------------------
router.route("/get/bankdetails").get(authUser, getBankDetails);

module.exports = router;
