const mongoose = require("mongoose");

const { Schema } = mongoose;

// car Schema
const referralSchema = new Schema(
    {
        totalClicks: {
            type: Number,
            default: 0,
        },
        successfulConversion: {
            type: Number,
            default: 0,
        },
        referralCode: {
            type: String,
            unique: true,
        },
        referrer: {
            type: Schema.Types.ObjectId,
            ref: "user",
        },
        level: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true }
);

const Referral = mongoose.model("referral", referralSchema);
module.exports = Referral;


