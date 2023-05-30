// index.js

const express = require ('express');
const multer = require ('multer');
const mongoose = require ('mongoose');

// Create an instance of Express
const app = express ();

// Configure Multer for file upload
const storage = multer.diskStorage ({
  destination: function (req, file, cb) {
    cb (null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb (null, file.originalname);
  },
});

const upload = multer ({storage});

// Connect to MongoDB
mongoose
  .connect ('mongodb+srv://dbMainProgrammer:jxpb174kXcvBuNCl@cluster0.rbbxv.mongodb.net/TeleCute', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then (() => {
    console.log ('Connected to MongoDB');
  })
  .catch (err => {
    console.error ('Error connecting to MongoDB:', err);
  });

// Define a schema and model for the file
const fileSchema = new mongoose.Schema ({
  name: String,
  src: String,
});

const File = mongoose.model ('File', fileSchema);

// Handle file upload
app.post ('/upload', upload.single ('file'), (req, res) => {
  // Create a new file object
  const newFile = new File ({
    name: req.file.originalname,
    src: req.file.path,
  });

  // Save the file object in MongoDB
  newFile
    .save ()
    .then (() => {
      res.send ('File uploaded and saved in MongoDB');
    })
    .catch (err => {
      console.error ('Error saving file in MongoDB:', err);
      res.status (500).send ('Error uploading file');
    });
});

// Start the server
const port = 3000;
app.listen (port, () => {
  console.log (`Server is running on port ${port}`);
});
