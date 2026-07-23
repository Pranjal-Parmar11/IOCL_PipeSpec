from typing import List, Optional, Dict
from pms_loader import _all_rows

# Binary priority weights for progressive filtering matching:
# Higher priority matches strictly dominate lower priority matches.
WEIGHTS = {
    "pms": 56,
    "pipe_class": 48,
    "type": 36,
    "size": 24,
    "schedule_rating": 32,
    "facing": 24,
}


def recommend_material(
    pms: Optional[str] = None,
    pipe_class: Optional[str] = None,
    type: Optional[str] = None,
    size: Optional[float] = None,
    schedule_rating: Optional[str] = None,
    facing: Optional[str] = None,
) -> List[Dict]:
    """
    Recommends unique Material Descriptions based on the provided query filters.
    If no exact match exists, it ranks results using a confidence score based on the priority weights:
    PMS (64) > Pipe Class (32) > Type (16) > Size (8) > Schedule/Rating (4) > Facing (2).
    """
    query = {}
    if pms is not None and pms.strip() != "":
        query["pms"] = pms.strip().upper()
    if pipe_class is not None and pipe_class.strip() != "":
        query["pipe_class"] = pipe_class.strip().upper()
    if type is not None and type.strip() != "":
        query["type"] = type.strip().upper()
    if size is not None:
        query["size"] = size
    if schedule_rating is not None and schedule_rating.strip() != "":
        query["schedule_rating"] = schedule_rating.strip().upper()
    if facing is not None and facing.strip() != "":
        query["facing"] = facing.strip().upper()

    # If no parameters are provided, return all unique material descriptions with 100% confidence
    if not query:
        unique_mats = {
            row.material_description for row in _all_rows if row.material_description
        }
        return [
            {"material_description": mat, "confidence_score": 1.0}
            for mat in sorted(list(unique_mats))
        ]

    # Calculate total weight for all provided filters
    total_weight = sum(WEIGHTS[field] for field in query)

    # Dictionary to keep track of the maximum confidence score achieved per material description
    material_scores: Dict[str, float] = {}

    for row in _all_rows:
        if not row.material_description:
            continue

        matched_weight = 0

        # Check PMS match
        if "pms" in query:
            if row.pms.strip().upper() == query["pms"]:
                matched_weight += WEIGHTS["pms"]

        # Check Pipe Class match
        if "pipe_class" in query:
            if row.pipe_class.strip().upper() == query["pipe_class"]:
                matched_weight += WEIGHTS["pipe_class"]

        # Check Type match
        if "type" in query:
            if row.type.strip().upper() == query["type"]:
                matched_weight += WEIGHTS["type"]

        # Check Size match
        if "size" in query:
            if row.dia_low <= query["size"] <= row.dia_high:
                matched_weight += WEIGHTS["size"]

        # Check Schedule/Rating match
        if "schedule_rating" in query:
            if row.rating.strip().upper() == query["schedule_rating"]:
                matched_weight += WEIGHTS["schedule_rating"]

        # Check Facing match
        if "facing" in query:
            if row.facing.strip().upper() == query["facing"]:
                matched_weight += WEIGHTS["facing"]

        # Confidence is the fraction of total provided weights matched
        confidence = matched_weight / total_weight if total_weight > 0 else 1.0

        if confidence > 0.0:
            desc = row.material_description
            if desc not in material_scores or confidence > material_scores[desc]:
                material_scores[desc] = confidence

    # Map to result dictionary format
    results = [
        {"material_description": desc, "confidence_score": round(score, 4)}
        for desc, score in material_scores.items()
    ]

    # Sort results first by confidence score descending, then by description alphabetically
    results.sort(key=lambda x: (-x["confidence_score"], x["material_description"]))

    return results