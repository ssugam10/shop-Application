const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const errorController = require("./controllers/error");
const mongoConnect = require("./util/database").mongoConnect;
const User = require("./models/user");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  User.findById("65b9e8dcd844d3094b1ebae9")
    .then(user => {
      // req.user = user;
      /*The user as I am storing it here, is just an object with the properties, all the methods of our user 
      model will not be in there because the user I am getting here is data I'm getting out of the database, and the methods aren't stored over there. Hence to have a real user object that I can interact with, I should create a new user here!*/
      req.user = new User(user.name, user.email, user.cart, user._id);
      next();
    })
    .catch((err) => {
      console.log(err);
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

mongoConnect(() => {
  app.listen(3000, () => {
    console.log('Server running on port 3000!');
  });
});
