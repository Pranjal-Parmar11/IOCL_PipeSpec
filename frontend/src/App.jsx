import React, { useState, useEffect, useRef } from "react";
import {
  fetchMaterials,
  fetchMaterialPipes,
  fetchPipeGroupIds,
  fetchSpec,
} from "./api";
import "./App.css";

const SERVICE_MAP = {
  1: "Normal",
  2: "IBR",
  3: "Cat-D",
  4: "LTCS",
  5: "Hydrogen",
  6: "High Temperature",
  7: "Vacuum",
  8: "Concentrated Sulphuric Acid",
  9: "Caustic",
  10: "Offsites",
  11: "Maximum Hardness 200 BHN",
  12: "IBR (High CA)",
  13: "General Service",
  14: "NACE",
  15: "Liquid Sulphur",
  16: "NACE (High Severity)",
  17: "Chlorine / Dry HCl",
  18: "Oxygen",
  19: "Caustic (Stress Relieved)",
  20: "Jacket for A15A",
  21: "Reserved",
  22: "IBR",
  23: "General Service",
  24: "Reserved",
  25: "General Service",
  26: "Reserved",
  27: "General Service",
  28: "Reserved",
  29: "Reserved",
  30: "Reserved",
  31: "Low Temperature (-29°C to 704°C)",
  32: "Steam Tracing",
  33: "Underground / Above Ground Fire Water",
  34: "Reserved",
  35: "NACE (High CA)",
  36: "Reserved",
  37: "SS321-NACE",
  38: "General Service",
  39: "Reserved",
  40: "Reserved",
  41: "Reserved",
  42: "Reserved",
  43: "Reserved",
  44: "Reserved",
  45: "Reserved",
  46: "Reserved",
  47: "Reserved",
  48: "Reserved",
  49: "Reserved",
  50: "Hydrogen (SS304)",
  51: "Hydrogen Process + H₂",
  52: "Hydrogen",
  53: "Reserved",
  54: "Hydrogen (High CA)",
  55: "General Service"
};

