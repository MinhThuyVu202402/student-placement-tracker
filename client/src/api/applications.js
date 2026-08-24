const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    return body.message;
  } catch {
    return null;
  }
}

export async function getApplications({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/applications`, {
    signal,
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const serverMessage = await readErrorMessage(response);
    throw new Error(serverMessage || `Could not load applications (${response.status})`);
  }

  const applications = await response.json();

  if (!Array.isArray(applications)) {
    throw new Error("The applications response was not in the expected format");
  }

  return applications;
}
