/**
 * Fetch list of all material classes from the backend.
 */
// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_BASE = "http://localhost:8000";


export async function fetchMaterials() {
  const response = await fetch(`${API_BASE}/api/materials`);
  if (!response.ok) {
    throw new Error(`Failed to fetch material classes: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch pipes belonging to a specific material class.
 */
export async function fetchMaterialPipes(material) {
  const response = await fetch(`${API_BASE}/api/materials/preview?material=${encodeURIComponent(material)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pipes for material class ${material}: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch the group IDs (preview) for a specific pipe.
 */
export async function fetchPipeGroupIds(pipe) {
  const response = await fetch(`${API_BASE}/api/pipes/preview?pipe=${encodeURIComponent(pipe)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch preview for pipe ${pipe}: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch the specification for a specific pipe and group ID.
 */
export async function fetchSpec(pipe, id) {
  const response = await fetch(`${API_BASE}/api/spec?pipe=${encodeURIComponent(pipe)}&id=${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch spec for ${pipe} and ID ${id}: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch all unique PMS specifications.
 */
export async function fetchPMS() {
  const response = await fetch(`${API_BASE}/api/pms`);
  if (!response.ok) {
    throw new Error(`Failed to fetch PMS: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch all unique Classes, optionally filtered by PMS.
 */
export async function fetchClasses(pms) {
  const response = await fetch(`${API_BASE}/api/classes?pms=${encodeURIComponent(pms)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch classes: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch all unique Types, optionally filtered by Class name(s).
 */
export async function fetchTypes(classes) {
  const response = await fetch(`${API_BASE}/api/types?classes=${encodeURIComponent(classes)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch types: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch all unique Schedules/Ratings, optionally filtered by Type name(s).
 */
export async function fetchSchedules(types) {
  const response = await fetch(`${API_BASE}/api/schedules?types=${encodeURIComponent(types)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch schedules: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch all unique Facings, optionally filtered by Type name(s).
 */
export async function fetchFacings(types) {
  const response = await fetch(`${API_BASE}/api/facings?types=${encodeURIComponent(types)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch facings: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch recommendations based on parameters.
 */
export async function fetchRecommendation(params) {
  const query = new URLSearchParams();
  if (params.pms) query.append("pms", params.pms);
  if (params.pipe_class) query.append("pipe_class", params.pipe_class);
  if (params.type) query.append("type", params.type);
  if (params.size) query.append("size", params.size);
  if (params.schedule_rating) query.append("schedule_rating", params.schedule_rating);
  if (params.facing) query.append("facing", params.facing);

  const response = await fetch(`${API_BASE}/api/recommend?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
  }
  return await response.json();
}
