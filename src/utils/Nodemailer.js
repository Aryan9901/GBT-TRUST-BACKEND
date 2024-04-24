const nodemailer = require("nodemailer");
const { ApiError } = require("./ApiError.js");

const transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    post: 465,
    auth:{
        user: process.env.MAIL_EMAIL_ADDRESS,
        pass:process.env.MAIL_PASSWORD,
    },
});

exports.sendRegistrationConfirmation = (req, res, next) =>{
        console.log(req.user.email)
        const mailOptions ={
            from: "Ganpati Balaji Trust",
            to: req.user.email,
            subject: "Payment Successful Confirmation",
            html:
            `
            <h1>Welcome to GBT Family!</h1><br>
            <p>Dear [User],</p><br>
            <p>Congratulations! You have successfully registered with GBT Family.</p><br>
            <p>We are thrilled to have you as a part of our community.</p><br>
            <p>Feel free to explore our platform and engage with other members.</p><br>
            <p>Thank you for joining us!</p><br>
            <p>Best regards,<br>GBT Family Team</p><br>
            `
            ,
        };

        transport.sendMail(mailOptions,(err,info)=>{
            if(err){
                return next (new ApiError(err,500));
            } else{
                console.log(info);
                
                return res.status(200).json({
                    message: "Confirmation mail sent successfully",
                    url,
                })
            }
        });
}

exports.sendReferralEmail = (req, res, next) => {
    const { email, firstName,lastName, referralCode } = req.body;
    console.log(email, firstName,lastName, referralCode);
    const mailOptions = {
        from: "Ganpati Balaji Trust",
        to: email,
        subject: "Invite to Join GBT Family!",
        html: `
            <h1>Join GBT Family Today!</h1>
            <p>Hello, ,</p>
            <p>You've been invited to join GBT Family by your friend ${firstName} ${lastName}.</p>
            <p>Use the referral code <strong>${referralCode}</strong> during registration to unlock special benefits.</p>
            <p>Join us now and become a part of our community!</p>
            <p>Best regards,<br>GBT Family Team</p>
        `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            return next(new ErrorHandler(err, 500));
        } else {
            console.log(info);
            return res.status(200).json({
                message: "Referral email sent successfully",
            });
        }
    });
};