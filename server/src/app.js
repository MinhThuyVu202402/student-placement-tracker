const express = require('express');
const cors = require('cors');
const applicationsRouter = require('./routes/applications');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (request, response) => {
  response.json({
    message: 'Student Placement Tracker API is running'
  });
});

app.use('/applications', applicationsRouter);

module.exports = app;
