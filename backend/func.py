import csv
from pathlib import Path
from typing import List,Dict
from pyd_ import SpecRow,GroupPreview


DATA_PATH = Path("data/EIL_SPEC.csv")

_specs_by_pipe: Dict[str, Dict[int,SpecRow]] = {}
_specs_by_material: Dict[str, List[str]]={}
_all_pipes: List[str]=[]
_materials: List[str]=[]
unique_id=set()

def split_value(raw : str) -> List[str]:
    if not raw:
        return []
    return [item.strip() for item in raw.split(",")]

def classify_material(code):
    material = {
        "A": "Carbon_Steel",
        "B": "Carbon_Mo_Steel",
        "C": "Cr_MO_alloy",
        "D": "Cr_MO_alloy",
        "E": "Cr_MO_alloy",
        "F": "Cr_MO_alloy",
        "G": "Cr_MO_alloy",
        "H": "Ni_Steel",
        "J": "Nickel_Titanium",
        "K": "Stainless _Steel",
        "L": "Aluminum",
        "M": "Stainless _Steel",
        "N": "Stainless _Steel",
        "P": "Monel_Alloy20",
        "Q": "Hastelloy_Inconel_Incoloy",
        "R": "Lead",
        "S": "Plastic_FRP",
        "T": "Cast_Iron",
        "Y": "Lined_Steel",
        "Z": "Polymers"
    }

    return material.get(code.upper(), "Unknown")

# get_num= lambda x: x[1:-1]

def load_data()->None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Specification CSV not found at {DATA_PATH}")
    with open(DATA_PATH,"r",encoding="utf-8-sig") as f:
        reader=csv.DictReader(f)
        for raw in reader:
            
            id=raw["group_id"][1:-1]
            Class=classify_material(raw["group_id"][-1])
            pipes= split_value(raw["pipes"])
            unique_id.add(id)
            row = SpecRow(
                id=raw["group_id"][1:-1],
                root_pass_butt_process=(raw.get("root_pass_butt_process") or "").strip(),
                filler_pass_butt_process=(raw.get("filler_pass_butt_process") or "").strip(),
                root_pass_other_process=(raw.get("root_pass_other_process") or "").strip(),
                filler_pass_other_process=(raw.get("filler_pass_other_process") or "").strip(),
                fillet_socket_process=(raw.get("fillet_socket_process") or "").strip(),
                welding_material_butt_rootpass=(raw.get("welding_material_butt_rootpass") or "").strip(),
                welding_material_butt_fillerpass=(raw.get("welding_material_butt_fillerpass") or "").strip(),
                welding_material_nobutt_rootpass=(raw.get("welding_material_nobutt_rootpass") or "").strip(),
                welding_material_nobutt_fillerpass=(raw.get("welding_material_nobutt_fillerpass") or "").strip(),
                welding_material_socket_joint=(raw.get("welding_material_socket_joint") or "").strip(),
                joint_preparation=(raw.get("joint_preparation") or "").strip(),
                preheat_base=(raw.get("preheat_base") or "").strip(),
                preheat_thk=(raw.get("preheat_thk") or "").strip(),
                preheat_above=(raw.get("preheat_above") or "").strip(),
                interpass=(raw.get("interpass") or "").strip(),
                pwht_thk=(raw.get("pwht_thk") or "").strip(),
                pwht_temp=(raw.get("pwht_temp") or "").strip(),
                pwht_min_hold=(raw.get("pwht_min_hold") or "").strip(),
                hardness=(raw.get("hardness") or "").strip(),
                code=(raw.get("code") or "").strip(),
                notes=(raw.get("notes") or "").strip(),
            )
            for pipe in pipes:
                _specs_by_pipe.setdefault(pipe, {})[id] = row
                _specs_by_material.setdefault(Class, []).append(pipe)
          
    for pipe in _specs_by_pipe.keys():
        _all_pipes.append(pipe)
    for mat in _specs_by_material.keys():
        _materials.append(mat)
    _all_pipes.sort()
    
load_data()