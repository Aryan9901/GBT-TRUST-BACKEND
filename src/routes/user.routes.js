const { Router } = require("express");
const { registerUser, logoutUser, loginUser, risingStars } = require("../controllers/user.controller.js");
const { authUser } = require("../middlewares/auth.middleware.js");
// const { upload } = require("../middlewares/multer.middleware.js");
// const { verifyJWT } = require("../middlewares/auth.middleware.js");

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
router.route("/team/stars").get(authUser, risingStars);     

module.exports = router;



