const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctorModel");
const authMiddleware = require("../middleware/authMiddleware");
const Appointment = require("../models/appointmentModel");
const User = require("../models/userModels");

router.post("/get-doctor-info-by-user-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.body.userId });
    res.status(200).send({
      success: true,
      message: "Doctor info fetched successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).send({ message: "Error getting doctor info", success: false, error });
  }
});

router.post("/update-doctor-profile", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate({ userId: req.body.userId }, req.body);

    res.status(200).send({
      success: true,
      message: "Updated successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).send({ message: "Error updating doctor profile", success: false, error });
  }
});

router.post("/get-doctor-info-by-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.body.doctorId });
    res.status(200).send({
      success: true,
      message: "Doctor info fetched successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).send({ message: "Error getting doctor info", success: false, error });
  }
});

//////////////////////////////////////////////////////////////////////

router.get ('/get-doctor-info-by-its-id', async (req, res) => {
  try {
    const doctor = await Doctor.findOne ({userId: req.body.userId});
    res.status (200).send ({
      success: true,
      message: 'Doctor info fetched successfully',
      data: doctor,
    });
  } catch (error) {
    res
      .status (500)
      .send ({message: 'Error getting doctor info', success: false, error});
  }
});


router.patch ('/checkDevice/:id', async (req, res, next) => {
  try {
    // const {userId} = req.body;
    // const user = await User.findById({userId});

    const id = req.params.id;
    const updates = req.body;
    const options = {new: true};
    const result = await Doctor.findByIdAndUpdate (id, updates, options);
    res.send (result);
  } catch (error) {
    console.log (error.message);
    // res.json({message:'email is already used'})
  }
});


router.patch ('/updateDoctorProfile/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const options = {new: true};

    const result = await Doctor.findByIdAndUpdate (id, updates, options);
    res.send (result);
  } catch (error) {
    console.log (error.message);
    // res.json({message:'email is already used'})
  }});







////////////////////////////////////////////////////////////////////


router.get("/get-appointments-by-doctor-id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.body.userId });
    const appointments = await Appointment.find({doctorId: doctor._id});
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

router.post("/change-appointment-status", authMiddleware, async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      status,
    });
    //Find user first
    const user = await User.findOne({ _id: appointment.userId });
    //Fetch unseen notifications
    const unseenNotifications = user.unseenNotifications;
    //Push notifications to user
    unseenNotifications.push({
      type: "appointment-status-changed",
      message: `Your appointment has been ${status}`,
      onClickPath: "/appointments",
    });
    await user.save();

    res.status(200).send({
      message: "Appointment status updated successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error changing appointment status", success: false, error });
  }
});

module.exports = router;
