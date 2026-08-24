import { useEffect, useMemo, useState } from "react";
import { getApplications } from "./api/applications.js";
import {ApplicationList} from "./components/ApplicationList.jsx";
import {SummaryCard} from "./components/SummaryCard.jsx"
import {LoadingState, ErrorState, EmptyState} from "./components/StatePanel.jsx";


export default function App() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getApplications({ signal: controller.signal });
        setApplications(data);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message || "Check that the API server is running and try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadApplications();
    return () => controller.abort();
  }, [requestKey]);

  const summary = useMemo(() => {
    const countStatus = (status) =>
      applications.filter((application) => application.status === status).length;

    return {
      total: applications.length,
      applied: countStatus("applied"),
      interviews: countStatus("interview"),
      offers: countStatus("offer")
    };
  }, [applications]);

  const apiStatus = isLoading
    ? { className: "api-indicator--loading", label: "Checking API" }
    : error
      ? { className: "api-indicator--error", label: "API unavailable" }
      : { className: "api-indicator--connected", label: "API connected" };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Placement Desk home">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>Placement Desk</span>
        </a>
        <span className={`api-indicator ${apiStatus.className}`}>
          <span aria-hidden="true" /> {apiStatus.label}
        </span>
      </header>

      <main>
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">Your placement workspace</p>
          <h1 id="page-title">Keep every opportunity moving.</h1>
          <p className="hero-copy">
            One clear view of your applications, deadlines, and the next thing to do.
          </p>
        </section>

        <section className="summary-grid" aria-label="Application summary">
          <SummaryCard label="Total applications" value={summary.total} tone="ink" />
          <SummaryCard label="Applied" value={summary.applied} tone="blue" />
          <SummaryCard label="Interviews" value={summary.interviews} tone="amber" />
          <SummaryCard label="Offers" value={summary.offers} tone="green" />
        </section>

        <section className="applications-section" aria-labelledby="applications-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Pipeline</p>
              <h2 id="applications-title">Applications</h2>
            </div>
            {!isLoading && !error && (
              <span className="record-count">
                {applications.length} {applications.length === 1 ? "record" : "records"}
              </span>
            )}
          </div>

          {isLoading && <LoadingState />}
          {!isLoading && error && (
            <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />
          )}
          {!isLoading && !error && applications.length === 0 && <EmptyState />}
          {!isLoading && !error && applications.length > 0 && (
              <ApplicationList applications={applications} />
          )}
        </section>
      </main>
    </div>
  );
}
