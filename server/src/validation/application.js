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

const editableApplicationFields = [
    'company',
    'role',
    'location',
    'job_url',
    'status',
    'deadline_date',
    'applied_date',
    'next_action_text',
    'next_action_date',
    'notes'
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

function isValidRequiredFields(company, role, status) {
    if (typeof company !== "string" || company.trim() === "") {
        return "Company name is required";
    }

    if (typeof role !== "string" || role.trim() === "") {
        return "Role is required";
    }

    if (typeof status !== "string" || !allowedStatuses.includes(status)) {
        return "Status is invalid";
    }

    return null;
}

function isValidDateFields(applied_date, status, deadline_date, next_action_date) {
    if (applied_date !== null) {
        if (!isValidDate(applied_date)) {
            return "Applied date must be a valid date in YYYY-MM-DD format";
        }

        const today = new Date().toISOString().slice(0, 10);

        if (applied_date > today) {
            return "Applied date cannot be in the future";
        }

        if (["saved", "preparing"].includes(status)) {
            return "Applied date is not allowed for saved or preparing applications";
        }
    }

    if (deadline_date !== null && !isValidDate(deadline_date)) {
        return "Deadline date must be a valid date in YYYY-MM-DD format";
    }

    if (next_action_date !== null && !isValidDate(next_action_date)) {
        return "Next action date must be a valid date in YYYY-MM-DD format";
    }
    return null;
}

module.exports = {
    editableApplicationFields,
    isValidDate,
    isValidRequiredFields,
    isValidDateFields,
};
