/////// app.js

const express = require("express");
const bcrypt=require("bcryptjs")
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongoDb =
  "mongodb+srv://admin:admin@cluster0.twvvaoe.mongodb.net/Users?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
  }),
);

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      bcrypt.compare(password,user.password,(err,res)=>{
        if(res)
          return done(null,user);
        else{
            return done(null,false,{message:"Incorrrect password"})
          }
      })
    } catch (err) {
      return done(err);
    }
  }),
);
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});
app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.post("/sign-up", async (req, res, next) => {
  try {
  hashPassword=await bcrypt.hash(req.body.password,10);
    console.log(hashPassword)
    const user = new User({
      username: req.body.username,
      password: hashPassword,
    });

    const result = await user.save();
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});
app.get("/log-in", (req, res) => res.render("log-in"));

app.post(
  "/log-in",

  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  }),
);
app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.listen(3000, () => console.log("app listening on port 3000!"));
