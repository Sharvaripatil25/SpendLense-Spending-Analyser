// All data comes from the Python/Flask backend.
// React is purely for display — zero business logic here.

const BASE = "http://localhost:5000/api"; // direct URL for Windows (proxy unreliable)

export async function uploadCSV(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
}

export async function loadSample() {
  const res = await fetch(`${BASE}/sample`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load sample");
  return data;
}

export function fmt(n) {
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
