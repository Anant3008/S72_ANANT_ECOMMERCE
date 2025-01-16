const express = require('express');
const path = require('path');
const User=require('../model/userModel');
const router = express.Router();
const {upload}=require("../middleware/multer");
const ErrorHandler=require("../utils/ErrorHandler");
const fs=require("fs");
const catchAsyncErrors=require("../middleware/catchAsyncErrors");
const jwt=require("jsonwebtoken");
const sendMail=require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");

router.post("/create-user",upload.single('file'),async (req,res,next)=>{
    console.log("create user")
    console.log(req.body)
    const {name,email,password} = req.body;
    const userEmail=await User.findOne({email});
    if(userEmail){
        const filename=req.file.filename;
        const filepath=`../uploads/${filename}`;
        fs.unlinkSync(filepath);
        return next(new ErrorHandler("User already exists",400))
    }

    const filename=req.file.filename;
    const fileUrl=path.join(filename)
    const user={
        name:name,
        email:email,
        password:password,
        avatar:fileUrl
    }

    const activationToken=createActivationToken(user)
    const activationUrl=`http://localhost:8000/activation/${activationToken}`;

    try{
        await sendMail({
            email : user.email,
            subject: "Account Activation",
            message: `Please click on the link ${activationUrl}`,
        })
    }catch (error){
        console.log(error)
    }


    console.log(user)
})

const createActivationToken=(user)=>{
    return jwt.sign(user,process.env.ACTIVATION_SECRET,{expiresIn:"5m"})
}

router.post("/activation",catchAsyncErrors(async (req,res,next)=>{
    console.log("we are here")
    const {activationToken}=req.body;

    try{
        const newUser=jwt.verify(activationToken, process.env.ACTIVATION_TOKEN_SECRET);
        if(!newUser){
            return next(new ErrorHandler("Invalid Token",400))
        }
        const {name,email,password,avatar} = newUser;
        let user=await User.create({
            name,
            email,
            password,
            avatar
        })
        sendToken(user,200,res)
    }catch(error){
        return next(new ErrorHandler("Invalid Token",400))
    }

}))


module.exports = router;