from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pipe_loader import _specs_by_pipe, _specs_by_material,_all_pipes,_materials
from pyd_ import SpecRow, GroupPreview, ClassPreview, RecommendationResult
from recommend import recommend_material
from pms_loader import (
    get_unique_pms,
    get_unique_classes,
    get_unique_types,
    get_unique_schedules,
    get_unique_facings,
)


app = FastAPI(
    title="EIL Specification Service",
    description="Lookup service for the EIL specification chart.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "pipes": len(_specs_by_pipe)}


@app.get("/api/pipes", response_model=List[str])
def get_pipes(q: Optional[str] = None) -> List[str]:
    """Flat list of every pipe value, for the dropdown. Optional `q` filters by substring."""
    if not q:
        return _all_pipes
    needle = q.strip().upper()
    return [p for p in _all_pipes if needle in p.upper()]


@app.get("/api/materials", response_model=List[str])
def get_pipes(q: Optional[str] = None) -> List[str]:
    """Flat list of every pipe value, for the dropdown. Optional `q` filters by substring."""
    if not q:
        return _materials
    needle = q.strip().upper()
    return [p for p in _materials if needle in p.upper()]

@app.get("/api/materials/preview", response_model=ClassPreview)
def get_material_preview(material: str =Query(...)) -> ClassPreview:
    """Sibling pipes that show up alongside the given pipe across matching spec rows."""
    key = _resolve_materials(material)
    if key is None:
        raise HTTPException(status_code=404, detail=f"No specification found for pipe '{material}'.")

    siblings: List[str] = []
    for row in _specs_by_material[key]:
        siblings.append(row)

    return ClassPreview(Class=key, pipes_in_class=siblings)

@app.get("/api/pipes/preview", response_model=GroupPreview)
def get_pipe_preview(pipe: str =Query(...)) -> GroupPreview:
    """Sibling pipes that show up alongside the given pipe across matching spec rows."""
    key = _resolve_pipe_key(pipe)
    if key is None:
        raise HTTPException(status_code=404, detail=f"No specification found for pipe '{pipe}'.")

    siblings: List[str] = []
    for row in _specs_by_pipe[key]:
        siblings.append(row)

    return GroupPreview(pipe=key, pipes_preview=siblings[:6])


@app.get("/api/spec", response_model=SpecRow)
def get_spec(pipe: str|None=Query(None),
             id: str|None=Query(None)) -> List[SpecRow]:
    """Look up every spec row that lists the given pipe value."""
    key = _resolve_pipe_key(pipe)
    if key is None:
        raise HTTPException(status_code=404, detail=f"No specification found for pipe '{pipe}'.")

    return _specs_by_pipe[key][id]


@app.get("/api/default", response_model=str)
def get_default() -> str:
    """The pipe the UI should preselect on first load."""
    if not _all_pipes:
        raise HTTPException(status_code=404, detail="No data loaded.")
    return _all_pipes[0]


def _resolve_pipe_key(pipe: str) -> Optional[str]:
    """Case-insensitive lookup of a pipe value against the loaded dataset's keys."""
    key = pipe.strip()
    if key in _specs_by_pipe:
        return key

    needle = key.upper()
    for existing_key in _specs_by_pipe:
        if existing_key.upper() == needle:
            return existing_key

    return None
def _resolve_materials(Class: str) -> Optional[str]:
    """Case-insensitive lookup of a pipe value against the loaded dataset's keys."""
    key = Class.strip()
    if key in _specs_by_material:
        return key

    needle = key.upper()
    for existing_key in _specs_by_material:
        if existing_key.upper() == needle:
            return existing_key

    return None


def parse_list_param(params: Optional[List[str]]) -> List[str]:
    if not params:
        return []
    result = []
    for p in params:
        if "," in p:
            result.extend([item.strip() for item in p.split(",") if item.strip()])
        elif p.strip():
            result.append(p.strip())
    return result


@app.get("/api/recommend", response_model=List[RecommendationResult])
def recommend(
    pms: Optional[str] = Query(None),
    pipe_class: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    size: Optional[float] = Query(None),
    schedule_rating: Optional[str] = Query(None),
    facing: Optional[str] = Query(None),
) -> List[RecommendationResult]:
    """
    Recommend Material Descriptions from PMS CSV data using progressive filtering
    and confidence scores.
    """
    results = recommend_material(
        pms=pms,
        pipe_class=pipe_class,
        type=type,
        size=size,
        schedule_rating=schedule_rating,
        facing=facing
    )
    return [RecommendationResult(**res) for res in results]


@app.get("/api/pms", response_model=List[str])
def get_pms_endpoint() -> List[str]:
    """Return all unique PMS specifications."""
    return get_unique_pms()


@app.get("/api/classes", response_model=List[str])
def get_classes_endpoint(
    pms: Optional[str] = Query(None)
) -> List[str]:
    """Return all unique Classes, optionally filtered by PMS."""
    return get_unique_classes(pms)


@app.get("/api/types", response_model=List[str])
def get_types_endpoint(
    classes: Optional[List[str]] = Query(None)
) -> List[str]:
    """Return all unique Types, optionally filtered by Class name(s)."""
    parsed_classes = parse_list_param(classes)
    return get_unique_types(parsed_classes)


@app.get("/api/schedules", response_model=List[str])
def get_schedules_endpoint(
    types: Optional[List[str]] = Query(None)
) -> List[str]:
    """Return all unique Schedules/Ratings, optionally filtered by Type name(s)."""
    parsed_types = parse_list_param(types)
    return get_unique_schedules(parsed_types)


@app.get("/api/facings", response_model=List[str])
def get_facings_endpoint(
    types: Optional[List[str]] = Query(None)
) -> List[str]:
    """Return all unique Facings, optionally filtered by Type name(s)."""
    parsed_types = parse_list_param(types)
    return get_unique_facings(parsed_types)

