const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [4, "Password should be greater than 4 characters"], // Fixed typo: changed maxLength to minLength
        select: false,
    },
    phoneNumber: {
        type: Number
    },
    addresses: {
        country: {
            type: String
        },
        city: {
            type: String
        },
        address1: {
            type: String
        },
        address2:{
            type: String
        },
        zipcode: {
            type: Number
        },
        addresstype: {
            type: String
        }
    },
    role: {
        type: String,
        default: "user"
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    createdAt: {
        type: Date, // Changed DataTransfer to Date
        default: Date.now
    },
    cart:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:true,
                min:[1,"Quantity cannot be less than 1"],
                default:1
            },
            quantity:{
                type:Number,
                required:true
            }
        }
    ],
    resetPasswordToken: String,
    resetPasswordTime: Date
});

userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { // Fixed typo: changed this_id to this._id
        expiresIn: process.env.JWT_EXPIRES_TIME,
    });
}

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model("User", userSchema);
