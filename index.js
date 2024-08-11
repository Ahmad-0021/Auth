const express = require("express");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { userModel, joiValidation } = require("./models/user.model");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).redirect("/signup");
    }

    const decoded = jwt.verify(token, "shhh");
    const user = await userModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).redirect("/signup");
    }

    // Set the user on the request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).send("Unauthorized");
  }
};

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/signup", (req, res) => {
  res.render("signup");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/signUp", async (req, res) => {
  const { name, email, password } = req.body;
  const userData = { name, email, password };
  const validatedData = joiValidation(userData);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(validatedData.password, salt);

  // Create a new user with the hashed password
  const user = new userModel({
    name: validatedData.name,
    email: validatedData.email,
    password: hashedPassword,
  });

  await user.save();

  // Generate a JSON Web Token (JWT) for the user
  const token = jwt.sign({ userId: user._id }, "shhh", {
    expiresIn: "1h",
  });
  res.cookie("token", token);
  res.redirect("/");
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = { email, password };
    const validatedData = joiValidation(userData);

    // Find the user by email
    const user = await userModel.findOne({ email: validatedData.email });
    if (!user) {
      return res
        .status(401)
        .render("login", { error: "Invalid email or password" });
    }

    // Compare the provided password with the hashed password
    const isValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isValid) {
      return res
        .status(401)
        .render("login", { error: "Invalid email or password" });
    }

    // Generate a JSON Web Token (JWT) for the user
    const token = jwt.sign({ userId: user._id }, "shhh", {
      expiresIn: "1h",
    });

    // Set the token as a cookie
    res.cookie("token", token);

    res.redirect("/");
  } catch (error) {
    res.status(400).render("login", { error: error.message });
  }
});
app.get("/read", isLoggedIn, (req, res) => {
  res.render("read");
});
app.listen(3000);
