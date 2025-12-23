import { validateInputs } from './utils.js';



document.addEventListener('DOMContentLoaded', () => {
    
    // --- Selectors ---
    const sccCheckboxes = document.querySelectorAll('.scc-mech-check');
    const tabsContainer = document.getElementById('scc_tabs_container');
    const tabsList = document.getElementById('scc_tabs_list');
    const inputsPlaceholder = document.getElementById('scc_inputs_placeholder');
    
    const stepperControls = document.getElementById('scc_stepper_controls');
    const btnPrev = document.getElementById('btn_scc_prev');
    const btnNext = document.getElementById('btn_scc_next');

    // State
    let activeMechanisms = []; // Stores IDs: ['caustic', 'amine']
    let currentMechIndex = -1;

    // --- Interaction Logic ---
    
    sccCheckboxes.forEach(chk => {
        chk.addEventListener('change', (e) => {
            const mechId = e.target.id.replace('scc_mech_', ''); // e.g. 'caustic'
            
            if (e.target.checked) {
                if(!activeMechanisms.includes(mechId)) {
                    activeMechanisms.push(mechId);
                }
            } else {
                activeMechanisms = activeMechanisms.filter(id => id !== mechId);
            }

            // If we just added the first one, select it
            if (activeMechanisms.length === 1 && e.target.checked) {
                currentMechIndex = 0;
            } else if (currentMechIndex >= activeMechanisms.length) {
                // If we removed the last one we were looking at
                currentMechIndex = activeMechanisms.length - 1;
            }

            updateUI();
        });
    });

    if(btnPrev) {
        btnPrev.addEventListener('click', () => {
            if(currentMechIndex > 0) {
                currentMechIndex--;
                updateUI();
            }
        });
    }

    if(btnNext) {
        btnNext.addEventListener('click', () => {
            if(currentMechIndex < activeMechanisms.length - 1) {
                currentMechIndex++;
                updateUI();
            }
        });
    }

    // --- Core UI Functions ---

    function updateUI() {
        // 1. Toggle Tabs Visibility
        if(activeMechanisms.length > 0) {
            tabsContainer.classList.remove('hidden');
            stepperControls.classList.remove('hidden');
            inputsPlaceholder.classList.add('hidden');
        } else {
            tabsContainer.classList.add('hidden');
            stepperControls.classList.add('hidden');
            inputsPlaceholder.classList.remove('hidden');
            hideAllInputGroups();
            return;
        }

        // 2. Build Tabs
        renderTabs();

        // 3. Show Active Content
        hideAllInputGroups();
        if(currentMechIndex >= 0 && currentMechIndex < activeMechanisms.length) {
            const activeId = activeMechanisms[currentMechIndex];
            const activeContainer = document.getElementById(`cont_scc_${activeId}`);
            if(activeContainer) {
                activeContainer.classList.remove('hidden');
            } else {
                // Fallback for not-yet-implemented inputs
                console.warn(`Input interface for ${activeId} not found.`);
            }
        }

        // 4. Update Buttons
        if(btnPrev) btnPrev.disabled = (currentMechIndex <= 0);
        if(btnNext) btnNext.disabled = (currentMechIndex >= activeMechanisms.length - 1);
    }

    function renderTabs() {
        tabsList.innerHTML = '';
        
        activeMechanisms.forEach((mechId, index) => {
            const tab = document.createElement('a');
            tab.className = `tab flex-nowrap whitespace-nowrap ${index === currentMechIndex ? 'tab-active bg-white font-bold shadow-sm text-blue-900' : 'text-gray-500'}`;
            tab.textContent = formatMechName(mechId);
            
            tab.addEventListener('click', () => {
                currentMechIndex = index;
                updateUI();
            });

            tabsList.appendChild(tab);
        });
    }

    function hideAllInputGroups() {
        const groups = document.querySelectorAll('.scc-input-group');
        groups.forEach(g => g.classList.add('hidden'));
    }

    function formatMechName(id) {
        // Simple formatter
        const map = {
            'caustic': 'Caustic',
            'amine': 'Amine',
            'ssc': 'SSC',
            'hic_h2s': 'HIC/SOHIC-H2S',
            'acscc': 'Alk. Carbonate',
            'pascc': 'Polythionic',
            'ciscc': 'Chloride',
            'hsc_hf': 'HSC-HF',
            'hic_hf': 'HIC-HF'
        };
        return map[id] || id;
    }

    // --- Caustic Cracking Logic ---

    // --- Caustic Cracking Logic ---

    // Fetched Data Containers
    // Global variables to store chart data
let areaACurveData = null;
let severityIndexData = null;
let baseDamageFactorData = null; // Table 2.C.1.3 // Table 2.C.1.2
    let baseDFData = null; // Table 2.C.1.3

    // Load all necessary data
    Promise.all([
        fetch('/static/formula_app/data/json/scc_caustic_chart.json').then(r => r.json()),
        fetch('/static/formula_app/data/json/scc_severity_index.json').then(r => r.json()),
        fetch('/static/formula_app/data/json/scc_base_damage_factor.json').then(r => r.json())
    ])
    .then(([chartData, severityData, baseData]) => {
        areaACurveData = chartData;
        severityIndexData = severityData.mappings;
        baseDamageFactorData = baseData; // Use the direct data object if wrapped, typically my JSONs are wrapped in {data: ...}
        
        console.log("Caustic Data Loaded:", { areaACurveData, severityIndexData, baseDamageFactorData });
        
        // Initialize graph if image is present
        if (causticInputs.imgGraph) {
            causticInputs.imgGraph.onload = function() {
                // Initial draw (optional)
            };
        }
    })
    .catch(err => console.error("Error loading Caustic JSON data:", err));

    // Selectors for Caustic Inputs (Updated)
    const causticInputs = {
        cracksPresent: document.getElementById('scc_caustic_cracks_present'),
        cracksRemoved: document.getElementById('scc_caustic_cracks_removed'),
        stressRelieved: document.getElementById('scc_caustic_stress_relieved'),
        naohConc: document.getElementById('scc_caustic_naoh_conc'),
        temp: document.getElementById('scc_caustic_temp'),
        tempUnit: document.getElementById('scc_caustic_temp_unit'),
        isAreaA: document.getElementById('scc_caustic_area_a'),
        heatTraced: document.getElementById('scc_caustic_heat_traced'),
        steamedOut: document.getElementById('scc_caustic_steamed_out'),
        
        // Step 3
        divStep3: document.getElementById('div_scc_caustic_step3'),
        installDate: document.getElementById('scc_caustic_install_date'),
        valAge: document.getElementById('scc_caustic_age_val'),
        
        // Step 4
        divStep4: document.getElementById('div_scc_caustic_step4'),
        inspA: document.getElementById('scc_caustic_insp_A'),
        inspB: document.getElementById('scc_caustic_insp_B'),
        inspC: document.getElementById('scc_caustic_insp_C'),
        inspD: document.getElementById('scc_caustic_insp_D'),
        divStep4Result: document.getElementById('scc_caustic_step4_result'),
        valFinalEffCat: document.getElementById('scc_caustic_final_eff_cat'),
        valFinalEffCount: document.getElementById('scc_caustic_final_eff_count'),
        // Step 5
        divStep5: document.getElementById('div_scc_caustic_step5'),
        valBaseDF: document.getElementById('scc_caustic_base_df_val'),

        // Future Steps (Placeholders)

        // Containers
        divCracksRemoved: document.getElementById('div_scc_caustic_cracks_removed'),
        divStressRelieved: document.getElementById('div_scc_caustic_stress_relieved'),
        divDetails: document.getElementById('div_scc_caustic_details'),
        divHeatTraced: document.getElementById('div_scc_caustic_heat_traced'),
        divSteamedOut: document.getElementById('div_scc_caustic_steamed_out'),
        divExtendedCalcs: document.getElementById('div_scc_caustic_extended_calcs'),
        
        // Results
        divResult: document.getElementById('scc_caustic_result'),
        valSusceptibility: document.getElementById('scc_caustic_susceptibility_val'),
        valSVI: document.getElementById('scc_caustic_svi_val'),
        valBaseDF: document.getElementById('scc_caustic_base_df_val'),
        valFinalDF: document.getElementById('scc_caustic_final_df_val'),
        divGraph: document.getElementById('div_scc_caustic_graph'),
        imgGraph: document.querySelector('#div_scc_caustic_graph img') 
    };

    // Attach listeners
    Object.values(causticInputs).forEach(el => {
        if(el && (el.tagName === 'SELECT' || el.tagName === 'INPUT')) {
            el.addEventListener('change', updateCausticLogic);
            el.addEventListener('input', updateCausticLogic); 
        }
    });

    // ... isPointInAreaA ... 

    function updateCausticLogic() {
        // 1. Manage Visibility
        const cracksPresent = causticInputs.cracksPresent.value;
        const cracksRemoved = causticInputs.cracksRemoved.value;
        const stressRelieved = causticInputs.stressRelieved.value;
        const heatTraced = causticInputs.heatTraced.value;
        
        // Inputs for Graph Logic
        const tempUnit = causticInputs.tempUnit ? causticInputs.tempUnit.value : 'F';
        const naohConc = parseFloat(causticInputs.naohConc.value);
        const temp = parseFloat(causticInputs.temp.value);
        
        // 1b. Update Graph Image & Labels based on Unit
        if (causticInputs.imgGraph) {
            if (tempUnit === 'C') {
                causticInputs.imgGraph.src = "/static/formula_app/img/nace_caustic_graph_m.png";
                document.getElementById('scc_caustic_temp').previousElementSibling.querySelector('span').innerText = "Max Process Temperature (deg C)";
                document.getElementById('scc_caustic_temp').placeholder = "e.g. 65"; // C example
            } else {
                causticInputs.imgGraph.src = "/static/formula_app/img/nace_caustic_graph_f.png";
                document.getElementById('scc_caustic_temp').previousElementSibling.querySelector('span').innerText = "Max Process Temperature (deg F)";
                document.getElementById('scc_caustic_temp').placeholder = "e.g. 150"; // F example
            }
        }



    // Helper: Determine if point is in Area A (Curve Digitization)
        // Determine Area A automatically
        const areaA = isPointInAreaA(naohConc, temp);
        
        // We set the hidden checkbox state
        causticInputs.isAreaA.checked = areaA; 

        if (cracksPresent === 'Yes') {
            causticInputs.divCracksRemoved.classList.remove('hidden');
        } else {
            causticInputs.divCracksRemoved.classList.add('hidden');
        }

        // Show/Hide Stress Relieved
        let showStressRelieved = false;
        if (cracksPresent === 'No') {
            showStressRelieved = true;
        } 
        
        if (showStressRelieved) {
            causticInputs.divStressRelieved.classList.remove('hidden');
        } else {
            causticInputs.divStressRelieved.classList.add('hidden');
        }

        // Show/Hide Details (Graph Inputs)
        let showDetails = false;
        if (cracksPresent === 'No' && stressRelieved === 'No') {
            showDetails = true;
        }

        const divGraph = document.getElementById('div_scc_caustic_graph');
        const badgeOverlay = document.getElementById('scc_caustic_graph_overlay');
        const badgeText = document.getElementById('scc_caustic_graph_badge');

        if (showDetails) {
            causticInputs.divDetails.classList.remove('hidden');
            if(divGraph) divGraph.classList.remove('hidden');
        } else {
            causticInputs.divDetails.classList.add('hidden');
            if(divGraph) divGraph.classList.add('hidden');
        }

        // Validation & Auto-Graph Logic
        let isValid = true;
        if(showDetails) {
             isValid = validateInputs([causticInputs.naohConc, causticInputs.temp]);
             
             // If valid, update graph badge
             if (isValid && badgeOverlay) {
                 badgeOverlay.classList.remove('hidden');
                 if (areaA) {
                     badgeText.innerText = "In Area 'A' (Safe Zone)";
                     badgeText.className = "badge badge-lg p-4 shadow-xl text-lg font-bold badge-success text-white";
                 } else {
                     badgeText.innerText = "Not in Area 'A' (Susceptible)";
                     badgeText.className = "badge badge-lg p-4 shadow-xl text-lg font-bold badge-warning text-white";
                 }
             } else if (badgeOverlay) {
                 badgeOverlay.classList.add('hidden');
             }
        }

        // Show/Hide Dependent Details
        const naohHigh = (!isNaN(naohConc) && naohConc >= 5);
        
        let showHeatTraced = false;
        if (showDetails && isValid) {
            if (areaA) {
                // In Area A
                if (naohConc < 5) {
                    showHeatTraced = true;
                } else {
                    showHeatTraced = true;
                }
            } else {
                // Not in Area A
                if (naohConc >= 5) {
                    showHeatTraced = true;
                }
            }
        }

        if (showHeatTraced) {
            causticInputs.divHeatTraced.classList.remove('hidden');
        } else {
            causticInputs.divHeatTraced.classList.add('hidden');
        }

        // Steamed Out
        if (showHeatTraced && heatTraced === 'No') {
            causticInputs.divSteamedOut.classList.remove('hidden');
        } else {
            causticInputs.divSteamedOut.classList.add('hidden');
        }

        // 2. Calculate Susceptibility
        let susceptibility = null;
        if (isValid || cracksPresent === 'Yes' || stressRelieved === 'Yes') {
             susceptibility = calculateCausticSusceptibility();
        }
        
        // 3. Update Result UI & Extended
        console.log("Susceptibility Result:", susceptibility);
        if (susceptibility) {
            causticInputs.divResult.classList.remove('hidden');
            causticInputs.valSusceptibility.innerText = susceptibility;
            // causticInputs.divResult.className = `alert mt-4 shadow-lg ${getSusceptibilityClass(susceptibility)}`; // Removed per user request
            
            // 4. Extended Calculations (Now specifically Step 2)
            const divStep2 = document.getElementById('div_scc_caustic_step2');
            
            // Validate if we should proceed to Step 2
            // Don't show if Pending or FFS
            if (susceptibility.includes('FFS') || susceptibility.includes('Pending')) {
                 if(divStep2) divStep2.classList.add('hidden');
            } else {
                 if(divStep2) {
                     divStep2.classList.remove('hidden');
                     
                     // Execute Step 2 Logic
                     updateStep2SeverityIndex(susceptibility);
                     
                 } else {
                     console.error("CRITICAL: div_scc_caustic_step2 not found in DOM!");
                 }
            }
        } else {
            causticInputs.divResult.classList.add('hidden');
            const divStep2 = document.getElementById('div_scc_caustic_step2');
            if(divStep2) divStep2.classList.add('hidden');
        }
    }

    function updateStep2SeverityIndex(susceptibility) {
        if (!severityIndexData) {
            console.warn("SCC Severity Data not yet loaded.");
            return;
        }

        // Step 2: SVI Calculation
        let svi = 0;
        let category = 'None';
        
        if (susceptibility.includes('High')) category = 'High';
        else if (susceptibility.includes('Medium')) category = 'Medium';
        else if (susceptibility.includes('Low')) category = 'Low';
        else if (susceptibility.includes('Not')) category = 'None';
        
        svi = severityIndexData[category] || 0;
        
        // Update UI
        if(causticInputs.valSVI) {
             causticInputs.valSVI.innerText = svi;
             // Animate or highlight?
        }

        // Save to Session Storage
        sessionStorage.setItem('scc_caustic_svi', svi);
        sessionStorage.setItem('scc_caustic_susceptibility_cat', category);
        console.log(`Step 2 Complete: SVI=${svi} (Category=${category}) saved to SessionStorage.`);
        
        // Show Saved Message momentarily
        const msgSaved = document.getElementById('msg_step2_saved');
        if(msgSaved) {
            msgSaved.classList.remove('hidden');
            setTimeout(() => msgSaved.classList.add('hidden'), 3000);
        }

        // Reveal Step 3 (Logic for future steps)
        if(causticInputs.divStep3) {
            causticInputs.divStep3.classList.remove('hidden');
        }
    }

    // --- Step 3 Logic: Age Calculation ---
    if(causticInputs.installDate) {
        causticInputs.installDate.addEventListener('change', calculateAgeFromDate);
    }
    
    function calculateAgeFromDate() {
        const dateVal = causticInputs.installDate.value;
        if (!dateVal) return;

        const installDate = new Date(dateVal);
        const currentDate = new Date();
        
        // Calculate difference in milliseconds
        const diffTime = Math.abs(currentDate - installDate);
        // Convert to years (approximate using 365.25 days)
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        
        const age = diffYears.toFixed(2); // 2 decimal places
        
        // Update UI
        if(causticInputs.valAge) {
            causticInputs.valAge.innerText = age;
        }

        // Save to Session
        sessionStorage.setItem('scc_caustic_age', age);
        console.log(`Step 3 Complete: Age=${age} years.`);
        
        // Reveal Step 4 (Placeholder for now)
        // const divStep4 = document.getElementById('div_scc_caustic_steps_4_6');
        // if(divStep4) divStep4.classList.remove('hidden');
    }

    // Initialize: Check if session has age
    // (Optional: restore date if needed, but not critical for now)    
    // --- Step 3 Logic: Age Calculation ---
    if(causticInputs.installDate) {
        causticInputs.installDate.addEventListener('change', calculateAgeFromDate);
    }
    
    function calculateAgeFromDate() {
        const dateVal = causticInputs.installDate.value;
        if (!dateVal) return;

        const installDate = new Date(dateVal);
        const currentDate = new Date();
        
        // Calculate difference in milliseconds
        const diffTime = currentDate - installDate;
        
        // Basic validation: Future dates
        if(diffTime < 0) {
            alert("Installation date cannot be in the future.");
            causticInputs.installDate.value = '';
            causticInputs.valAge.innerText = '--';
            return;
        }

        // Convert to years (approximate using 365.25 days)
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        const age = diffYears.toFixed(2); // 2 decimal places
        
        // Update UI
        if(causticInputs.valAge) {
            causticInputs.valAge.innerText = age;
        }

        // Save to Session
        sessionStorage.setItem('scc_caustic_age', age);
        console.log(`Step 3 Complete: Age=${age} years.`);
        
        // Reveal Step 4
        const divStep4 = document.getElementById('div_scc_caustic_step4');
        if(divStep4) divStep4.classList.remove('hidden');
    }
    
    // --- Step 4 Logic: Inspection Effectiveness ---
    // Register listeners
    ['A', 'B', 'C', 'D'].forEach(cat => {
        const el = causticInputs[`insp${cat}`];
        if (el) el.addEventListener('change', calculateInspectionEffectiveness);
    });

    function calculateInspectionEffectiveness() {
        // Get raw counts
        let countA = parseInt(causticInputs.inspA.value) || 0;
        let countB = parseInt(causticInputs.inspB.value) || 0;
        let countC = parseInt(causticInputs.inspC.value) || 0;
        let countD = parseInt(causticInputs.inspD.value) || 0;

        // Apply Equivalence Rule (2 Lower = 1 Higher)
        // 2D -> 1C
        countC += Math.floor(countD / 2);
        // 2C -> 1B
        countB += Math.floor(countC / 2);
        // 2B -> 1A
        countA += Math.floor(countB / 2);

        // Determine Highest Effective Category
        let finalCat = 'E'; // Default None
        let finalCount = 0;

        if (countA > 0) {
            finalCat = 'A';
            finalCount = countA;
        } else if (countB > 0) {
            finalCat = 'B';
            finalCount = countB;
        } else if (countC > 0) {
            finalCat = 'C';
            finalCount = countC;
        } else if (countD > 0) { // Should rarely happen if everything promotes, but possible if only 1D exists
            finalCat = 'D';
            finalCount = countD;
        }

        // Update UI
        if (causticInputs.divStep4Result) {
            causticInputs.divStep4Result.classList.remove('hidden');
            causticInputs.valFinalEffCat.innerText = finalCat;
            causticInputs.valFinalEffCount.innerText = finalCount;
            
            // Highlight E if no effective inspections
            if(finalCat === 'E') {
                 causticInputs.valFinalEffCat.className = "font-bold text-red-600";
            } else {
                 causticInputs.valFinalEffCat.className = "font-bold text-blue-800";
            }
        }

        // Save to Session
        sessionStorage.setItem('scc_caustic_insp_eff', finalCat);
        sessionStorage.setItem('scc_caustic_insp_count', finalCount);
        console.log(`Step 4 Complete: Final Category=${finalCat}, Count=${finalCount}`);

        // Trigger Step 5
        const currentSVI = sessionStorage.getItem('scc_caustic_svi');
        if (currentSVI) {
             calculateBaseDamageFactor(currentSVI, finalCat, finalCount);
        } else {
             console.warn("Step 5 postponed: Missing SVI from Step 2.");
        }
    }
    function isPointInAreaA(conc, temp) {
        if (isNaN(conc) || isNaN(temp)) return false;
        
        const unit = causticInputs.tempUnit ? causticInputs.tempUnit.value : 'F';
        if (!areaACurveData) {
             console.warn("Graph data not loaded yet.");
             return false;
        }
        let curvePoints = (unit === 'C') ? areaACurveData.area_a_curve_c : areaACurveData.area_a_curve_f;


        if (!curvePoints || curvePoints.length === 0) {
            console.warn("Graph points empty.");
            return false;
        }

        // Linear Interpolation
        let maxTemp = 0;
        if (conc < 0) return false;
        if (conc > 50) return false; // Area A is typically low concentration/temp.
        
        for (let i = 0; i < curvePoints.length - 1; i++) {
            const p1 = curvePoints[i];
            const p2 = curvePoints[i+1];
            if (conc >= p1.c && conc <= p2.c) {
                const ratio = (conc - p1.c) / (p2.c - p1.c);
                maxTemp = p1.t + ratio * (p2.t - p1.t);
                break;
            }
        }
        
        return temp <= maxTemp;
    }


    


    function calculateCausticSusceptibility() {
        const cracksPresent = causticInputs.cracksPresent.value;
        const cracksRemoved = causticInputs.cracksRemoved.value;
        const stressRelieved = causticInputs.stressRelieved.value;
        
        if (!cracksPresent) return null;

        // Path 1: Cracks Present
        if (cracksPresent === 'Yes') {
            if (!cracksRemoved) return 'High Susceptibility (Pending: Have cracks been removed?)';
            if (cracksRemoved === 'No') return 'FFS (Fitness For Service Evaluation Required)';
            return 'High Susceptibility';
        } 
        
        // Path 2: No Cracks
        if (!stressRelieved) return null;
        if (stressRelieved === 'Yes') return 'Not Susceptible';
        
        // Path 3: Detailed Analysis
        const naohConc = parseFloat(causticInputs.naohConc.value);
        const temp = parseFloat(causticInputs.temp.value);
        const heatTraced = causticInputs.heatTraced.value;
        const steamedOut = causticInputs.steamedOut.value;

        if (isNaN(naohConc) || isNaN(temp)) return null;

        const areaA = isPointInAreaA(naohConc, temp);

        if (areaA) {
            // Plot in Area "A" (Safe Zone)
            if (naohConc < 5) {
                // < 5%
                if (!heatTraced) return null;
                if (heatTraced === 'Yes') return 'Medium Susceptibility'; // Left-most path
                
                if (!steamedOut) return null;
                if (steamedOut === 'Yes') return 'Low Susceptibility';
                return 'Not Susceptible';
                
            } else {
                // >= 5%
                if (!heatTraced) return null;
                if (heatTraced === 'Yes') return 'High Susceptibility';
                
                if (!steamedOut) return null;
                if (steamedOut === 'Yes') return 'Medium Susceptibility';
                return 'Not Susceptible'; // Corrected per flowchart: Area A -> >=5% -> Heat Traced No -> Steamed Out No -> Not Susceptible.
            }
        } else {
            // Not in Area A (Unsafe Zone)
             if (naohConc < 5) {
                 return 'Medium Susceptibility';
             } else {
                 // >= 5%
                 if (!heatTraced) return null;
                 if (heatTraced === 'Yes') return 'High Susceptibility';
                 
                 if (!steamedOut) return null;
                 if (steamedOut === 'Yes') return 'Medium Susceptibility';
                 return 'High Susceptibility';
             }
        }
    }

    function getSusceptibilityClass(suscept) {
        if (!suscept) return '';
        if (suscept.includes('High')) return 'alert-error';
        if (suscept.includes('Medium')) return 'alert-warning';
        if (suscept.includes('Low')) return 'alert-success'; 
        if (suscept.includes('Not')) return 'alert-success';
        if (suscept.includes('FFS')) return 'alert-error';
        return 'alert-info';
    }

    // --- Step 5 Logic: Base Damage Factor ---
    function calculateBaseDamageFactor(svi, effCat, effCount) {
        if (!baseDamageFactorData || !baseDamageFactorData.data) {
             console.warn("Base Damage Factor data not loaded yet.");
             return; 
        }

        // Validate SVI (from Step 2)
        const validSVIKeys = Object.keys(baseDamageFactorData.data);
        const sviKey = String(svi);

        if (!validSVIKeys.includes(sviKey)) {
            console.error("Invalid SVI for Base DF lookup:", svi);
            return;
        }

        // Validate Effectiveness Category
        let baseDF = 0;
        const lookup = baseDamageFactorData.data[sviKey];

        if (effCat === 'E' || effCount <= 0) {
             // Use the "E" key for no inspection
             baseDF = lookup['E'];
        } else {
             // Cap count at highest key available (likely 6)
             // JSON keys "1" to "6".
             let countKey = effCount > 6 ? "6" : String(effCount);
             
             // Safer lookup
             if (lookup[countKey] && lookup[countKey][effCat] !== undefined) {
                 baseDF = lookup[countKey][effCat];
             } else {
                 console.warn("Lookup failed for count/cat:", countKey, effCat);
                 baseDF = lookup['E']; // Conservative fallback
             }
        }

        // Update UI
        if (causticInputs.divStep5) {
             causticInputs.divStep5.classList.remove('hidden');
        }
        if (causticInputs.valBaseDF) {
             causticInputs.valBaseDF.innerText = baseDF;
        }

        // Save to Session
        sessionStorage.setItem('scc_caustic_base_df', baseDF);
        console.log(`Step 5 Complete: Base DF=${baseDF}`);
        
        // Trigger Step 6
        calculateFinalDamageFactor();
    }

    // --- Step 6 Logic: Final Damage Factor ---
    function calculateFinalDamageFactor() {
        const baseDF = parseFloat(sessionStorage.getItem('scc_caustic_base_df'));
        const age = parseFloat(sessionStorage.getItem('scc_caustic_age'));
        
        // Selectors
        const divStep6 = document.getElementById('div_scc_caustic_step6');
        const valFinalDF = document.getElementById('scc_caustic_final_df_val');
        const msgFinal = document.getElementById('scc_caustic_final_msg');

        if (isNaN(baseDF) || isNaN(age)) {
             console.warn("Missing inputs for Step 6:", { baseDF, age });
             return;
        }

        // Equation 2.C.3
        // Df = min( BaseDF * (max(age, 1.0))^1.1, 5000 )
        
        const timeFactor = Math.pow(Math.max(age, 1.0), 1.1);
        let finalDF = baseDF * timeFactor;
        
        // Cap at 5000
        if (finalDF > 5000) finalDF = 5000;
        
        // Round for display
        finalDF = parseFloat(finalDF.toFixed(1)); // 1 decimal place? Or integer? Standard practice is usually 1-2 decimals or int if large.

         // Update UI
         if (divStep6) {
             divStep6.classList.remove('hidden');
             divStep6.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }
         if (valFinalDF) {
             valFinalDF.innerText = finalDF;
         }
         if (msgFinal) {
             msgFinal.classList.remove('hidden');
         }

         sessionStorage.setItem('scc_caustic_final_df', finalDF);
         console.log(`Step 6 Complete: Final DF=${finalDF}`);
    }

});
