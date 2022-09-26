const express = require("express");
const router = express.Router();
const User = require("../models/userModels");
const Doctor = require("../models/doctorModel");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");
const { sendVerificationEmail, sendForgotPasswordEmail } = require("../config/sendEmail");

const emailValidation = new RegExp(
  "([!#-'*+/-9=?A-Z^-~-]+(.[!#-'*+/-9=?A-Z^-~-]+)*|\"([]!#-[^-~ \t]|(\\[\t -~]))+\")@([!#-'*+/-9=?A-Z^-~-]+(.[!#-'*+/-9=?A-Z^-~-]+)*|[[\t -Z^-~]*])"
);

const passwordValidation = new RegExp(
  "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,32})"
);

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    //finds if user already exists in database by email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(200).send({ message: "User already exists", success: false });
    }

    //checks if there is email, name, and password in the request body
    if (!name || !email || !password) {
      return res.status(200).json({ message: "Please fill in all fields", success: false });
    }

    //The RFC 5322 Format is an Internet Message Format (classic format of an email message).
    //The RFC 5322 only dictates what should be allowed - it isn't an expression itself.
    if (!emailValidation.test(email)) {
      return res.status(200).json({ message: "Please enter a valid email", success: false });
    }

    if (password !== confirmPassword) {
      return res.status(200).send({
        message: "Passwords do not match",
        success: false,
      });
    }

    if (!passwordValidation.test(password)) {
      return res.status(200).json({
        message:
          "Password must have at least 1 digit, 1 lowercase character, 1 uppercase character, special character, and atleast 8 characters in length, but not more than 20",
        success: false,
      });
    }

    // hashes the password
    const hash = await argon2.hash(password);
    req.body.password = hash;
    // creates a new user
    const newuser = new User(req.body);
    await newuser.save();

    //const token = tokenGenerator({ id: newuser.email })
    const token = jwt.sign({ email: newuser.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const link = "http://" + req.hostname + ":3000/verify?token=" + token;

    const sendMail = await sendVerificationEmail(newuser.email, link);

    if (sendMail) {
      res.status(201).send({
        message: "User created successfully. Error in sending verification link",
        success: true,
      });
    } else {
      res.status(201).send({ message: "User created successfully!", success: true });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error creating user", success: false, error });
  }
});


router.post("/forgotpassword", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!email) {
      return res.status(400).send({
        message: "Enter a valid email",
        success: false,
      });
    }

    if (!user) {
      return res.status(404).send({
        message: "User not found",
        success: false,
      });
    }

    if (!emailValidation.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email", success: false });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const link = "http://" + req.hostname + ":3000/reset?token=" + token;

    const sendMail = await sendForgotPasswordEmail(user.email, link);
    if (sendMail) {
      res.status(201).send({
        message: "Reset link not sent",
        success: true,
      });
    } else {
      res.status(201).send({
        message: "Reset link sent",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error sending reset link",
      success: false,
      error,
    });
  }
});

router.get("/verifyToken", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(404).send({
      message: "Invalid token",
      success: false,
    });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(400).send({
      message: "Invalid token",
      success: false,
      error: err,
    });
  }

  const user = await User.findOne({ email: decodedToken.email });

  // console.log(user);

  if (!user) {
    return res.status(400).send({
      message: "User not found",
      success: false,
    });
  }

  res.status(200).send({
    success: true,
    data: decodedToken.email,
  });
});

router.post("/resetpassword", async (req, res) => {
  const { email, newPassword, confirmNewPassword } = req.body;

  if (!email || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: "Please fill in all fields", success: false });
  }

  if (!emailValidation.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email", success: false });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "User not found", success: false });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).send({
      message: "Passwords do not match",
      success: false,
    });
  }
  // hashes the password
  const hash = await argon2.hash(newPassword);
  req.body.password = hash;

  const updatedData = await User.findOneAndUpdate({ email }, { $set: { password: hash } });
  if (updatedData) {
    return res.status(200).send({
      message: "Password Updated Successfully",
      success: true,
    });
  } else {
    return res.status(500).send({
      message: "Error updating password",
      success: false,
    });
  }
});

