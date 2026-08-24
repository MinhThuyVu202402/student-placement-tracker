export function SummaryCard({ label, value, tone }) {
    return (
        <article className={`summary-card summary-card--${tone}`}>
            <span>{label}</span>
            <strong>{value}</strong>
        </article>
    );
}