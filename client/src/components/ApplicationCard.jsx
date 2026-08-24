import {formatDate, companyInitial} from "../utils/applicationFormatting.js";

const STATUS_LABELS = {
    saved: "Saved",
    preparing: "Preparing",
    applied: "Applied",
    interview: "Interview",
    offer: "Offer",
    accepted: "Accepted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    closed: "Closed"
};

export function ApplicationCard({ application }) {
    const status = application.status?.toLowerCase() || "saved";

    return (
        <article className="application-card">
            <div className="company-mark" aria-hidden="true">
                {companyInitial(application.company)}
            </div>

            <div className="application-main">
                <div className="application-heading">
                    <div>
                        <p className="company-name">{application.company}</p>
                        <h2>{application.role}</h2>
                    </div>
                    <span className={`status status--${status}`}>
            {STATUS_LABELS[status] || status}
          </span>
                </div>

                <p className="location">{application.location || "Location not specified"}</p>

                <dl className="application-details">
                    <div>
                        <dt>Applied</dt>
                        <dd>{formatDate(application.applied_date)}</dd>
                    </div>
                    <div>
                        <dt>Deadline</dt>
                        <dd>{formatDate(application.deadline_date)}</dd>
                    </div>
                    <div>
                        <dt>Next action</dt>
                        <dd>{formatDate(application.next_action_date)}</dd>
                    </div>
                </dl>

                {application.next_action_text && (
                    <p className="next-action">
                        <span aria-hidden="true">→</span>
                        {application.next_action_text}
                    </p>
                )}
            </div>
        </article>
    );
}