function App() {
  // Application states
  const [selectedPipe, setSelectedPipe] = useState("");
  const [pipesList, setPipesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [siblings, setSiblings] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [activeSpecIndex, setActiveSpecIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Material states
  const [materialsList, setMaterialsList] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
  
  // Navigation tabs: 'specs' | 'search' | 'history'
  const [activeNavTab, setActiveNavTab] = useState("specs");
  
  // Browsing history
  const [searchHistory, setSearchHistory] = useState([]);

  // Refs for closing dropdown on click outside
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const materialDropdownRef = useRef(null);
  const materialSearchInputRef = useRef(null);

  // Initialize application data – load materials and auto-select a default
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all material classes for dropdown
        const materials = await fetchMaterials();
        setMaterialsList(materials);

        // Auto-select the first material class and its first pipe
        if (materials.length > 0) {
          const defaultMat = materials[0];
          setSelectedMaterial(defaultMat);
          setMaterialSearchQuery(defaultMat);

          const res = await fetchMaterialPipes(defaultMat);
          const uniquePipes = Array.from(new Set(res.pipes_in_class || []));
          const pipes = uniquePipes.map(p => ({ pipe: p }));
          setPipesList(pipes);

          if (uniquePipes.length > 0) {
            const defaultPipe = uniquePipes[0];
            setSelectedPipe(defaultPipe);
            setSearchQuery(defaultPipe);
            updateHistory(defaultPipe);
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load initial data. Ensure the backend server is running.");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Fetch specification and preview details when selectedPipe changes
  useEffect(() => {
    if (!selectedPipe) return;

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch group IDs for this pipe
        const groupPreviewData = await fetchPipeGroupIds(selectedPipe);
        const groupIds = groupPreviewData.pipes_preview || [];

        if (groupIds.length === 0) {
          setSpecs([]);
          setSiblings([]);
          return;
        }

        // Fetch specs for all group IDs in parallel
        const specPromises = groupIds.map(id => fetchSpec(selectedPipe, id));
        const specData = await Promise.all(specPromises);

        setSpecs(specData || []);
        setActiveSpecIndex(0);

        // Set siblings to the other pipes in the same material class
        const related = pipesList
          .map(p => p.pipe)
          .filter(p => p !== selectedPipe);
        setSiblings(related);
      } catch (err) {
        console.error("Error loading pipe specifications:", err);
        setError(`Failed to retrieve specifications for "${selectedPipe}".`);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [selectedPipe, pipesList]);

  // Click outside handling for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setSearchQuery(selectedPipe);
      }
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(event.target)) {
        setMaterialDropdownOpen(false);
        setMaterialSearchQuery(selectedMaterial);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedPipe, selectedMaterial]);

  // Add pipe to session history (max 5 items, unique)
  const updateHistory = (pipeName) => {
    setSearchHistory((prevHistory) => {
      const filtered = prevHistory.filter((item) => item !== pipeName);
      return [pipeName, ...filtered].slice(0, 5);
    });
  };

  // Selection actions
  const handleMaterialSelect = async (matName) => {
    setSelectedMaterial(matName);
    setMaterialSearchQuery(matName);
    setMaterialDropdownOpen(false);

    // Clear pipe selections and specifications
    setSelectedPipe("");
    setSearchQuery("");
    setSpecs([]);
    setSiblings([]);
    setActiveSpecIndex(0);

    try {
      setLoading(true);
      setError(null);

      // Fetch pipes for this material class
      const res = await fetchMaterialPipes(matName);
      // Deduplicate pipes in class
      const uniquePipes = Array.from(new Set(res.pipes_in_class || []));
      const pipes = uniquePipes.map(p => ({ pipe: p }));
      setPipesList(pipes);
    } catch (err) {
      console.error("Error fetching pipes for material class:", err);
      setError(`Failed to retrieve pipes for material class "${matName}".`);
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialSearchFocus = () => {
    setMaterialSearchQuery("");
    setMaterialDropdownOpen(true);
  };

  const handleMaterialSearchBlur = () => {
    setTimeout(() => {
      if (!materialDropdownOpen) {
        setMaterialSearchQuery(selectedMaterial);
      }
    }, 150);
  };

  const handlePipeSelect = (pipeName) => {
    setSelectedPipe(pipeName);
    setSearchQuery(pipeName);
    setDropdownOpen(false);
    updateHistory(pipeName);
    setActiveNavTab("specs"); // Navigate to specs view if not already there
  };

  const handleSearchFocus = () => {
    setSearchQuery(""); // Clear on focus to allow typing and browsing list
    setDropdownOpen(true);
  };

  const handleSearchBlur = () => {
    // Timeout to allow click handler on option to fire before query resets
    setTimeout(() => {
      if (!dropdownOpen) {
        setSearchQuery(selectedPipe);
      }
    }, 150);
  };

  // Helper to parse technical notes
  const parseNotes = (notesStr) => {
    if (!notesStr) return [];
    // Split on numbers followed by dot (e.g. "1. ", "2. ")
    const parts = notesStr.split(/\d+\.\s+/);
    return parts.map((part) => part.trim()).filter((part) => part.length > 0);
  };

  // Filter lists based on typed query
  const filteredMaterials = materialsList.filter((option) =>
    option.replace(/_/g, " ").toUpperCase().includes(materialSearchQuery.replace(/_/g, " ").toUpperCase())
  );

  const filteredPipes = pipesList.filter((option) =>
    option.pipe.toUpperCase().includes(searchQuery.toUpperCase())
  );

  const currentSpec = specs[activeSpecIndex];

  return (
    <div className="app-container">
      {/* Header / TopAppBar */}
      <header className="top-app-bar">
        <div className="brand">
          <span className="material-symbols-outlined brand-icon">engineering</span>
          <h1 className="font-headline-md">Pipe Specs</h1>
        </div>
        <button 
          className="settings-btn" 
          onClick={() => alert("Settings configuration is not available in read-only mode.")}
          title="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      {/* Main Layout Container */}
      <main className="main-container">

        {/* Material Class Selection & Search Dropdown */}
        <section className="select-section" ref={materialDropdownRef}>
          <label className="font-label-caps select-label">Select Material Class</label>
          <div className="custom-select-wrapper">
            <div className="search-input-container">
              <input
                ref={materialSearchInputRef}
                type="text"
                className="search-input"
                placeholder="Type to search e.g. Carbon Steel..."
                value={materialSearchQuery.replace(/_/g, " ")}
                onChange={(e) => setMaterialSearchQuery(e.target.value)}
                onFocus={handleMaterialSearchFocus}
                onBlur={handleMaterialSearchBlur}
              />
              <span className={`material-symbols-outlined search-chevron ${materialDropdownOpen ? "open" : ""}`}>
                expand_more
              </span>
            </div>

            {materialDropdownOpen && (
              <ul className="dropdown-options-list">
                {filteredMaterials.length > 0 ? (
                  filteredMaterials.map((mat) => (
                    <li
                      key={mat}
                      className={`dropdown-option ${selectedMaterial === mat ? "selected" : ""}`}
                      onClick={() => handleMaterialSelect(mat)}
                    >
                      {mat.replace(/_/g, " ")}
                    </li>
                  ))
                ) : (
                  <li className="dropdown-no-results">No matching material classes found</li>
                )}
              </ul>
            )}
          </div>
        </section>
        
        {/* Selection & Search Dropdown */}
        <section className="select-section" ref={dropdownRef}>
          <label className="font-label-caps select-label">Select Pipe Material</label>
          <div className="custom-select-wrapper">
            <div className="search-input-container">
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder={selectedMaterial ? "Type to search e.g. ASTM A106..." : "Select Material Class first..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                disabled={!selectedMaterial}
              />
              <span className={`material-symbols-outlined search-chevron ${dropdownOpen ? "open" : ""}`}>
                expand_more
              </span>
            </div>

            {dropdownOpen && (
              <ul className="dropdown-options-list">
                {filteredPipes.length > 0 ? (
                  filteredPipes.map((opt) => (
                    <li
                      key={opt.pipe}
                      className={`dropdown-option ${selectedPipe === opt.pipe ? "selected" : ""}`}
                      onClick={() => handlePipeSelect(opt.pipe)}
                    >
                      {opt.pipe}
                    </li>
                  ))
                ) : (
                  <li className="dropdown-no-results">No matching materials found</li>
                )}
              </ul>
            )}
          </div>
        </section>

        {/* Dynamic Views: Specs (Default) vs Search Focus vs History */}
        {activeNavTab === "history" ? (
          <section className="siblings-section">
            <h2 className="font-headline-sm">Recently Viewed Specs</h2>
            <div className="siblings-container">
              {searchHistory.length > 0 ? (
                searchHistory.map((historyPipe) => (
                  <button
                    key={historyPipe}
                    className="sibling-tag"
                    onClick={() => handlePipeSelect(historyPipe)}
                  >
                    {historyPipe}
                  </button>
                ))
              ) : (
                <p className="font-body-md text-on-surface-variant">No lookup history in this session yet.</p>
              )}
            </div>
          </section>
        ) : activeNavTab === "search" ? (
          <section className="siblings-section">
            <h2 className="font-headline-sm">Quick Search Directory</h2>
            <p className="font-body-md text-on-surface-variant mb-sm">
              Use the main dropdown search bar above or pick from these preloaded EIL spec categories:
            </p>
            <div className="siblings-container">
              {pipesList.slice(0, 15).map((opt) => (
                <button
                  key={opt.pipe}
                  className="sibling-tag"
                  onClick={() => handlePipeSelect(opt.pipe)}
                >
                  {opt.pipe}
                </button>
              ))}
            </div>
          </section>
        ) : (
          /* Normal Specs View */
          <>
            {/* Sibling Pipes / Quick Navigation */}
            {siblings.length > 0 && (
              <section className="siblings-section">
                <label className="font-label-caps siblings-label">Related Piping Materials</label>
                <div className="siblings-container">
                  {siblings.map((sib) => (
                    <button
                      key={sib}
                      className="sibling-tag"
                      onClick={() => handlePipeSelect(sib)}
                    >
                      {sib}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Loading / Error / Content */}
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="font-body-lg">Fetching specifications from database...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <span className="material-symbols-outlined error-icon">error</span>
                <h3 className="font-headline-sm">Specification Error</h3>
                <p className="font-body-md">{error}</p>
                <button onClick={() => setSelectedPipe(selectedPipe)}>Retry Request</button>
              </div>
            ) : !selectedPipe ? (
              <div className="error-container selection-prompt" style={{ borderColor: "var(--color-outline-variant)" }}>
                <span className="material-symbols-outlined error-icon" style={{ color: "var(--color-secondary)" }}>info</span>
                <h3 className="font-headline-sm" style={{ color: "var(--color-primary)" }}>Select a Pipe Material</h3>
                <p className="font-body-md" style={{ color: "var(--color-on-surface-variant)" }}>
                  Please select a Material Class first, then choose a Pipe Material from the dropdown to view its detailed EIL specifications.
                </p>
              </div>
            ) : specs.length === 0 ? (
              <div className="error-container">
                <span className="material-symbols-outlined error-icon">search_off</span>
                <h3 className="font-headline-sm">No Specifications Found</h3>
                <p className="font-body-md">The material is registered, but has no spec rows loaded in the CSV database.</p>
              </div>
            ) : (
              <>
                {/* Spec Variations Tabs (if multiple spec variations found) */}
                {specs.length > 1 && (
                  <section className="variation-section">
                    <label className="font-label-caps siblings-label">Specification Variations Available ({specs.length})</label>
                    <div className="variation-tabs">
                      {specs.map((spec, idx) => (
                        <button
                          key={idx}
                          className={`variation-tab ${activeSpecIndex === idx ? "active" : ""}`}
                          onClick={() => setActiveSpecIndex(idx)}
                        >
                          {SERVICE_MAP[spec.id] ?? "Unknown Service"}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Bento Grid */}
                <div className="bento-grid">
                  
                  {/* Primary Spec Header Card */}
                  <div className="bento-card full-width">
                    <div className="primary-spec-card">
                      <div>
                        <div className="card-meta">
                          <span className="material-symbols-outlined card-meta-icon">description</span>
                          <span className="font-label-caps card-meta-icon">ACTIVE EIL SPECIFICATION</span>
                        </div>
                        <h2 className="font-headline-lg card-title">{selectedPipe}</h2>
                        {/* <p className="font-body-sm card-subtitle">
                          Applicable Standard Code: <strong>{currentSpec.code || "ASME B31.3"}</strong> | Joint Prep: <strong>{currentSpec.joint_preparation || "Standard"}</strong>
                        </p> */}
                      </div>
                      <span className="badge">VERIFIED SPEC</span>
                    </div>
                  </div>

                  {/* Welding Process Card */}
                  <div className="bento-card half-width">
                    <div className="bento-card-header">
                      <span className="material-symbols-outlined header-icon">precision_manufacturing</span>
                      <h3>Welding Process</h3>
                    </div>
                    <table className="spec-table">
                      <tbody>
                        <tr>
                          <td className="font-label-caps label">Root Pass (Butt)</td>
                          <td className="font-label-mono value">{currentSpec.root_pass_butt_process || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="font-label-caps label">Filler Pass (Butt)</td>
                          <td className="font-label-mono value">{currentSpec.filler_pass_butt_process || "N/A"}</td>
                        </tr>
                        {/* <tr>
                          <td className="font-label-caps label">Root Pass (Other)</td>
                          <td className="font-label-mono value">{currentSpec.root_pass_other_process || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="font-label-caps label">Filler Pass (Other)</td>
                          <td className="font-label-mono value">{currentSpec.filler_pass_other_process || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="font-label-caps label">Fillet Socket Joint</td>
                          <td className="font-label-mono value">{currentSpec.fillet_socket_process || "N/A"}</td>
                        </tr> */}
                      </tbody>
                    </table>
                  </div>

                  {/* Welding Material Card */}
                  <div className="bento-card half-width">
                    <div className="bento-card-header">
                      <span className="material-symbols-outlined header-icon">inventory</span>
                      <h3>Welding Material</h3>
                    </div>
                    <table className="spec-table">
                      <tbody>
                        <tr>
                          <td className="font-label-caps label">Butt Rootpass</td>
                          <td className="font-label-mono value">{currentSpec.welding_material_butt_rootpass || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="font-label-caps label">Butt Fillerpass</td>
                          <td className="font-label-mono value">{currentSpec.welding_material_butt_fillerpass || "N/A"}</td>
                        </tr>
                        {/* <tr>
                          <td className="font-label-caps label">Non-butt Rootpass</td>
                          <td className="font-label-mono value">{currentSpec.welding_material_nobutt_rootpass || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="font-label-caps label">Non-butt Fillerpass</td>
                          <td className="font-label-mono value">{currentSpec.welding_material_nobutt_fillerpass || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="font-label-caps label">Socket Joint Material</td>
                          <td className="font-label-mono value">{currentSpec.welding_material_socket_joint || "N/A"}</td>
                        </tr> */}
                      </tbody>
                    </table>
                  </div>

                  {/* Preheat / PWHT Card (Thermal parameters) */}
                  <div className="bento-card full-width">
                    <div className="bento-card-header">
                      <span className="material-symbols-outlined header-icon">local_fire_department</span>
                      <h3>Preheat / PWHT Requirements</h3>
                    </div>
                    <div className="thermal-row">
                      <div className="thermal-item">
                        <div className="thermal-icon-container">
                          <span className="material-symbols-outlined">device_thermostat</span>
                        </div>
                        <div className="thermal-details">
                          <p className="font-label-caps label">Preheat Base Temp</p>
                          <p className="font-headline-sm value">
                            {currentSpec.preheat_base ? `${currentSpec.preheat_base}°C` : "10°C"}
                          </p>
                          {currentSpec.preheat_thk && (
                            <p className="font-body-sm label" style={{ marginTop: "2px" }}>
                              If thickness &gt; {currentSpec.preheat_thk}mm preheat: {currentSpec.preheat_above || "50"}°C
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="thermal-item">
                        <div className="thermal-icon-container">
                          <span className="material-symbols-outlined">timer</span>
                        </div>
                        <div className="thermal-details">
                          <p className="font-label-caps label">Interpass Max Temp</p>
                          <p className="font-headline-sm value">
                            {currentSpec.interpass || "Not Specified"}
                          </p>
                        </div>
                      </div>

                      <div className="thermal-item">
                        <div className="thermal-icon-container">
                          <span className="material-symbols-outlined">history</span>
                        </div>
                        <div className="thermal-details">
                          <p className="font-label-caps label">PWHT Requirement</p>
                          <p className="font-headline-sm value">
                            {currentSpec.pwht_temp ? `${currentSpec.pwht_temp}` : "No"}
                          </p>
                          {currentSpec.pwht_thk && (
                            <p className="font-body-sm label" style={{ marginTop: "2px" }}>
                              Thickness threshold: {currentSpec.pwht_thk}mm {currentSpec.pwht_min_hold ? `| Hold: ${currentSpec.pwht_min_hold}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Material Specs & Hardness */}
                  <div className="bento-card half-width">
                    <div className="bento-card-header">
                      <span className="material-symbols-outlined header-icon">inventory_2</span>
                      <h3>Specifications & Tolerance</h3>
                    </div>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="font-label-caps label">Max Hardness</span>
                        <span className="font-label-mono value">{currentSpec.hardness || "No Limit"}</span>
                      </div>
                      <div className="info-item">
                        <span className="font-label-caps label">Preheat Status</span>
                        <span className="font-label-mono value">{currentSpec.preheat_base ? "Mandatory" : "Standard 10°C"}</span>
                      </div>
                      {/* <div className="info-item">
                        <span className="font-label-caps label">Code Compliance</span>
                        <span className="font-label-mono value">{currentSpec.code || "ASME B31.3"}</span>
                      </div>
                      <div className="info-item">
                        <span className="font-label-caps label">Joint Preparation</span>
                        <span className="font-label-mono value">{currentSpec.joint_preparation || "Standard"}</span>
                      </div> */}
                    </div>
                  </div>

                  {/* Weld Visual Reference Card */}
                  {/* <div className="bento-card half-width">
                    <div className="weld-ref-card">
                      <img 
                        className="weld-ref-image" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgP-6qBLeSmKndHIVjq7c-UuWTgyZ-2FQTEFN79u0JzRR-GmmeJGg89D8asLNuYRB1hX0WhXTSmrdJCi-WIR5wuHa9kIqBh_ChLY6H-TpZ6zRHmmA2JdAGWSA1_nPlHmh0AVqdmZNTcpQhFb7Gk9-ahv9y-7BbdrxWLCxbI3PFbxR1VfbLqpWFn28NjIlXNaBhVXlKcg2VONmyT3ewKCDLVM0EbJg8PpwjiyiYYbuTiPoxXWnv0poCO-xFchHVHip0IpV9uVKRN8Q" 
                        alt="Standard Butt Weld Joint"
                      />
                      <div className="weld-ref-overlay">
                        <p className="font-label-caps weld-ref-caption">WELD REFERENCE: V-GROOVE BUTT JOINT</p>
                      </div>
                    </div>
                  </div> */}

                  {/* Technical Notes Card */}
                  {currentSpec.notes && (
                    <div className="bento-card full-width">
                      <div className="notes-card">
                        <div className="notes-card-title-row">
                          <span className="material-symbols-outlined">sticky_note_2</span>
                          <span className="font-label-caps">Technical Compliance Notes</span>
                        </div>
                        <ul className="notes-list">
                          {parseNotes(currentSpec.notes).map((note, index) => (
                            <li key={index} className="notes-item">
                              <span className="notes-marker"></span>
                              <p className="font-body-md notes-text">{note}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav-bar">
        <button
          className={`bottom-nav-item ${activeNavTab === "specs" ? "active" : ""}`}
          onClick={() => {
            setActiveNavTab("specs");
            // If selecting specs and we have a selected pipe, reset query
            if (selectedPipe) setSearchQuery(selectedPipe);
          }}
        >
          <span className="material-symbols-outlined nav-icon">format_list_bulleted</span>
          <span className="font-label-caps">Specs</span>
        </button>

        <button
          className={`bottom-nav-item ${activeNavTab === "search" ? "active" : ""}`}
          onClick={() => {
            setActiveNavTab("search");
          }}
        >
          <span className="material-symbols-outlined nav-icon">search</span>
          <span className="font-label-caps">Search</span>
        </button>

        <button
          className="bottom-nav-item"
          onClick={() => alert("Verification Standards are synchronized to ASME B31.3.")}
        >
          <span className="material-symbols-outlined nav-icon">verified</span>
          <span className="font-label-caps">Standards</span>
        </button>

        <button
          className={`bottom-nav-item ${activeNavTab === "history" ? "active" : ""}`}
          onClick={() => {
            setActiveNavTab("history");
          }}
        >
          <span className="material-symbols-outlined nav-icon">history</span>
          <span className="font-label-caps">History</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
