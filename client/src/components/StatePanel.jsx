export function LoadingState() {
    return (
        <div className="application-list" aria-label="Loading applications" aria-busy="true">
            {[1, 2, 3].map((item) => (
                <article className="application-card application-card--loading" key={item}>
                    <div className="skeleton skeleton--logo" />
                    <div className="skeleton-copy">
                        <div className="skeleton skeleton--title" />
                        <div className="skeleton skeleton--line" />
                    </div>
                    <div className="skeleton skeleton--pill" />
                </article>
            ))}
            <span className="sr-only">Loading applications…</span>
        </div>
    );
}

export function EmptyState() {
    return (
        <div className="state-panel">
            <div className="state-icon" aria-hidden="true">0</div>
            <h2>No applications yet</h2>
            <p>Your saved and submitted placement applications will appear here.</p>
        </div>
    );
}

export function ErrorState({ message, onRetry }) {
    return (
        <div className="state-panel state-panel--error" role="alert">
            <div className="state-icon" aria-hidden="true">!</div>
            <h2>We couldn’t load your applications</h2>
            <p>{message}</p>
            <button className="button" type="button" onClick={onRetry}>
                Try again
            </button>
        </div>
    );
}