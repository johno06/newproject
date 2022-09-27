const express = require("express");
const router = express.Router();
const Message = require("../models/msgSchema");
const User = require("../models/userModels");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");


router.post("/message", async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const message = req.body.message;

    // creates a new user
    const sendMsg = new Message({
      name : name,
      email: email,
      message: message,
    });

    await sendMsg.save();
    res.status(200).json("Message sent");

  } catch (error) {
    console.log(error);
     res.status(400).send({ message: "Message not sent", success: false});
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!email || !password) {
      return res.status(200).json({ message: "Please fill in all fields", success: false });
    }

    if (!user) {
      return res.status(200).send({
        message: "User not found",
        success: false,
      });
    }

    if (user.verified === "false") {
      return res.status(200).send({
        message: "Email not verified",
        success: false,
      });
    }

    const valid = await argon2.verify(user.password, req.body.password);
    if (!valid) {
      return res.status(200).send({
        message: "Invalid password",
        success: false,
      });
    } else if (user.verified === false) {
      return res.status(200).send({
        message: "Email not verified",
        success: false,
      });
    } else {
      const token = User(
        { id: user._id, email: user.email, name: user.name, surname: user.surname, phone: user.phone, birthdate: user.birthdate, address: user.address, gender: user.gender, isDoctor: user.isDoctor, verified: user.verified });
      // jwt.sign(
      //   { id: user._id, email: user.email, name: user.name, verified: user.verified },
      //   process.env.JWT_SECRET,
      //   {
      //     expiresIn: "7d",
      //   }
        res.status(200).send({
        message: "Login successful",
        success: true,
        data: token,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error logging in",
      success: false,
      error,
    });
  }
});



module.exports = router;
