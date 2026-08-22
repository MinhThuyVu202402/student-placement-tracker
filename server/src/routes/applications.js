const express = require('express');
const { pool } = require('../config/database');
const {
    editableApplicationFields,
    isValidDate,
    isValidRequiredFields
} = require('../validation/application');

const router = express.Router();

// Get all application records
router.get("/", async (request, response) => {
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
router.get("/:id", async (request, response) => {
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
router.post("/", async (request, response) => {
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

        const requiredFieldsError = isValidRequiredFields(company, role, status);

        if (requiredFieldsError) {
            return response.status(400).json({
                message: requiredFieldsError
            });
        }

        const cleanedCompany = company.trim();
        const cleanedRole = role.trim();

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

// Update selected fields on an existing application
router.patch("/:id", async (request, response) => {
    try {
        const id = Number(request.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return response.status(400).json({
                message: "Application ID must be a positive integer"
            });
        }

        const requestedFields = Object.keys(request.body);

        if (requestedFields.length === 0) {
            return response.status(400).json({
                message: "At least one field is required"
            });
        }

        const invalidFields = requestedFields.filter(
            (field) => !editableApplicationFields.includes(field)
        );

        if (invalidFields.length > 0) {
            return response.status(400).json({
                message: `Fields cannot be updated: ${invalidFields.join(", ")}`
            });
        }

        const existingResult = await pool.query(
            `SELECT *
         FROM public.applications
         WHERE id = $1`,
            [id]
        );

        if (existingResult.rows.length === 0) {
            return response.status(404).json({
                message: "Application not found"
            });
        }

        const updatedApplication = { ...existingResult.rows[0] };

        for (const field of requestedFields) {
            updatedApplication[field] = request.body[field];
        }

        const {
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
        } = updatedApplication;

        const requiredFieldsError = isValidRequiredFields(company, role, status);

        if (requiredFieldsError) {
            return response.status(400).json({
                message: requiredFieldsError
            });
        }

        const cleanedCompany = company.trim();
        const cleanedRole = role.trim();

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
            `UPDATE public.applications
         SET company = $1,
             role = $2,
             location = $3,
             job_url = $4,
             status = $5,
             deadline_date = $6,
             applied_date = $7,
             next_action_text = $8,
             next_action_date = $9,
             notes = $10,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $11
         RETURNING *`,
            [
                cleanedCompany,
                cleanedRole,
                location,
                job_url,
                status,
                deadline_date,
                applied_date,
                next_action_text,
                next_action_date,
                notes,
                id
            ]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Application not found"
            });
        }

        response.json(result.rows[0]);
    } catch (error) {
        console.error("Failed to update application:", error.message);

        response.status(500).json({
            message: "Failed to update application"
        });
    }
});

// Delete an application
router.delete("/:id", async (request, response) => {
    try {
        const id = Number(request.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return response.status(400).json({
                message: "Application ID must be a positive integer"
            });
        }

        const result = await pool.query(
        `DELETE FROM public.applications
         WHERE id = $1
         RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Application not found"
            });
        }

        response.json({
            message: "Application deleted successfully",
            deletedApplication: result.rows[0]
        });

    } catch (error) {
        console.error("Failed to delete application:", error.message);

        response.status(500).json({
            message: "Failed to delete application"
        });
    }
});

module.exports = router;
