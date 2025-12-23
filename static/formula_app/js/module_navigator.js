document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const btnContinue = document.getElementById('btn_continue_dm');
    
    // Checkboxes
    const checkThinning = document.getElementById('dm_thinning');
    const checkSCC = document.getElementById('dm_scc');
    // const checkExternal = document.getElementById('dm_external'); // Future
    
    // Containers
    const selectionContainer = document.getElementById('damage_mechanism_selection');
    const moduleNavContainer = document.getElementById('module_nav_container');
    const moduleNavList = document.getElementById('module_nav_list');
    
    // Module ID Mapping
    const MODULES = {
        'thinning': document.getElementById('thinning_df_top_container'),
        'scc': document.getElementById('scc_module_top_container')
    };

    // State
    let activeModuleIds = [];
    const STORAGE_KEY = 'active_damage_mechanisms';

    // --- Initial Load ---
    restoreState();

    // --- Event Listeners ---

    if(btnContinue) {
        btnContinue.addEventListener('click', () => {
            initializeNavigation(true); // true = save state
        });
    }

    // --- Functions ---

    function initializeNavigation(shouldSave = false) {
        activeModuleIds = [];

        // Collect checked items
        if(checkThinning && checkThinning.checked) activeModuleIds.push('thinning');
        if(checkSCC && checkSCC.checked) activeModuleIds.push('scc');

        if(activeModuleIds.length === 0) {
            alert("Please select at least one active damage mechanism.");
            return;
        }

        // Hide Selection Screen
        selectionContainer.classList.add('hidden');

        // Build Tabs (including Back Button)
        buildTabs();

        // Show Nav Container
        moduleNavContainer.classList.remove('hidden');

        // Activate First Module (defaults to first in list)
        activateModule(activeModuleIds[0]);

        if(shouldSave) {
            saveState(activeModuleIds);
        }
    }

    function buildTabs() {
        moduleNavList.innerHTML = ''; // Clear existing

        // 1. "Back/Config" Button (First Item)
        const liBack = document.createElement('li');
        const btnBack = document.createElement('a');
        btnBack.className = "tab text-gray-500 font-bold hover:text-blue-600";
        btnBack.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Config
        `;
        btnBack.title = "Go back to selection";
        btnBack.addEventListener('click', resetSelection);
        liBack.appendChild(btnBack);
        moduleNavList.appendChild(liBack);

        // 2. Module Tabs
        activeModuleIds.forEach(id => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            
            // Stylize Tab
            a.className = "tab tab-lifted text-lg font-semibold"; 
            a.textContent = getModuleName(id);
            a.dataset.moduleId = id;

            a.addEventListener('click', () => {
                activateModule(id);
            });

            li.appendChild(a);
            moduleNavList.appendChild(li);
        });
    }

    function activateModule(targetId) {
        // 1. Hide all modules
        Object.values(MODULES).forEach(el => {
            if(el) el.classList.add('hidden');
        });

        // 2. Show target module
        const targetEl = MODULES[targetId];
        if(targetEl) {
            targetEl.classList.remove('hidden');
        }

        // 3. Update Tab Styles
        const tabs = moduleNavList.querySelectorAll('a.tab-lifted'); // Select only module tabs
        tabs.forEach(tab => {
            if(tab.dataset.moduleId === targetId) {
                tab.classList.add('tab-active', 'text-primary', 'bg-white');
                tab.classList.remove('text-gray-500');
            } else {
                tab.classList.remove('tab-active', 'text-primary', 'bg-white');
                tab.classList.add('text-gray-500');
            }
        });
        
        // Scroll to top
        const scroller = document.getElementById('content-scroller');
        if(scroller) scroller.scrollTop = 0;
    }

    function resetSelection() {
        // Return to Step 0
        moduleNavContainer.classList.add('hidden');
        selectionContainer.classList.remove('hidden');
        
        // Hide all modules
        Object.values(MODULES).forEach(el => {
            if(el) el.classList.add('hidden');
        });

        // Clear persistence? 
        // No, keep the checks, but let user change them.
        // sessionStorage.removeItem(STORAGE_KEY); 
    }

    function saveState(ids) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }

    function restoreState() {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if(stored) {
            try {
                const ids = JSON.parse(stored);
                if(Array.isArray(ids) && ids.length > 0) {
                    
                    // Restore Checkboxes
                    if(checkThinning) checkThinning.checked = ids.includes('thinning');
                    if(checkSCC) checkSCC.checked = ids.includes('scc');
                    
                    // Auto-Navigate
                    initializeNavigation(false); 
                }
            } catch(e) {
                console.warn("Formatting error in stored damage mechs", e);
            }
        }
    }

    function getModuleName(id) {
        switch(id) {
            case 'thinning': return 'Thinning DF';
            case 'scc': return 'SCC DF';
            case 'external': return 'External DF';
            default: return id.toUpperCase();
        }
    }

});
