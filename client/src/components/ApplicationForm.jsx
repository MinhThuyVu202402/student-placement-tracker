import { useState } from "react";
import { createApplication } from "../api/applications.js";

const INITIAL_FORM = {
  company: "",
  role: "",
  location: "",
  job_url: "",
  status: "saved",
  deadline_date: "",
  applied_date: "",
  next_action_text: "",
  next_action_date: "",
  notes: ""
};

const STATUS_OPTIONS = [
  ["saved", "Saved"],
  ["preparing", "Preparing"],
  ["applied", "Applied"],
  ["interview", "Interview"],
  ["rejected", "Rejected"],
  ["offer", "Offer"],
  ["accepted", "Accepted"],
  ["withdrawn", "Withdrawn"],
  ["closed", "Closed"]
];

function optionalText(value) {
  return value.trim() || null;
}

function buildPayload(formData) {
  return {
    company: formData.company.trim(),
    role: formData.role.trim(),
    location: optionalText(formData.location),
    job_url: optionalText(formData.job_url),
    status: formData.status,
    deadline_date: formData.deadline_date || null,
    applied_date: formData.applied_date || null,
    next_action_text: optionalText(formData.next_action_text),
    next_action_date: formData.next_action_date || null,
    notes: optionalText(formData.notes)
  };
}

export function ApplicationForm({ onCreated, onCancel }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasNotApplied = ["saved", "preparing"].includes(formData.status);
  const today = new Date().toISOString().slice(0, 10);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "status" && ["saved", "preparing"].includes(value)
        ? { applied_date: "" }
        : {})
    }));

    if (fieldErrors[name]) {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        [name]: null
      }));
    }
  }

  function validateRequiredFields() {
    const errors = {};

    if (!formData.company.trim()) {
      errors.company = "Company is required";
    }

    if (!formData.role.trim()) {
      errors.role = "Role is required";
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validateRequiredFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const createdApplication = await createApplication(buildPayload(formData));
      onCreated(createdApplication);
      setFormData(INITIAL_FORM);
    } catch (error) {
      setSubmitError(error.message || "Could not create the application");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="application-form" id="application-form" onSubmit={handleSubmit} noValidate>
      <div className="form-heading">
        <div>
          <p className="eyebrow">New opportunity</p>
          <h2>Add an application</h2>
        </div>
        <p>Start with the essentials, then add any details that help you take the next step.</p>
      </div>

      <fieldset className="form-section">
        <legend>Role details</legend>
        <div className="form-grid">
          <label className="form-field">
            <span>Company <b aria-hidden="true">*</b></span>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.company)}
              aria-describedby={fieldErrors.company ? "company-error" : undefined}
              autoComplete="organization"
              placeholder="e.g. Canva"
            />
            {fieldErrors.company && (
              <small className="field-error" id="company-error">{fieldErrors.company}</small>
            )}
          </label>

          <label className="form-field">
            <span>Role <b aria-hidden="true">*</b></span>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.role)}
              aria-describedby={fieldErrors.role ? "role-error" : undefined}
              placeholder="e.g. Software Engineering Intern"
            />
            {fieldErrors.role && (
              <small className="field-error" id="role-error">{fieldErrors.role}</small>
            )}
          </label>

          <label className="form-field">
            <span>Status</span>
            <select name="status" value={formData.status} onChange={handleChange}>
              {STATUS_OPTIONS.map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Location</span>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Adelaide / Hybrid"
            />
          </label>

          <label className="form-field form-field--wide">
            <span>Job URL</span>
            <input
              type="url"
              name="job_url"
              value={formData.job_url}
              onChange={handleChange}
              placeholder="https://company.com/jobs/..."
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Dates and next action</legend>
        <div className="form-grid form-grid--three">
          <label className="form-field">
            <span>Deadline</span>
            <input
              type="date"
              name="deadline_date"
              value={formData.deadline_date}
              onChange={handleChange}
            />
          </label>

          <label className="form-field">
            <span>Applied date</span>
            <input
              type="date"
              name="applied_date"
              value={formData.applied_date}
              onChange={handleChange}
              max={today}
              disabled={hasNotApplied}
            />
            {hasNotApplied && <small>Available after the status moves past preparing.</small>}
          </label>

          <label className="form-field">
            <span>Next-action date</span>
            <input
              type="date"
              name="next_action_date"
              value={formData.next_action_date}
              onChange={handleChange}
            />
          </label>

          <label className="form-field form-field--wide">
            <span>Next action</span>
            <input
              type="text"
              name="next_action_text"
              value={formData.next_action_text}
              onChange={handleChange}
              placeholder="e.g. Tailor cover letter"
            />
          </label>
        </div>
      </fieldset>

      <label className="form-field">
        <span>Notes</span>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="4"
          placeholder="Contacts, role requirements, interview preparation…"
        />
      </label>

      {submitError && <p className="form-error" role="alert">{submitError}</p>}

      <div className="form-actions">
        <button className="button button--secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create application"}
        </button>
      </div>
    </form>
  );
}
