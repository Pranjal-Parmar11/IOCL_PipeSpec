from pydantic import BaseModel
from typing import List,Optional


class SpecRow(BaseModel):
    id:str
    root_pass_butt_process: str
    filler_pass_butt_process: str
    welding_material_butt_rootpass: str
    welding_material_butt_fillerpass: str
    preheat_base: Optional[str] = None
    preheat_thk: Optional[str] = None
    preheat_above: Optional[str] = None
    interpass: Optional[str] = None
    pwht_temp: Optional[str] = None
    pwht_min_hold: Optional[str] = None
    hardness: Optional[str] = None
    notes: Optional[str] = None
    
    
class ClassPreview(BaseModel):
    Class:str
    pipes_in_class:List[str]
    
class GroupPreview(BaseModel):
    pipe: str
    pipes_preview: List[str]