//verify-email
router.get("/verify", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(403).send({
      message: "Invalid token",
      success: false,
    });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(400).send({
      message: "Invalid token",
      success: false,
      error: err,
    });
  }

  const user = await User.findOne({ email: decodedToken.email });

  if (!user) {
    return res.status(400).send({
      message: "User not found",
      success: false,
    });
  }

  user.verified = true;

  await user.save();

  res.status(200).send({
    success: true,
    message: "Email verified",
  });
});

//authMiddleware will first verify the token and then call the next function
router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    //to know show the password in the client
    user.password = undefined;
    if (!user) {
      return res.status(200).send({
        message: "User not found",
        success: false,
      });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Error getting user", success: false, error });
  }
});

router.post("/apply-doctor-account", authMiddleware, async (req, res) => {
  try {
    const newDoctor = new Doctor({ ...req.body, status: "pending" });
    await newDoctor.save();
    const adminUser = await User.findOne({ isAdmin: true });

    const unseenNotifications = adminUser.unseenNotifications;
    //notification for admin from user to request for doctor account
    unseenNotifications.push({
      type: "new-doctor-request",
      message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for a doctor account`,
      data: {
        doctorId: newDoctor._id,
        name: newDoctor.firstName + " " + newDoctor.lastName,
      },
      onClickPath: "/admin/doctorslist",
    });
    await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });
    res.status(200).send({
      success: true,
      message: "Doctor account applied successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error applying doctor account", success: false, error });
  }
});

router.post("/mark-all-notifications-as-read", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    const unseenNotifications = user.unseenNotifications;
    const seenNotifications = user.seenNotifications;
    seenNotifications.push(...unseenNotifications);
    user.unseenNotifications = [];
    user.seenNotifications = seenNotifications;
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications marked as read",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error applying doctor account", success: false, error });
  }
});

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    user.seenNotifications = [];
    user.unseenNotifications = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications deleted",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error applying doctor account", success: false, error });
  }
});

router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" });
    res.status(200).send({
      message: "Aprroved doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.post("/book-appointment", authMiddleware, async (req, res) => {
  try {
    req.body.status = "pending";
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    req.body.time = moment(req.body.time, "HH:mm").toISOString();
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    //pushing notification to doctor based on his userid
    const user = await User.findOne({ _id: req.body.doctorInfo.userId });
    user.unseenNotifications.push({
      type: "new-appointment-request",
      message: `A new appointment request has been made by ${req.body.userInfo.user.name}`,
      onClickPath: "/doctor/appointments",
    });
    await user.save();
    res.status(200).send({
      message: "Appointment booked successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

router.post("/check-booking-availability", authMiddleware, async (req, res) => {
  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const fromTime = moment(req.body.time, "HH:mm").subtract(1, "hours").toISOString();
    const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();
    const doctorId = req.body.doctorId;
    const appointments = await Appointment.find({
      doctorId,
      date,
      time: { $gte: fromTime, $lte: toTime },
    });
    if (appointments.length > 0) {
      return res.status(200).send({
        message: "Appointments not available",
        success: false,
      });
    } else {
      return res.status(200).send({
        message: "Appointments available",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error booking appointment",
      success: false,
      error,
    });
  }
});

router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.body.userId });
    res.status(200).send({
      message: "Appointments fetched successfully",
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error fetching appointments",
      success: false,
      error,
    });
  }
});

router.post("/get-patient-info-by-user-id", authMiddleware, async (req, res) => {
  try {
    // const user = await User.findOne({ userId: req.body.userId });
    const user = await User.findById({ _id: req.body.userId });
    res.status(200).send({
      success: true,
      message: "Patient info fetched successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).send({ message: "Error getting patient info", success: false, error });
  }
});

router.post("/update-patient-profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ _id: req.body.userId }, req.body);

    res.status(200).send({
      success: true,
      message: "Updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).send({ message: "Error updating patient profile", success: false, error });
  }
});


module.exports = router;
