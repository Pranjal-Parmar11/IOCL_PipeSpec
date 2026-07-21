import React, { useState, useEffect } from "react";
import {
  fetchPMS,
  fetchClasses,
  fetchTypes,
  fetchSchedules,
  fetchFacings,
  fetchRecommendation,
} from "./api";

function RecommendationPanel({onMaterialSelect}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Cascading Selection states
  const [selectedPMS, setSelectedPMS] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedFacing, setSelectedFacing] = useState("");
  const [pipeSize, setPipeSize] = useState("");

  // Lists of options
  const [pmsList, setPmsList] = useState([]);
  const [classList, setClassList] = useState([]);
  const [typeList, setTypeList] = useState([]);
  const [scheduleList, setScheduleList] = useState([]);
  const [facingList, setFacingList] = useState([]);

  // UI state
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isLoadingRecommend, setIsLoadingRecommend] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [recommendations, setRecommendations] = useState(null);

  // Initialize: Load PMS options
  useEffect(() => {
    const loadInitialPMS = async () => {
      try {
        setIsLoadingDropdowns(true);
        setErrorMessage("");
        const data = await fetchPMS();
        setPmsList(data || []);
      } catch (err) {
        console.error("Error fetching PMS:", err);
        setErrorMessage("Failed to load PMS specifications.");
      } finally {
        setIsLoadingDropdowns(false);
      }
    };
    loadInitialPMS();
  }, []);

  // Handle PMS change -> Fetch Class
  const handlePMSChange = async (e) => {
    const pms = e.target.value;
    setSelectedPMS(pms);
    setSelectedClass("");
    setSelectedType("");
    setSelectedSchedule("");
    setSelectedFacing("");
    setClassList([]);
    setTypeList([]);
    setScheduleList([]);
    setFacingList([]);
    setRecommendations(null);
    setErrorMessage("");

    if (!pms) return;

    try {
      setIsLoadingDropdowns(true);
      const data = await fetchClasses(pms);
      setClassList(data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setErrorMessage("Failed to load classes for selected PMS.");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Handle Class change -> Fetch Type
  const handleClassChange = async (e) => {
    const cls = e.target.value;
    setSelectedClass(cls);
    setSelectedType("");
    setSelectedSchedule("");
    setSelectedFacing("");
    setTypeList([]);
    setScheduleList([]);
    setFacingList([]);
    setRecommendations(null);
    setErrorMessage("");

    if (!cls) return;

    try {
      setIsLoadingDropdowns(true);
      const data = await fetchTypes(cls);
      setTypeList(data || []);
    } catch (err) {
      console.error("Error fetching types:", err);
      setErrorMessage("Failed to load types for selected Class.");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Handle Type change -> Fetch Schedule
  const handleTypeChange = async (e) => {
    const typ = e.target.value;
    setSelectedType(typ);
    setSelectedSchedule("");
    setSelectedFacing("");
    setScheduleList([]);
    setFacingList([]);
    setRecommendations(null);
    setErrorMessage("");

    if (!typ) return;

    try {
      setIsLoadingDropdowns(true);
      const data = await fetchSchedules(typ);
      setScheduleList(data || []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setErrorMessage("Failed to load schedules for selected Type.");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Handle Schedule change -> Fetch Facing (progressive flow)
  const handleScheduleChange = async (e) => {
    const sched = e.target.value;
    setSelectedSchedule(sched);
    setSelectedFacing("");
    setFacingList([]);
    setRecommendations(null);
    setErrorMessage("");

    if (!sched) return;

    try {
      setIsLoadingDropdowns(true);
      // Facing depends on Type (which is selectedType)
      const data = await fetchFacings(selectedType);
      setFacingList(data || []);
    } catch (err) {
      console.error("Error fetching facings:", err);
      setErrorMessage("Failed to load facings for selected Schedule.");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Handle Recommendation click
  const handleRecommend = async () => {
    if (!selectedPMS) {
      setErrorMessage("Please select a PMS.");
      setRecommendations(null);
      return;
    }

    try {
      setIsLoadingRecommend(true);
      setErrorMessage("");
      setRecommendations(null);

      const params = {
        pms: selectedPMS,
      };

      if (selectedClass) {
        params.pipe_class = selectedClass;
      }

      if (selectedType) {
        params.type = selectedType;
      }

      if (selectedSchedule) {
        params.schedule_rating = selectedSchedule;
      }

      if (selectedFacing) {
        params.facing = selectedFacing;
      }

      if (pipeSize !== "") {
        const parsedSize = parseFloat(pipeSize);

        if (!isNaN(parsedSize) && parsedSize > 0) {
          params.size = parsedSize;
        }
      }

      const results = await fetchRecommendation(params);

      if (results && results.length > 0) {
        setRecommendations(results);
      } else {
        setErrorMessage("No recommendation found.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to fetch recommendation.");
    } finally {
      setIsLoadingRecommend(false);
    }
  };

  // Format confidence float (e.g. 0.98 -> 98%)
  const formatConfidence = (score) => {
    return `${Math.round(score * 100)}%`;
  };

  const isDisabled = isLoadingDropdowns || isLoadingRecommend;

  return (
    <div className="bento-card recommendation-card">
      {/* Header */}
      <div 
        className="bento-card-header collapsible-header" 
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <span className="material-symbols-outlined header-icon">recommend</span>
          <h3>Material Recommendation</h3>
        </div>
        <span className="material-symbols-outlined toggle-icon">
          {isCollapsed ? "expand_more" : "expand_less"}
        </span>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="recommendation-body">
          {/* PMS */}
          <div className="recommendation-form-group">
            <label className="font-label-caps form-label">PMS</label>
            <select
              className="recommendation-select"
              value={selectedPMS}
              onChange={handlePMSChange}
              disabled={isDisabled}
            >
              <option value="">Select PMS...</option>
              {pmsList.map((pms) => (
                <option key={pms} value={pms}>
                  {pms}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div className="recommendation-form-group">
            <label className="font-label-caps form-label">Class</label>
            <select
              className="recommendation-select"
              value={selectedClass}
              onChange={handleClassChange}
              disabled={isDisabled}
            >
              <option value="">Select Class...</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="recommendation-form-group">
            <label className="font-label-caps form-label">Type</label>
            <select
              className="recommendation-select"
              value={selectedType}
              onChange={handleTypeChange}
              disabled={isDisabled}
            >
              <option value="">Select Type...</option>
              {typeList.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule / Rating */}
          <div className="recommendation-form-group">
            <label className="font-label-caps form-label">Schedule / Rating</label>
            <select
              className="recommendation-select"
              value={selectedSchedule}
              onChange={handleScheduleChange}
              disabled={isDisabled}
            >
              <option value="">Select Schedule...</option>
              {scheduleList.map((sched) => (
                <option key={sched} value={sched}>
                  {sched}
                </option>
              ))}
            </select>
          </div>

          {/* Facing */}
          <div className="recommendation-form-group">
            <label className="font-label-caps form-label">Facing</label>
            <select
              className="recommendation-select"
              value={selectedFacing}
              onChange={(e) => {
                setSelectedFacing(e.target.value);
                setRecommendations(null);
                setErrorMessage("");
              }}
              disabled={isDisabled}
            >
              <option value="">Select Facing...</option>
              {facingList.map((facing) => (
                <option key={facing} value={facing}>
                  {facing}
                </option>
              ))}
            </select>
          </div>

          {/* Pipe Size (Numeric Input) */}
          <div className="recommendation-form-group">
            <label className="font-label-caps form-label">Pipe Size (Numeric)</label>
            <input
              type="number"
              step="any"
              min="0"
              className="recommendation-input"
              placeholder="Enter numeric size e.g. 3"
              value={pipeSize}
              onChange={(e) => {
                setPipeSize(e.target.value);
                setRecommendations(null);
                setErrorMessage("");
              }}
              disabled={isDisabled}
            />
          </div>

          {/* Button */}
          <button
            className="recommendation-button"
            onClick={handleRecommend}
            disabled={isDisabled}
          >
            {isLoadingRecommend && <div className="spinner-sm"></div>}
            <span>Recommend Material</span>
          </button>

          {/* Error Message */}
          {errorMessage && (
            <div className="recommendation-error font-body-sm">
              {errorMessage}
            </div>
          )}

          {/* Recommendation Results */}
          {recommendations && recommendations.length > 0 && (
            <div className="results-container">
              <h4 className="results-title font-label-caps">Recommendations</h4>
              {recommendations.map((rec, index) => {
                const isHighest = index === 0;
                const isExact = rec.confidence_score >= 1.0;
                return (
                  <div
                    key={index}
                    className={`result-card ${isHighest ? "highest-confidence" : ""}`}
                    onClick={() => onMaterialSelect(rec.material_description)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="result-header">
                      <span className="result-confidence">
                        {formatConfidence(rec.confidence_score)}
                      </span>
                      <span className={`result-badge ${isExact ? "exact" : "best"}`}>
                        {isExact ? "Exact Match" : "Best Match"}
                      </span>
                    </div>
                    <div className="result-description">
                      {rec.material_description}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecommendationPanel;
