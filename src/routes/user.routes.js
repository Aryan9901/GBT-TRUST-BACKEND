const { Router } = require("express");
const router = Router();
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
	generateUserTree,
	sendMail,
	activeUsers,
	verifyUser,
	getTeamMembers,
	getAllUserBelow,
} = require("../controllers/user.controller.js");
const { authUser } = require("../middlewares/auth.middleware.js");

const { verifyRazorpayPayment, createRazorpayOrder, updatePlan } = require("../controllers/razorpayController.js");

const multer = require("multer");
const path = require("path");

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

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, `public/uploads`);
	},
	filename: function (req, file, cb) {
		cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
	},
});

const upload = multer({ storage: storage });

// !! public routes --------------------------------
router.route("/login").post(loginUser);
router.route("/register").post(upload.fields([{ name: "avatar" }, { name: "aadhar" }, { name: "pan" }]), registerUser);

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
router.route("/generate/tree").post(authUser, generateUserTree);
router.route("/send-mail").post(authUser, sendMail);
router.route("/active-users").get(authUser, activeUsers);
router.route("/verify/user").post(authUser, verifyUser);
// router.route("/get/team").get(authUser, getTeamMembers);
router.route("/get/team").get(authUser, getAllUserBelow);

module.exports = router;
