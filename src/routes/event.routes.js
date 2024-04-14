const { Router } = require("express");
const { authUser } = require("../middlewares/auth.middleware.js");
const { createEventRequest, getAllEvents, acceptEvent } = require("../controllers/event.controller.js");
const router = Router();
// !! secured routes --------------------------------
router.route("/request/event").post(authUser, createEventRequest);
router.route("/get/events").get(authUser, getAllEvents);
router.route("/update/event/status").patch(authUser, acceptEvent);

module.exports = router;
