//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyparesr = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;


const app =express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyparesr.urlencoded({extended:true}));


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});

const userSchema= new mongoose.Schema({
    email:String,
    password:String
});

//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

const User = new mongoose.model("User",userSchema);


app.get("/",(req,res)=>{
    res.render("home");
});


app.get("/login",(req,res)=>{
    res.render("login");
});


app.get("/register",(req,res)=>{
    res.render("register");
});


app.post("/register",(req,res)=>{
    bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{
        const newUser = new User({
            email:req.body.username,
            password:hash
        });
    
        newUser.save((err)=>{
            
            if(!err)
                res.render("secrets");
        });
    });
    
});


app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    
    User.findOne({email:username},(err,foundUser)=>{
        if(!err)
            if(foundUser)
            {
                bcrypt.compare(password,foundUser.password,(err,result)=>{
                    if(result===true)
                        res.render("secrets");
                     else
                        res.send("Incorrect password!!!");
                    });
            }
            else
                res.send("User not found");
        else
            res.send(err);       
    });

});


app.listen("3000",()=>{
    console.log("Server is runing on port 3000....");
});