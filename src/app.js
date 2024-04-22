const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { generatedErrors } = require("./middlewares/errors");
const { ApiError } = require("./utils/ApiError");
const app = express();
const path = require('path');

app.use(express.static("public"));

app.use(
	cors({
		origin: "*",
		credentials: true,
	})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import

const userRouter = require("./routes/user.routes.js");
const eventsRouter = require("./routes/event.routes.js");
const bankRouter = require("./routes/bank.routes.js");
const transferRouter = require("./routes/transfer.routes.js");

//routes declare
app.use("/api/v1/user", userRouter);
app.use("/api/v1/user", eventsRouter);
app.use("/api/v1/user", bankRouter);
app.use("/api/v1/user", transferRouter);

// ?? multer image saving
app.use("/", express.static(path.join(__dirname, "..", "/public", "/uploads")));

app.get("/", (req, res) => {
	res.send("Welcome to the GBT API.");
});

app.all("*", (req, res, next) => {
	next(new ApiError(404, `Requested URL Not Found ${req.url}`));
});

app.use(generatedErrors);

module.exports = app;
