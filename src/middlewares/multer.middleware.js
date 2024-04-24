const multer = require("multer");

// Multer configuration
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "public/test/"); // Destination folder inside the public directory where images will be stored
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + "-" + file.originalname); // Unique filename for each uploaded image
	},
});

const fileFilter = (req, file, cb) => {
	// Check file type
	if (file.mimetype.startsWith("image/")) {
		cb(null, true); // Accept image files
	} else {
		cb(new Error("Only image files are allowed"), false); // Reject non-image files
	}
};

const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
});

module.exports = upload;
