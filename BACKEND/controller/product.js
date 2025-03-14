const express = require("express");
const Product = require("../model/product.js");
const User = require("../model/modal");
const router = express.Router();
const { pupload } = require("../multer");
const path=require('path')
const mongoose=require('mongoose')

const validateProductData = (data) => {
    const errors = [];

    // Validate name
    if (!data.name.trim()) {
        errors.push("Name is required");
    }
    if (!data.description) {
        errors.push("Description is required");
    }
    if (!data.category) {
        errors.push("Category is required");
    }
    if (!data.price || isNaN(data.price) || data.price <= 0) {
        errors.push("Proper price is required");
    }
    if (!data.stock || isNaN(data.stock) || data.stock <= 0) {
        errors.push("Proper stock is required");
    }
    if (!data.email) {
        errors.push("Email is required");
    }

    return errors;
};

// @route POST /api/products
router.post("/create-product", pupload.array("images"), async (req, res) => {
    const { name, description, category, price, stock, email, tags } = req.body;
    const images = req.files ? req.files.map((file) => {
        return  `/products/${file.filename}`
    }) : [];

    const validationErrors = validateProductData({ name, description, category, price, stock, email, tags });
    if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
    }

    if (images.length === 0) {
        return res.status(400).json({ message: "No images are uploaded" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Proceed to create the product
        const newProduct = new Product({
            name,
            description,
            category,
            price,
            stock,
            email,
            tags,
            images,
            user: user._id  // Assuming a reference to the user in the product schema
        });

        await newProduct.save();
        return res.status(201).json({ message: "Product created successfully", product: newProduct });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});


router.get('/get-products',async(req,res)=>{
    try {
        const products=await Product.find()
        const productWithFullImgURL=products.map(product=>{
            if(product.images && product.images.length > 0){
                product.images=product.images.map(imagePath=>{
                    return imagePath
                })
            return product
            }
        })
                res.status(200).json({product: productWithFullImgURL})
    }catch(e){
        console.error('error: ',e)
        res.status(500).json({error: 'Server error.'})
    }
})

router.get('/my-products', async (req,res) => {
    const {email} = req.query;
    try{
        const products=await Product.find({email});
        res.status(200).json({products: products});
    }
    catch(err) {
        console.error('Server error: ',err);
        res.status(500).json({error: 'Server error. Could not fetch products.'})
    }
});


router.get('/product/:id',async (req,res)=>{
    const {id}=req.params;
    try{
        const product=await Product.findById(id)
        if(!product){
            return res.status(400).json({error: "Product not found"})
        }
        res.status(200).json({product})
    }catch(err){
        console.log('Server Error',err.message)
        res.status(500).json({error:'Sever error: Could not fetch data'})
    }
})


router.put('/update-product/:id',pupload.array('images',10),async (req, res) => {
    const {id}=req.params
    const { name, description, category, price, stock, email, tags } = req.body;

    try{
        const existingProduct=await Product.findById(id)
        if(!existingProduct){
            return res.status(400).json({error: "Product not found"})
        }

        let updatedImages=existingProduct.images
        if(req.files && req.files.length>10){
            updatedImages=req.files.map((file)=>{
                return `/products/${path.basename(file.path)}`
            })
        }

        const validationErrors = validateProductData({ name, description, category, price, stock, email, tags });


        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }

        existingProduct.name=name
        existingProduct.description=description
        existingProduct.category=category
        existingProduct.price=price
        existingProduct.tags=tags
        existingProduct.email=email
        existingProduct.stock=stock
        existingProduct.images=updatedImages

        await existingProduct.save()
        res.status(200).json({message: "Updated successfully"})
        console.log("Updated successfully")

    }catch (e) {
        console.log(e.message)
    }
})

router.delete('/delete-product/:id',async (req,res)=>{
    const {id}=req.params;

    try{
        const existingProduct=await Product.findByIdAndDelete(id)
        if(!existingProduct){
            return res.status(404).json({error: "Product not found"})
        }

        await existingProduct.deleteOne()
        res.status(200).json({message: "Product deleted successfully"})
    }catch(e){
        console.log(e.message)
    }
})

router.post('/cart',async (req,res)=>{
    try{
        const {userId,productId,quantity}=req.body;
        const email=userId

        if(!email){
            return res.status(400).json({message: "Email is required"})
        }

        if(!mongoose.Types.ObjectId.isValid(productId)){
            return res.status(400).json({message: "Invalid productId"})
        }

        if(!quantity || quantity<1){
            return res.status(400).json({message: "Quantity should be more than 1"})
        }

        const user=await User.findOne({email})
        if(!user){
            return res.status(400).json({message: "User not found"})
        }

        const product=await Product.findById(productId)
        if(!product){
            return res.status(404).json({message: "Product not Found"})
        }

        const cartItemIndex=user.cart.findIndex(
            (item)=>item.productId.toString()===productId
        )

        if(cartItemIndex>-1){
            user.cart[cartItemIndex].quantity+=quantity
        }else{
            user.cart.push({productId,quantity})
        }

        await user.save()

        res.status(200).json({message: "cart updated successfully"})

    }catch(err){
        res.status(500)
        console.error(err.message)
    }
})

router.get('/cartproducts',async (req,res)=>{
    try{
        const {email}=req.query

        if(!email){
            return res.status(400).json({error: "Email query parameter is required"})
        }

        const user=await User.findOne({email}).populate({
            path: 'cart.productId',
            model: 'Product'
        })

        if(!user){
            return res.status(404).json({error: 'User not found'})
        }

        res.status(200).json({
            message: 'Cart retrieved successfully',
            cart:user.cart
        })
    }catch(err){
        console.error(err)
        res.status(500)
    }
})


router.put('/cartproduct/quantity',async (req,res)=>{
    const {email,productId,quantity}=req.body;
    console.log("Updated cart product")

    if(!email || !productId || quantity===undefined){
        return res.status(400).json({error: "Email and other stuff required"})
    }

    try{
        const user=await User.findOne({email})

        if(!user){
            return res.status(404).json({error: "User not found"})
        }
        const cartProduct=await User.findOne(item=>item.productId.toString===productId)

        if(!cartProduct){
            return res.status(404).json({error: "Product not found"})
        }

        cartProduct.quantity=quantity
        await User.save()

        res.status(200).json({
            message: "Suceessssss"
        })
    }catch(err){
        console.error(err)
        res.status(500)
    }


})

module.exports = router;