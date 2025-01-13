const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")

const userSchema=new mongoose.Schema({
    name:{
        type: String,
        required: [true,"Please enter your name"],
        
    },
    email:{
        type: String,
        required: [true,"Please enter your email"],
        
    },
    password:{
        type:String,
        required: [true,"Please enter your password"],
        maxLength: [4,"Password should be greater than 4 characters"],
        select: false,
    },
    phoneNumber:{
        type:Number
    },
    address:{
        country:{
            type:String
        },
        city:{
            type:String
        },
        address1:{
            type:String
        },
        zipcode:{
            type:Number
        },
        addressType:{
            type:String
        }
    },
    role:{
        type:String,
        default:"user"
    },
    avatar:{
        public_id:{
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    },
    createdAt:{
        type:DataTransfer,
        default:Date.now()
    },
    resetPasswordToken: String,
    resetPasswordTime: Date
})

userSchema.pre('save',async function(next){
    if(!this.isModified("password")){
        next()
    }
    this.password=await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.getJwtToken=function(){
    return jwt.sign({id:this_id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_TIME,
    })
}

userSchema.methods.comparePassword=async function (enteredPassword) {
        return await bcrypt.compare(enteredPassword,this.password)
}

module.exports=mongoose.model("User",userSchema)