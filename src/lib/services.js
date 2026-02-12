export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // Check if response is ok
  if (!res.ok) {
    // Try to get error message from JSON response
    try {
      const errorData = await res?.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          `HTTP ${res.status}: ${res.statusText}`,
      );
    } catch (e) {
      // If parsing JSON fails, throw generic error
      if (e.message.includes("Unexpected token")) {
        throw new Error(
          `Server error (${res.status}): The server returned an HTML error page instead of JSON. Check Railway logs for details.`,
        );
      }
      throw e;
    }
  }

  // Check content type
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`,
    );
  }

  return res.json();
}
