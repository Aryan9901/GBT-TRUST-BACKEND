const { Router } = require("express");
const {
	registerUser,
	logoutUser,
	loginUser,
	risingStars,
	singleUser,
	allUsers,
	newGroup,
	epinGenerator,
	referralLinkGenerate,
	referralCodeGenerate,
	referralLinkAccess,
	myProfile,
	updateProfile,
} = require("../controllers/user.controller.js");
const { authUser } = require("../middlewares/auth.middleware.js");
// const { upload } = require("../middlewares/multer.middleware.js");
// const { verifyJWT } = require("../middlewares/auth.middleware.js");

const { verifyRazorpayPayment, createRazorpayOrder, updatePlan } = require("../controllers/razorpayController.js");

const router = Router();

// TODO: using multer during owner and admin photo upload
// router.route("/register").post(
// 	upload.fields([
// 		{
// 			name: "avatar",
// 			maxCount: 1,
// 		},
// 		{
// 			name: "coverImage",
// 			maxCount: 1,
// 		},
// 	]),
// 	registerUser
// );

// !! public routes --------------------------------
router.route("/login").post(loginUser);

router.route("/register").post(registerUser);

// !! secured routes --------------------------------
router.route("/logout").post(authUser, logoutUser);
router.route("/me").get(authUser, myProfile);
router.route("/single/user").get(authUser, singleUser);
router.route("/allusers").get(authUser, allUsers);
router.route("/update/user").post(authUser, updateProfile);
router.route("/team/newgroup").post(authUser, newGroup);
router.route("/team/stars").get(authUser, risingStars);
router.route("/epin/generate").post(authUser, epinGenerator);
router.route("/referral/generate-code").post(authUser, referralCodeGenerate);
router.route("/referral/generate-link").post(authUser, referralLinkGenerate);
router.route("/referral/generated-link/:referralCode").get(authUser, referralLinkAccess);
router.route("/update-plan").post(authUser, updatePlan);
router.route("/rz/payment-verify").post(authUser, verifyRazorpayPayment);
router.route("/rz/create-order").post(authUser, createRazorpayOrder);

module.exports = router;
