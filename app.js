const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const errorController = require("./controllers/error");
// const User = require("./models/user");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// app.use((req, res, next) => {
//   User.findById("664c6c6eb6e6ec45482a7aa6")
//     .then((user) => {
//       // req.user = user;
//       /*The user as I am storing it here, is just an object with the properties, all the methods of our user 
//       model will not be in there because the user I am getting here is data I'm getting out of the database, and the methods aren't stored over there. Hence to have a real user object that I can interact with, I should create a new user here!*/
//       req.user = new User(user.name, user.email, user.cart, user._id);
//       next();
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// });

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

mongoose
  .connect(
    "mongodb+srv://ssugam10:sugam112@cluster0.eajhwvj.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then((result) => {
    app.listen(3000);
    console.log('Connected to database and server running on port 3000!');
  })
  .catch((err) => console.log(err));
