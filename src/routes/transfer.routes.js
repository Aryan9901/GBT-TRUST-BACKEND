const { Router } = require("express");
const { authUser } = require("../middlewares/auth.middleware.js");
const { requestTransfer, getTransferRequestById, getAllTransferRequest } = require("../controllers/transfer.controller.js");
const router = Router();

// !! secured routes --------------------------------
router.route("/request/withdrawal").post(authUser, requestTransfer);
router.route("/get/withdrawal/request").get(authUser, getTransferRequestById);
router.route("/get/withdrawal/requests").get(authUser, getAllTransferRequest);

module.exports = router;
