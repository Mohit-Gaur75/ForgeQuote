// server/src/modules/routings/similarity.js

// Material families for partial similarity scoring
const MATERIAL_FAMILIES = {
  CARBON_STEEL: ['en8', 'c45', 'en9', 'sae1045', '1045', 'mild steel', 'ms'],
  ALLOY_STEEL: ['40cr4', '20mncr5', 'en19', 'en24', '4140', '4340', '16mncr5', '8620'],
  STAINLESS_STEEL: ['ss304', 'ss316', '304', '316', 'aisi304', 'aisi316'],
};

/**
 * Tokenize a part name into normalized words, ignoring stop words
 * @param {string} name
 * @returns {Set<string>}
 */
function tokenizeName(name) {
  if (!name) return new Set();
  const stopWords = new Set(['part', 'forged', 'machined', 'assy', 'assembly', 'component', 'forging', 'raw']);
  const tokens = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !stopWords.has(t));
  return new Set(tokens);
}

/**
 * Calculate Jaccard similarity between two part names
 * @param {string} name1
 * @param {string} name2
 * @returns {number} 0.0 to 1.0
 */
export function calculateNameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;

  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  if (n1 === n2) return 1.0;

  const set1 = tokenizeName(n1);
  const set2 = tokenizeName(n2);

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  for (const t of set1) {
    if (set2.has(t)) intersection++;
  }

  const union = new Set([...set1, ...set2]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // Substring boost if one is completely contained in the other
  if (n1.includes(n2) || n2.includes(n1)) {
    return Math.max(jaccard, 0.75);
  }

  return Math.min(1.0, Math.max(0.0, jaccard));
}

/**
 * Calculate Material similarity score
 * @param {string} mat1
 * @param {string} mat2
 * @returns {number} 1.0 (exact), 0.6 (family), 0.0 (unrelated)
 */
export function calculateMaterialSimilarity(mat1, mat2) {
  if (!mat1 || !mat2) return 0;

  const m1 = mat1.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const m2 = mat2.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  if (m1 === m2) return 1.0;

  for (const family of Object.values(MATERIAL_FAMILIES)) {
    const hasM1 = family.some((item) => m1.includes(item.replace(/[^a-z0-9]/g, '')));
    const hasM2 = family.some((item) => m2.includes(item.replace(/[^a-z0-9]/g, '')));
    if (hasM1 && hasM2) return 0.6;
  }

  return 0.0;
}

/**
 * Calculate Weight similarity score
 * @param {number} w1 - Net weight kg
 * @param {number} w2 - Net weight kg
 * @returns {number} 0.0 to 1.0
 */
export function calculateWeightSimilarity(w1, w2) {
  const weight1 = parseFloat(w1);
  const weight2 = parseFloat(w2);

  if (isNaN(weight1) || isNaN(weight2) || weight1 <= 0 || weight2 <= 0) {
    return 0.0;
  }

  const maxW = Math.max(weight1, weight2);
  const diff = Math.abs(weight1 - weight2);

  const similarity = 1 - diff / maxW;
  return Math.min(1.0, Math.max(0.0, similarity));
}

/**
 * Master Deterministic Similarity Formula:
 * S = 0.40 * S_name + 0.35 * S_mat + 0.25 * S_weight
 *
 * @param {object} targetPart - { partName, material, netWeightKg }
 * @param {object} candidatePart - { partName, material, netWeightKg }
 * @returns {object} { score, breakdown: { name, material, weight } }
 */
export function calculatePartSimilarity(targetPart, candidatePart) {
  const sName = calculateNameSimilarity(targetPart.partName, candidatePart.partName);
  const sMat = calculateMaterialSimilarity(targetPart.material, candidatePart.material);
  const sWeight = calculateWeightSimilarity(targetPart.netWeightKg, candidatePart.netWeightKg);

  const totalScore = 0.4 * sName + 0.35 * sMat + 0.25 * sWeight;

  return {
    score: Number(totalScore.toFixed(4)),
    breakdown: {
      name: Number(sName.toFixed(4)),
      material: Number(sMat.toFixed(4)),
      weight: Number(sWeight.toFixed(4)),
    },
  };
}
