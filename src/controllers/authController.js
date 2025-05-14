import userModel from "./../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User Already  exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({ name, email, password: hashedPassword });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // sending welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcom to Traveling Web site",
      text: `Welcom to Traveling Web site. Your account  has  been created with email id:${email} `
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid  email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid  password" });
    }

    const token = jwt.sign({ id: user._id,email:user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ success: true,token:token,email:user.email });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
    });

    return res.json({ success: true, message: "Logged Out" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// Send Verifycation Otp to  the User's Email
export const sendVerifyOtp = async (req,res)=>{
  try{
    const {userId} = req.body;

    const user = await userModel.findById(userId);
    if(user.isAccountVerified){
      return res.status(400).json({success:false,message:"Accaunt already verified"})
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))

    user.verifyOtp = otp;

    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save()

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Welcom to Traveling Web site",
      text: `Your otp is  ${otp}. Verify your account using this OTP.`
    };

    await transporter.sendMail(mailOptions)

      res.json({success:true,message:"Verification OTP Sent to Email"})

  }catch(err){
    res.json({success:false,message:err.message})
  }
}

// Verify the Email using the OTP 
export const verifyEmail = async(req,res)=>{


  const {userId,otp} = req.body;

  if(!userId || !otp){
   return res.status(400).json({ success: false, message: "Missing details" });
     
  }
  try{
    const user = await userModel.findById(userId);

    if(!user){
       return res.status(400).json({ success: false, message: "User not found" });
    }

    if(user.verifyOtp === '' || user.verifyOtp !== otp){
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if(user.verifyOtpExpireAt < Date.now()){
      return res.status(400).json({ success: false, message: "OTP Expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0

    await user.save()

    return res.json({success:true,message:"Email verified successfully"})


  }catch(err){

    return res.json({success:false,message:err.message})
  }
}




// Check is user is authenticated
export const isAuthenticated = async(req,res)=>{
  try{
    return res.json({success:true})  
  }catch(err){
    res.json({success:false,message:err.message})
  }
}


// Send Password reset OTP
export const sendResetOtp = async(req,res)=>{
    const {email} = req.body;

    if(!email){
      return res.status(400).json({success:false,message:"Email is require"})
    }
    try{

      const user = await userModel.findOne({email})

      if(!user){
        return res.status(400).json({success:false,message:"User not found"})
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000))

      user.resetOtp = otp;
      user.resetOtpExpireAt = Date.now() + 15 * 60  * 1000;
  
      
    await user.save()

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Pasword Reset OTP",
      text: `Your otp for resetting your password is   ${otp}. Use this OTP tp proceed with reseting your password.`
    };

    await transporter.sendMail(mailOptions)

    return res.json({success:true,message:'OTP sent to your email'})


    }catch(err){
      res.json({success:false,message:err.message})
    }
}


// Reset User Password
export const resetPassword = async(req,res)=>{
  const {email,otp,newPassword} = req.body;

  const missingFields = [];

  if (!email) missingFields.push("Email is required");
  if (!otp) missingFields.push("OTP is required");
  if (!newPassword) missingFields.push("New password is required");

  if (missingFields.length > 0) {
    return res.status(400).json({ success: false, message: missingFields });
  }


  try{

    const user = await userModel.findOne({email});

    if(!user){
      return res.status(400).json({success:false,message:'User not found'});
    }

    if(user.resetOtp === "" || user.resetOtp !== otp){
      return res.status(400).json({success:false,message:'Invalid OTP'});
    }

    if(user.resetOtpExpireAt < Date.now()){
      return res.status(400).json({success:false,message:'OTP Expired'});
    }

    const hashedPassword = await bcrypt.hash(newPassword,10);

    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;

    await user.save()
    return res.json({success:true,message:"Password has been reset successfully"})
  }catch(err){
    res.json({success:false,message:err.message})
  }
}