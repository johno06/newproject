require ('dotenv').config ();
const dbConfig = require ('./config/dbConfig');
const express = require ('express');

const app = express ();
app.use (express.json ());

app.get ('/', (req, res) => {
  res.send ('Hello World!');
});

const userRoute = require ('./routes/userRoute');
const adminRoute = require ('./routes/adminRoute');
const doctorRoute = require ('./routes/doctorsRoute');
const utilityRoute = require ('./routes/utilityRoute');

app.use ('/api/user', userRoute);
app.use ('/api/admin', adminRoute);
app.use ('/api/doctor', doctorRoute);
app.use ('/api/utility', utilityRoute);
const port = process.env.PORT || 5000;

app.listen (port, () => console.log (`Listening on port ${port}`));
