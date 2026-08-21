const { pool } = require('./src/config/database');

console.log('Student Placement Tracker backend is configured.');

async function shutdown(signal) {
  console.log(`${signal} received; closing the database pool.`);
  await pool.end();
  process.exit(0);
}

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;


process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));


// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (request, response) => {
  response.json({
    message: "Student Placement Tracker API is running"
  });
});

// Get all application records
app.get("/applications", async (request, response) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM public.applications
      ORDER BY id
    `);

    response.json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve applications:", error.message);

    response.status(500).json({
      message: "Failed to retrieve applications"
    });
  }
});

// Get an application by id
app.get("/applications/:id", async (request, response) => {
  const id = Number(request.params.id);

  try {
    if (!Number.isInteger(id) || id <= 0) {
      return response.status(400).json({
        message: "Application ID must be a positive integer"
      });
    }

    const result = await pool.query(
        `SELECT * FROM public.applications
         WHERE id = $1`,
        [id]
    );

    if (result.rows.length === 0) {
      return response.status(404).json({
        message: "Application not found"
      });
    }

    response.json(result.rows[0]);
  } catch (error) {
    console.error(`Failed to retrieve application with id ${id}:`, error.message);

    response.status(500).json({
      message: `Failed to retrieve application with id ${id}`
    });
  }
});

// Post an application
// app.post("/applications", async (request, response) => {
//   try {
//     const {  } = request.body;
//
//
//     const result = await pool.query(
//         `INSERT INTO public.applications ()
//                VALUES ()
//                RETURNING *`,
//         []
//     );
//
//     response.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error("Failed to create application:", error.message);
//
//     response.status(500).json({
//       message: "Failed to create application"
//     });
//   }
// });

// Start the server only when this file is run directly.
// Tests can import the app without opening port 5000.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
