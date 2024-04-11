const { Router } = require("express");
const { authUser } = require("../middlewares/auth.middleware.js");
const { createEventRequest, getAllEvents } = require("../controllers/event.controller.js");
const router = Router();
// !! secured routes --------------------------------
router.route("/request/event").post(authUser, createEventRequest);
router.route("/get/events").get(authUser, getAllEvents);

module.exports = router;
