export function formatDate(value) {
    if (!value) return "Not set";

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "Not set";

    return new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}

export function companyInitial(company) {
    return company?.trim().charAt(0).toUpperCase() || "?";
}
