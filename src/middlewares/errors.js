exports.generatedErrors = (err, req, res, next) => {
	const statusCode = err.statusCode || 500;

	if (err.name === "MongoServerError" && err.message.includes("E11000 duplicate key")) {
		err.message = "somethin went wrong internal server error";
	}
	res.status(statusCode).json({
		message: err.message,
		stack: err.stack,
	});
};
