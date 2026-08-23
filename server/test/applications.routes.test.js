process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/placement_tracker_test';
process.env.DATABASE_SSL = 'false';

const { after, before, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");

const { pool } = require('../src/config/database');
const app = require('../src/app');

let server;
let apiUrl;
const originalQuery = pool.query;

before(async () => {
    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    apiUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(() => {
    pool.query = async () => {
        throw new Error("Unexpected database query in test");
    };
});

after(async () => {
    pool.query = originalQuery;
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

test("GET / reports that the API is running", async () => {
    const response = await fetch(`${apiUrl}/`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, 'Student Placement Tracker API is running');
});

test("GET /applications returns all applications", async () => {
    const applications = [
        {
            "id": "1",
            "company": "Canva",
            "role": "Software Engineering Intern",
            "location": "Sydney / Hybrid",
            "job_url": "https://example.com/job",
            "status": "saved",
            "deadline_date": "2026-09-15",
            "applied_date": null,
            "next_action_text": "Prepare application",
            "next_action_date": "2026-09-10",
            "notes": "Found through university portal",
            "created_at": "2026-08-21T06:13:24.631Z",
            "updated_at": "2026-08-21T06:13:24.631Z"
        },
        {
            "id": "2",
            "company": "Amazon",
            "role": "Data Engineering Intern",
            "location": "US / Remote",
            "job_url": "https://example.com/job",
            "status": "applied",
            "deadline_date": "2026-08-20",
            "applied_date": "2026-08-19",
            "next_action_text": "Wait for the response",
            "next_action_date": null,
            "notes": "Found through website",
            "created_at": "2026-08-22T06:46:16.772Z",
            "updated_at": "2026-08-22T06:46:16.772Z"
        }
    ];

    pool.query = async (sql) => {
        assert.match(sql, /SELECT\s+\*\s+FROM\s+public\.applications/);
        return { rows: applications };
    };

    const response = await fetch(`${apiUrl}/applications`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, applications);
});

test("GET /applications/:id returns an existing application", async () => {
    const application = {
        "id": "1",
        "company": "Canva",
        "role": "Software Engineering Intern",
        "location": "Sydney / Hybrid",
        "job_url": "https://example.com/job",
        "status": "saved",
        "deadline_date": "2026-09-15",
        "applied_date": null,
        "next_action_text": "Prepare application",
        "next_action_date": "2026-09-10",
        "notes": "Found through university portal"
    };

    pool.query = async (sql, values) => {
        assert.match(
            sql,
            /SELECT\s+\*\s+FROM\s+public\.applications\s+WHERE\s+id\s+=\s+\$1/
        );
        assert.deepEqual(values, [1]);

        return { rows: [application] };
    };

    const response = await fetch(`${apiUrl}/applications/1`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, application);
});

test("GET /applications/:id returns 404 when the application does not exist", async () => {
    pool.query = async () => ({ rows: [] });

    const response = await fetch(`${apiUrl}/applications/999`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.message, "Application not found");
});

test("GET /applications/:id rejects an invalid ID", async () => {
    const response = await fetch(`${apiUrl}/applications/hello`);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "Application ID must be a positive integer");
});

test("POST /applications creates an application", async () => {
    const requestBody = {
        "company": "  Canva  ",
        "role": "  Software Engineering Intern  ",
        "location": "Sydney / Hybrid",
        "job_url": "https://example.com/job",
        "status": "saved",
        "deadline_date": "2026-09-15",
        "applied_date": null,
        "next_action_text": "Prepare application",
        "next_action_date": "2026-09-10",
        "notes": "Found through university portal"
    };
    const createdApplication = {
        "id": "1",
        ...requestBody,
        "company": "Canva",
        "role": "Software Engineering Intern"
    };

    pool.query = async (sql, values) => {
        assert.match(sql, /INSERT\s+INTO\s+public\.applications/);
        assert.deepEqual(values, [
            "Canva",
            "Software Engineering Intern",
            "Sydney / Hybrid",
            "https://example.com/job",
            "saved",
            "2026-09-15",
            null,
            "Prepare application",
            "2026-09-10",
            "Found through university portal"
        ]);

        return { rows: [createdApplication] };
    };

    const response = await fetch(`${apiUrl}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(body, createdApplication);
});

test("PATCH /applications/:id updates selected application fields", async () => {
    const existingApplication = {
        "id": "1",
        "company": "Amazon",
        "role": "Data Engineering Intern",
        "location": "US / Remote",
        "job_url": "https://example.com/job",
        "status": "applied",
        "deadline_date": "2026-08-20",
        "applied_date": "2026-08-19",
        "next_action_text": "Wait for the response",
        "next_action_date": null,
        "notes": "Found through website"
    };
    const updatedFields = {
        "company": "AWS",
        "role": "AI Engineering Intern",
        "next_action_text": "Prepare STAR examples",
        "next_action_date": "2026-08-28"
    };
    const updatedApplication = {
        ...existingApplication,
        ...updatedFields
    };
    let queryCount = 0;

    pool.query = async (sql, values) => {
        queryCount += 1;

        if (/SELECT\s+\*/.test(sql)) {
            assert.deepEqual(values, [1]);
            return { rows: [existingApplication] };
        }

        if (/UPDATE\s+public\.applications/.test(sql)) {
            assert.deepEqual(values, [
                "AWS",
                "AI Engineering Intern",
                "US / Remote",
                "https://example.com/job",
                "applied",
                "2026-08-20",
                "2026-08-19",
                "Prepare STAR examples",
                "2026-08-28",
                "Found through website",
                1
            ]);

            return { rows: [updatedApplication] };
        }

        throw new Error(`Unexpected SQL query: ${sql}`);
    };

    const response = await fetch(`${apiUrl}/applications/1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, updatedApplication);
    assert.equal(queryCount, 2);
});

test("DELETE /applications/:id deletes an application", async () => {
    const deletedApplication = {
        "id": "1",
        "company": "AWS",
        "role": "AI Engineering Intern",
        "location": "US / Remote",
        "job_url": "https://example.com/job",
        "status": "applied",
        "deadline_date": "2026-08-20",
        "applied_date": "2026-08-19",
        "next_action_text": "Prepare STAR examples",
        "next_action_date": "2026-08-28",
        "notes": "Found through website"
    };
    pool.query = async (sql, values) => {
        assert.match(sql, /DELETE FROM public.applications/);
        assert.deepEqual(values, [1]);
        return {
            rows: [deletedApplication]
        };
    };

    const response = await fetch(`${apiUrl}/applications/1`, {
        method: "DELETE"
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, "Application deleted successfully");
    assert.deepEqual(body.deletedApplication, deletedApplication);
});

test("POST /applications rejects a missing company", async () => {
    const response = await fetch(`${apiUrl}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            role: "Software Engineering Intern",
            status: "saved"
        })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "Company name is required");
});

test("POST /applications rejects an invalid status", async () => {
    const response = await fetch(`${apiUrl}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            company: "Canva",
            role: "Software Engineering Intern",
            status: "unknown"
        })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "Status is invalid");
});

test("PATCH /applications/:id rejects an empty body", async () => {
    const response = await fetch(`${apiUrl}/applications/1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "At least one field is required");
});

test("PATCH /applications/:id rejects fields that cannot be edited", async () => {
    const response = await fetch(`${apiUrl}/applications/1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 99 })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "Fields cannot be updated: id");
});

test("PATCH /applications/:id returns 404 when the application does not exist", async () => {
    pool.query = async (sql, values) => {
        assert.match(
            sql,
            /SELECT\s+\*\s+FROM\s+public\.applications\s+WHERE\s+id\s+=\s+\$1/
        );
        assert.deepEqual(values, [999]);

        return { rows: [] };
    };

    const response = await fetch(`${apiUrl}/applications/999`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Updated notes" })
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.message, "Application not found");
});

test("PATCH /applications/:id rejects an invalid status after loading the application", async () => {
    const existingApplication = {
        "id": "1",
        "company": "Canva",
        "role": "Software Engineering Intern",
        "location": "Sydney / Hybrid",
        "job_url": "https://example.com/job",
        "status": "saved",
        "deadline_date": "2026-09-15",
        "applied_date": null,
        "next_action_text": "Prepare application",
        "next_action_date": "2026-09-10",
        "notes": "Found through university portal"
    };
    let queryCount = 0;

    pool.query = async (sql, values) => {
        queryCount += 1;
        assert.match(sql, /SELECT\s+\*/);
        assert.deepEqual(values, [1]);

        return { rows: [existingApplication] };
    };

    const response = await fetch(`${apiUrl}/applications/1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "unknown" })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "Status is invalid");
    assert.equal(queryCount, 1);
});

test("DELETE /applications/:id rejects an invalid ID", async () => {
    const response = await fetch(`${apiUrl}/applications/hello`, {
        method: "DELETE"
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "Application ID must be a positive integer");
});

test("DELETE /applications/:id returns 404 when the application does not exist", async () => {
    pool.query = async (sql, values) => {
        assert.match(sql, /DELETE\s+FROM\s+public\.applications/);
        assert.deepEqual(values, [999]);

        return { rows: [] };
    };

    const response = await fetch(`${apiUrl}/applications/999`, {
        method: "DELETE"
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.message, "Application not found");
});

test("GET /applications returns 500 when the database query fails", async () => {
    const originalConsoleError = console.error;
    console.error = () => {};

    pool.query = async () => {
        throw new Error("Database unavailable");
    };

    try {
        const response = await fetch(`${apiUrl}/applications`);
        const body = await response.json();

        assert.equal(response.status, 500);
        assert.equal(body.message, "Failed to retrieve applications");
    } finally {
        console.error = originalConsoleError;
    }
});
