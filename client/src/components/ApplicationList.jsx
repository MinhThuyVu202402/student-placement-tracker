import {ApplicationCard} from "./ApplicationCard.jsx";

export function ApplicationList({ applications }) {
    return (
        <div className="application-list">
            {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
            ))}
        </div>
    );
}