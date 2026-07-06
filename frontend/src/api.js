/**
 * Fetch list of all material classes from the backend.
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";


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
