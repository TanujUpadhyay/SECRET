//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyparesr = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport =require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const FacebookStrategy= require("passport-facebook").Strategy;
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
//const bcrypt = require("bcrypt");
//const saltRounds = 10;


const app =express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyparesr.urlencoded({extended:true}));

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{ useUnifiedTopology: true , useNewUrlParser: true });
mongoose.set("useCreateIndex",true);
const userSchema= new mongoose.Schema({
    email:String,
    password:String,
    googleId:String
});

//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLINT_ID,
    clientSecret:process.env.FACEBOOK_SECRET,
    callbackURL:"http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",(req,res)=>{
    res.render("home");
});

     //             Authantication through google and face book' 

app.get("/auth/google",
    passport.authenticate("google",{scope:["profile"]})
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get("/auth/facebook",
  passport.authenticate('facebook',{scope:["profile"]})
);
app.get("/auth/facebook/secrets",
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });




app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated())
        res.render("secrets");
    else
        res.redirect("/login");
    
});


app.get("/login",(req,res)=>{
    res.render("login");
});



app.get("/logout",(req,res)=>{
    req.logOut();
    res.redirect("/");
});

// app.post("/register",(req,res)=>{
//     bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{
//         const newUser = new User({
//             email:req.body.username,
//             password:hash
//         });
    
//         newUser.save((err)=>{
            
//             if(!err)
//                 res.render("secrets");
//         });
//     });
    
// });



app.post("/register",(req,res)=>{
       User.register({username:req.body.username},req.body.password,(err,user)=>{
           if(err){
                console.log(err);
                res.redirect("/register");
           }
           else{
               passport.authenticate("local")(req,res,()=>{
                   res.redirect("/secrets");
               })
           }
                

       })
});
    



// app.post("/login",(req,res)=>{
//     const username = req.body.username;
//     const password = req.body.password;
    
//     User.findOne({email:username},(err,foundUser)=>{
//         if(!err)
//             if(foundUser)
//             {
//                 bcrypt.compare(password,foundUser.password,(err,result)=>{
//                     if(result===true)
//                         res.render("secrets");
//                      else
//                         res.send("Incorrect password!!!");
//                     });
//             }
//             else
//                 res.send("User not found");
//         else
//             res.send(err);       
//     });

// });

app.post("/login",(req,res)=>{
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,(err)=>{
        if(err)
            console.log(err);
        else{
                passport.authenticate("local")(req,res,()=>{
                   
                res.redirect("/secrets");
            });
        }
    });
});


app.listen("3000",()=>{
    console.log("Server is runing on port 3000....");
});