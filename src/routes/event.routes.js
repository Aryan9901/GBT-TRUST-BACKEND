const { Router } = require("express");
const { authUser } = require("../middlewares/auth.middleware.js");
const { createEventRequest } = require("../controllers/event.controller.js");
const router = Router();
// !! secured routes --------------------------------
router.route("/request/event").post(authUser, createEventRequest);

module.exports = router;
