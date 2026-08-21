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

const allowedStatuses = [
  'saved',
  'preparing',
  'applied',
  'interview',
  'rejected',
  'offer',
  'accepted',
  'withdrawn',
  'closed'
];

function isValidDate(value) {
  if (typeof value !== "string") {
    return false;
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value
      .split("-")
      .map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
  );
}

// Post an application
app.post("/applications", async (request, response) => {
  try {
    const {
      company,
      role,
      location = null,
      job_url = null,
      status = "saved",
      deadline_date = null,
      applied_date = null,
      next_action_text = null,
      next_action_date = null,
      notes = null } = request.body;

    if (typeof company !== "string" || company.trim() === "") {
      return response.status(400).json({
        message: "Company name is required"
      });
    }

    if (typeof role !== "string" || role.trim() === "") {
      return response.status(400).json({
        message: "Role is required"
      });
    }

    const cleanedCompany = company.trim();
    const cleanedRole = role.trim();

    if (typeof status !== "string" || !allowedStatuses.includes(status)) {
      return response.status(400).json({
        message: "Status is invalid"
      });
    }

    if (applied_date !== null) {
      if (!isValidDate(applied_date)) {
        return response.status(400).json({
          message: "Applied date must be a valid date in YYYY-MM-DD format"
        });
      }

      const today = new Date().toISOString().slice(0, 10);

      if (applied_date > today) {
        return response.status(400).json({
          message: "Applied date cannot be in the future"
        });
      }

      if (["saved", "preparing"].includes(status)) {
        return response.status(400).json({
          message: "Applied date is not allowed for saved or preparing applications"
        });
      }
    }

    if (deadline_date !== null && !isValidDate(deadline_date)) {
      return response.status(400).json({
        message: "Deadline date must be a valid date in YYYY-MM-DD format"
      });
    }

    if (next_action_date !== null && !isValidDate(next_action_date)) {
      return response.status(400).json({
        message: "Next action date must be a valid date in YYYY-MM-DD format"
      });
    }

    const result = await pool.query(
          `INSERT INTO public.applications (
            company,
            role,
            location,
            job_url,
            status,
            deadline_date,
            applied_date,
            next_action_text,
            next_action_date,
            notes
        )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
        [cleanedCompany, cleanedRole, location, job_url, status, deadline_date, applied_date, next_action_text, next_action_date, notes]
    );

    response.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to create application:", error.message);

    response.status(500).json({
      message: "Failed to create application"
    });
  }
});

// Start the server only when this file is run directly.
// Tests can import the app without opening port 5000.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
