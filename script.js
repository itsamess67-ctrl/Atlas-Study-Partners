

function toggleVersionInput(event) {
  // Prevent the click from bubbling up to other elements
  event.stopPropagation(); 
  
  // Find the bubble element
  const bubble = document.getElementById("versionInputBubble");
  
  // Toggle its display between 'block' (visible) and 'none' (hidden)
  if (bubble.style.display === "none" || bubble.style.display === "") {
    bubble.style.display = "block";
  } else {
    bubble.style.display = "none";
  }
}
  

// === Unified Settings & Canvas System ===

// 1. Canvas Mode Logic (Moved into Settings)
let isCanvasMode = localStorage.getItem("mathmaster_canvas_mode") === "true";
const settingsCanvasToggle = document.getElementById("settingsCanvasToggle");

if (settingsCanvasToggle) {
    settingsCanvasToggle.checked = isCanvasMode;
    settingsCanvasToggle.addEventListener('change', (e) => {
        isCanvasMode = e.target.checked;
        localStorage.setItem("mathmaster_canvas_mode", isCanvasMode);
        applyCanvasMode();
    });
}
applyCanvasMode(); // Run on load

function applyCanvasMode() {
    if (isCanvasMode) {
        document.title = "Dashboard"; // Disguise Name
        changeFavicon("Assets/Pictures/Non-edited/canvas-n.png");
    } else {
        document.title = "Math Master"; // Real Name
        changeFavicon("Assets/Pictures/Non-edited/Math-n.png");
    }
}

function changeFavicon(src) {
    const oldLink = document.getElementById("favicon");
    if (oldLink) oldLink.remove();
    const newLink = document.createElement("link");
    newLink.id = "favicon";
    newLink.rel = "icon";
    newLink.href = src;
    document.head.appendChild(newLink);
}

// 2. Viewer Controls Customization Logic
let viewerControlsConfig = JSON.parse(localStorage.getItem('mathmaster_controls')) || [
    { id: 'dashboard', label: '← Dashboard', action: 'goHome()' },
    { id: 'reload', label: 'Reload', action: 'reloadGame()' },
    { id: 'fullscreen', label: 'Fullscreen', action: 'toggleFullscreen()' },
    { id: 'newtab', label: 'Open New Tab', action: 'openInNewTab()' }
];

let viewerControlsVisibility = JSON.parse(localStorage.getItem('mathmaster_controls_vis')) || {
    'dashboard': true, 'reload': true, 'fullscreen': true, 'newtab': true
};

// Renders the floating buttons onto the iframe overlay
function renderViewerButtons() {
    const container = document.getElementById('viewerControlsContainer');
    if (!container) return;
    
    let html = '';
    viewerControlsConfig.forEach((ctrl, index) => {
        if (viewerControlsVisibility[ctrl.id]) {
            // Apply the spot class based directly on the array index
            html += `<button class="viewer-btn-spot spot-${index}" onclick="${ctrl.action}">${ctrl.label}</button>`;
        }
    });
    container.innerHTML = html;
}

// Renders the settings menu and visually labels the designated spot
function renderSettingsList() {
    const list = document.getElementById('controlsList');
    if (!list) return;
    
    const positionLabels = ["Top Left", "Bottom Left", "Bottom Middle", "Bottom Right"];
    
    let html = '';
    viewerControlsConfig.forEach((ctrl, index) => {
        const isVisible = viewerControlsVisibility[ctrl.id];
        const upDisabled = index === 0;
        const downDisabled = index === viewerControlsConfig.length - 1;
        const currentPosition = positionLabels[index] || "Unassigned";

        html += `
            <div class="settings-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div class="settings-arrows">
                        <svg onclick="event.stopPropagation(); ${upDisabled ? '' : `moveControl(${index}, -1)`}" class="settings-arrow-icon ${upDisabled ? 'disabled' : ''}" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        <svg onclick="event.stopPropagation(); ${downDisabled ? '' : `moveControl(${index}, 1)`}" class="settings-arrow-icon ${downDisabled ? 'disabled' : ''}" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: white; font-weight: 500; font-size: 14px;">${ctrl.label}</span>
                        <span style="color: var(--accent-color); font-size: 11px; font-weight: 600; text-transform: uppercase;">${currentPosition}</span>
                    </div>
                </div>
                <label class="ios-switch">
                    <input type="checkbox" onchange="toggleControlVis('${ctrl.id}', this.checked)" ${isVisible ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        `;
    });
    list.innerHTML = html;
}
// Actually moves the item in the array to reorder
function moveControl(index, direction) {
    const target = viewerControlsConfig[index];
    viewerControlsConfig.splice(index, 1); // Remove from old spot
    viewerControlsConfig.splice(index + direction, 0, target); // Insert into new spot
    saveAndRenderControls();
}

function toggleControlVis(id, isVisible) {
    viewerControlsVisibility[id] = isVisible;
    saveAndRenderControls();
}

function saveAndRenderControls() {
    localStorage.setItem('mathmaster_controls', JSON.stringify(viewerControlsConfig));
    localStorage.setItem('mathmaster_controls_vis', JSON.stringify(viewerControlsVisibility));
    renderSettingsList();
    renderViewerButtons();
}

function toggleSettingsUI() {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsBtn = document.getElementById('settingsBtn');
    const isActive = settingsPanel.classList.contains("active");
    
    closePopups(); // Close others first
    
    if (!isActive) {
        settingsPanel.classList.add("active");
        settingsBtn.classList.add("active-mode");
        renderSettingsList(); 
    }
}

// Initial render of the viewer buttons
renderViewerButtons();
/* ================= LOGIC ================= */

// === Save Tools ===

// === Save Tools ===

function exportSave() {
    // 1. Gather all data from LocalStorage
    const saveData = { ...localStorage };

    // 2. Create the blob (text format)
    const blob = new Blob(
        [JSON.stringify(saveData, null, 2)], 
        { type: "text/plain" }
    );

    // 3. Create download link with .save extension
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "mathmaster.save"; // <--- Custom extension
    
    // 4. Trigger download
    document.body.appendChild(a);
    a.click();
    
    // 5. Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function importSave(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // 1. Parse the file content
            const saveData = JSON.parse(e.target.result);
            
            // 2. Safety check (ensure it's an object)
            if (typeof saveData !== 'object' || saveData === null) {
                throw new Error("Invalid save file structure");
            }

            // 3. Confirm overwrite
            if (confirm("This will overwrite your current progress and reload the page. Are you sure?")) {
                // Clear existing data
                localStorage.clear();

                // Restore new data
                Object.keys(saveData).forEach(key => {
                    localStorage.setItem(key, saveData[key]);
                });

                // 4. Force Reload to apply changes
                alert("Save file loaded successfully!");
                window.location.reload(); 
            }
        } catch (err) {
            alert("Error: Could not load save file. Make sure it is a valid .save file.");
            console.error(err);
        }
    };
    reader.readAsText(file);
    
    // Reset input so you can select the same file again if needed
    event.target.value = '';
}




// === Element Selectors ===
const searchBar = document.getElementById('spotlightSearch');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const suggestionsEl = document.getElementById('suggestions');
const settingsPanel = document.getElementById('settingsPanel');
const settingsBtn = document.getElementById('settingsBtn');

// === Popup Helper ===
function closePopups() {
    searchBar.classList.remove('active');
    settingsPanel.classList.remove('active');
    searchBtn.classList.remove('active-mode');
    settingsBtn.classList.remove('active-mode');
}

// === Settings Logic ===
function toggleSettingsUI() {
    const isActive = settingsPanel.classList.contains('active');
    closePopups(); // Close others first
    
    if (!isActive) {
        settingsPanel.classList.add('active');
        settingsBtn.classList.add('active-mode');
        // Render the list of controls dynamically when opened
        if (typeof renderSettingsList === 'function') renderSettingsList(); 
    }
}

// === Search Logic ===
function toggleSearch() {
    const isActive = searchBar.classList.contains("active");
    closePopups(); // Close others first
    
    if (!isActive) {
        searchBar.classList.add("active");
        searchBtn.classList.add("active-mode");
        searchInput.focus();
    } else {
        searchInput.value = "";
        searchInput.dispatchEvent(new Event('input')); // Reset filter
    }
}

// Levenshtein Distance (needed for fuzzy AI scoring)
function levenshtein(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) {
    m[i] = [i];
    if (i === 0) for (let j = 1; j <= a.length; j++) m[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b[j - 1] === a[i - 1]
        ? m[i - 1][j - 1]
        : 1 + Math.min(m[i - 1][j - 1], m[i][j - 1], m[i - 1][j]);
    }
  }
  return m[b.length][a.length];
}

function scoreMatch(query, name) {
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes(q)) return 0;
  const dist = levenshtein(q, n);
  return dist + (n.startsWith(q[0]) ? -1 : 0);
}

searchInput.addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  const cards = [...document.querySelectorAll('#gameGrid .card')];
  suggestionsEl.innerHTML = "";

  if (!q) {
    cards.forEach(c => c.style.display = 'block');
    return;
  }

  let visible = cards.filter(c => c.querySelector('h3').textContent.toLowerCase().includes(q));

  // Fuzzy guessing if no exact match
  if (visible.length === 0 && typeof games !== "undefined") {
    const guesses = games.map(g => ({ name: g.name, score: scoreMatch(q, g.name) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    suggestionsEl.innerHTML = "Did you mean:<br>" + guesses.map(g => `<b>${g.name}</b>`).join("<br>");
    const best = guesses.map(g => g.name.toLowerCase());
    visible = cards.filter(c => best.includes(c.querySelector('h3').textContent.toLowerCase()));
  }

  cards.forEach(c => c.style.display = 'none');
  visible.forEach(c => c.style.display = 'block');
});



// Listener for the switch inside the popup
canvasToggleInput.addEventListener('change', (e) => {
    isCanvasMode = e.target.checked;
    localStorage.setItem("mathmaster_canvas_mode", isCanvasMode);
    applyCanvasMode();
});

function applyCanvasMode() {
    if (isCanvasMode) {
        document.title = "Dashboard"; // Disguise Name
        changeFavicon("Assets/Pictures/Non-edited/canvas-n.png");
    } else {
        document.title = "Math Master"; // Real Name
        changeFavicon("Assets/Pictures/Non-edited/Math-n.png");
    }
}

function changeFavicon(src) {
    const oldLink = document.getElementById("favicon");
    if (oldLink) oldLink.remove();
    
    const newLink = document.createElement("link");
    newLink.id = "favicon";
    newLink.rel = "icon";
    newLink.href = src;
    document.head.appendChild(newLink);
}

document.addEventListener('click', (e) => {
    const isDock = e.target.closest('.dock-container');
    const isTour = e.target.closest('#tourWelcomeModal') || e.target.closest('#tourTooltip');
    const isVersion = e.target.closest('.version-container'); // NEW: check if click is inside version area

    // Close dock popups
    if (!isDock && !isTour) closePopups();

    // NEW: Close version note bubble if click is outside the version area
    if (!isVersion) {
        const bubble = document.getElementById('versionInputBubble');
        if (bubble && bubble.style.display === 'flex') {
            bubble.style.display = 'none';
        }
    }
});
// Real-time Filtering
searchInput.addEventListener('input', e => filterGames(e.target.value));
function filterGames(query) {
  const q = query.toLowerCase().trim();
  const cards = [...document.querySelectorAll('#gameGrid .card')];
  suggestionsEl.innerHTML = "";

  if (!q) {
    cards.forEach(c => c.style.display = 'block');
    return;
  }

  let visible = cards.filter(c =>
    c.querySelector('h3').textContent.toLowerCase().includes(q)
  );

  // Fuzzy guessing only if no direct matches
  if (visible.length === 0 && typeof games !== "undefined") {

    const guesses = games.map(g => ({
      name: g.name,
      score: scoreMatch(q, g.name)
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

    suggestionsEl.innerHTML =
      "Did you mean:<br>" +
      guesses.map(g => `<b>${g.name}</b>`).join("<br>");

    const best = guesses.map(g => g.name.toLowerCase());

    visible = cards.filter(c =>
      best.includes(c.querySelector('h3').textContent.toLowerCase())
    );
  }

  cards.forEach(c => c.style.display = 'none');
  visible.forEach(c => c.style.display = 'block');
}



// === NEW: FIRST-TIME TOUR LOGIC (CORRECTED) ===
const tourWelcomeModal = document.getElementById('tourWelcomeModal');
const tourOverlay = document.getElementById('tourOverlay');
const tourTooltip = document.getElementById('tourTooltip');
const tourTextEl = document.getElementById('tourText');
const tourNextBtn = document.getElementById('tourNextBtn');
const tourEndBtn = document.getElementById('tourEndBtn');
tourNextBtn.addEventListener("click", nextTourStep);

let currentStep = 0;

const tourSteps = [
    {
        element: 'h1 .version', // Targets the version number span
        text: 'This is the **Version Number (v2.4)**, check here for update information!',
        position: 'bottom', // Tooltip appears below
        adjust: {y: 10, x: 0}
    },
    {
        element: '.header p a:nth-child(2)', // Unblock Form link
        text: 'The **Unblock Form** is a way to request access if the site is blocked.',
        position: 'bottom',
        adjust: {y: 10, x: 0}
    },
    {
        element: '.header p a:nth-child(1)', // Contact Us link
        text: 'The **Contact Us** link is where you can send a message, primarily for **Game Requests**!',
        position: 'bottom',
        adjust: {y: 10, x: 0}
    },
    {
        element: '.collapsible-header', // Credits button
        text: 'This is the **Credits Panel**. Click it to see the original creators of the games.',
        position: 'left',
        adjust: {y: 0, x: -10}
    },

    // --- NEW: Export & Import steps inserted right before the Search step ---
    {
        element: '#exportBtn',
        text: 'This is the **Export Save** button — use it to save your save in a .json file',
        position: 'top',
        adjust: {y: -10, x: 0}
    },
    {
        element: '#importBtn',
        text: 'This is the **Import Save** button — import .json file to get your saves back.',
        position: 'top',
        adjust: {y: -10, x: 0}
    },
    // --- end inserted steps ---

    {
        element: '#searchBtn', // Search button
        text: 'This is the **Search** button. It opens a quick search bar above the dock.',
        position: 'top',
        adjust: {y: -10, x: 0}
    },
    {
        element: '#settingsBtn', // Settings button
        text: 'This is **Site Settings**. Click it to open the settings panel, where the canvas mode and viewer controls can be customized!',
        position: 'top',
        adjust: {y: -10, x: 0}
    }

];

function startTour() {
    tourWelcomeModal.style.display = 'none';
    tourOverlay.style.display = 'block';
    currentStep = 0;
    showTourStep(currentStep);
}

function nextTourStep() {
    if (currentStep < tourSteps.length - 1) {
        currentStep++;
        showTourStep(currentStep);
    } else {
        // If it was the last step, end the tour.
        endTour(true);
    }
}

function endTour(completed) {
    // This key ensures the welcome modal never shows again.
    localStorage.setItem("mathmaster_tour_completed", "true");
    
    // Clean up tour elements
    tourWelcomeModal.style.display = 'none';
    tourOverlay.style.display = 'none';
    tourTooltip.style.opacity = '0';
    
    // Remove the highlight box
    const highlight = document.querySelector('.tour-highlight');
    if (highlight) highlight.remove();

    if (completed) {
        // Optional: show a quick success message after the tour
        // alert("Tour complete! Enjoy the new features!");
    }
}

function showTourStep(stepIndex) {
    const step = tourSteps[stepIndex];
    const targetElement = document.querySelector(step.element);

    if (!targetElement) {
        console.error(`Tour element not found for step ${stepIndex}: ${step.element}`);
        nextTourStep(); // Skip missing step
        return;
    }
    
    // 1. Update Tooltip Content and Buttons
    tourTextEl.innerHTML = step.text;
    if (stepIndex === tourSteps.length - 1) {
        tourNextBtn.style.display = 'none';
        tourEndBtn.style.display = 'block';
    } else {
        tourNextBtn.style.display = 'block';
        tourEndBtn.style.display = 'none';
    }

    // 2. Scroll to the element and prepare the highlight
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Use a short delay to allow scrolling/transition to finish before measuring
    setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        let highlight = document.querySelector('.tour-highlight');
        if (!highlight) {
            highlight = document.createElement('div');
            highlight.className = 'tour-highlight';
            tourOverlay.appendChild(highlight);
        }

        // Adjust highlight size/position (fixed to current scroll position)
        highlight.style.width = `${rect.width + 10}px`;
        highlight.style.height = `${rect.height + 10}px`;
        highlight.style.top = `${rect.top + window.scrollY - 5}px`;
        highlight.style.left = `${rect.left + window.scrollX - 5}px`;
        
        // 3. Position Tooltip
        let tooltipX, tooltipY;

        // Calculate default position relative to the center of the highlight
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        switch (step.position) {
            case 'top':
                tooltipX = centerX - tourTooltip.offsetWidth / 2;
                tooltipY = rect.top - tourTooltip.offsetHeight - 15 + (step.adjust.y || 0); 
                break;
            case 'bottom':
                tooltipX = centerX - tourTooltip.offsetWidth / 2;
                tooltipY = rect.bottom + 15 + (step.adjust.y || 0); 
                break;
            case 'left':
                tooltipX = rect.left - tourTooltip.offsetWidth - 15 + (step.adjust.x || 0);
                tooltipY = centerY - tourTooltip.offsetHeight / 2;
                break;
            case 'right':
                tooltipX = rect.right + 15 + (step.adjust.x || 0);
                tooltipY = centerY - tourTooltip.offsetHeight / 2;
                break;
            default: 
                tooltipX = centerX - tourTooltip.offsetWidth / 2;
                tooltipY = rect.bottom + 15;
        }
        
        // Simple screen boundary check (left/right)
        if (tooltipX < 10) tooltipX = 10;
        if (tooltipX + tourTooltip.offsetWidth > window.innerWidth - 10) {
            tooltipX = window.innerWidth - tourTooltip.offsetWidth - 10;
        }
        
        // Set final, visible position (relative to document/scroll)
        tourTooltip.style.left = `${tooltipX + window.scrollX}px`;
        tourTooltip.style.top = `${tooltipY + window.scrollY}px`;
        tourTooltip.style.opacity = '1';
        
    }, 400); 
}
// === END NEW TOUR LOGIC ===


// === Game Loading ===
const frame=document.getElementById("gameFrame");
const viewer=document.getElementById("viewer");
const grid=document.getElementById("gameGrid");
let currentSrc="";

function loadGame(p){
  currentSrc=p; frame.src=p;
  grid.style.display="none"; viewer.style.display="flex";
  document.querySelector('.dock-container').style.transform = "translate(-50%, 200%)"; // Hide dock
  window.scrollTo({top:viewer.offsetTop-20,behavior:"smooth"});
}
function goHome() {
    if (document.fullscreenElement) document.exitFullscreen();
    viewer.style.display = "none";
    grid.style.display = "grid";
    frame.src = "";
    document.querySelector('.dock-container').style.transform = "translateX(-50%)"; // Show dock
}
function reloadGame(){if(currentSrc)frame.src=currentSrc;}
function toggleFullscreen(){if(!document.fullscreenElement){viewer.requestFullscreen();}else{document.exitFullscreen();}}
function openInNewTab(){if(currentSrc)window.open(currentSrc,"_blank");}
function toggleCredits() {
    const p = document.getElementById("creditsPanel");
    p.style.display = (p.style.display === "block") ? "none" : "block";
}

// === Games List (Omitted for brevity, assumed unchanged) ===

const games = [
    // ... (Your game list here) ... 
  {name:"Chatbot", path:"https://personalfriend.zapier.app/", logo:"Assets/Pictures/Non-edited/Chatbot-n.png", external:true},
  {name:"Love Meter", path:"assets/game_data/love_meter.html", logo:"assets/pictures/edited/love_meter-ed.png"},
  {name:"12 Mini Battles", path:"Assets/Game Data/12 Mini Battles.html", logo:"Assets/Pictures/Non-edited/12MiniBattles-n.png"},
  {name:"1v1.lol", path:"Assets/Game Data/1v1lol/index.html", logo:"Assets/Pictures/Non-edited/1v1.lol-n.png"},
  {name:"2048", path:"Assets/Game Data/2048/index.html", logo:"Assets/Pictures/Non-edited/2048-n.png"},
  {name:"Among Us", path:"Assets/Game Data/among-us/index.html", logo:"Assets/Pictures/Non-edited/AmongUs-n.png"},
  {name:"Backrooms", path:"Assets/Game Data/backrooms/index.html", logo:"Assets/Pictures/Non-edited/Backrooms-n.png"},
  {name:"Bad Ice Cream", path:"Assets/Game Data/bad-ice-cream/index.html", logo:"Assets/Pictures/Non-edited/BadIceCream-n.png"},
  {name:"Baldis Basics", path:"Assets/Game Data/baldis-basics/index.html", logo:"Assets/Pictures/Non-edited/BaldiBasics-n.png"},
  {name:"Basketball Stars", path:"Assets/Game Data/basketball-stars/index.html", logo:"Assets/Pictures/Non-edited/BasketballStars-n.png"},
  {name:'Basket Random', path:'Assets/Game Data/basketrandom/index.html', logo:'Assets/Pictures/Non-edited/BasketRandom-n.jpg'},
  {name:'Bitlife', path:'Assets/Game Data/bitlife-main/bitlife-main/index.html', logo:'Assets/Pictures/Non-edited/Bitlife-n.jpg'},
  {name:"Block Blast", path:"Assets/Game Data/Block Blast.html", logo:"Assets/Pictures/Non-edited/BlockBlast-n.png"},
  {name:"Bridge Race", path:"Assets/Game Data/Bridge Race.html", logo:"Assets/Pictures/Non-edited/BridgeRace-n.png"},
  {name:'Boxing Random', path:'Assets/Game Data/boxingrandom/index.html', logo:'Assets/Pictures/Non-edited/BoxingRandom-n.jpg'},
  {name:'Breakout', path:'Assets/Game Data/breakout/index.html', logo:'Assets/Pictures/Non-edited/Breakout-n.png'},
  {name:"Candy Crush", path: "Assets/Game Data/Candy Crush.html", logo: "Assets/Pictures/Non-edited/CandyCrush-n.png"}, 
  {name:"Cluster Rush", path:"Assets/Game Data/cluster-rush/index.html", logo:"Assets/Pictures/Non-edited/ClusterTruck-n.png"},
  {name:"Cookie Clicker", path:"Assets/Game Data/cookieclicker/index.html", logo:"Assets/Pictures/Non-edited/CookieClicker-n.ico", external:true}, 
  {name:"Crossyroad", path:"Assets/Game Data/crossyroad/index.html", logo:"Assets/Pictures/Non-edited/CrossyRoad-n.png"},
   {name:'Chess', path:'Assets/Game Data/chess/index.html', logo:'Assets/Pictures/Non-edited/Chess-n.png'},
  {name:'Chrome Dino', path:'Assets/Game Data/chromedino/index.html', logo:'Assets/Pictures/Non-edited/DinosaurGame-n.png'},
  {name:"Drive Mad", path:"Assets/Game Data/drive-mad/index.html", logo:"Assets/Pictures/Non-edited/DriveMad-n.jpg"},
  {name:"Duck Life 4", path:"Assets/Game Data/ducklife4/index.html", logo:"Assets/Pictures/Non-edited/DuckLife4-n.jpg"},
   {name:'Doodle Jump', path:'Assets/Game Data/doodlejump/index.html', logo:'Assets/Pictures/Non-edited/DoodleJump-n.png'},
  {name:"Five Nights at Freddy's", path:"Assets/Game Data/Five Nights at Freddys.html", logo:"Assets/Pictures/Non-edited/FNAF-n.png"},
  {name:"Five Nights at Freddy's 2", path:"Assets/Game Data/Five Nights at Freddys 2.html", logo:"Assets/Pictures/Non-edited/FNAF2-n.png"},
  {name:"Five Nights at Freddy's 3", path:"Assets/Game Data/Five Nights at Freddys 3.html", logo:"Assets/Pictures/Non-edited/FNAF3-n.png"},
  {name:"Five Nights at Freddy's 4", path:"Assets/Game Data/Five Nights at Freddys 4.html", logo:"Assets/Pictures/Non-edited/FNAF4-n.png"},
  {name: "Free Rider Jumps", path: "Assets/Game Data/free_rider_jumps/index.html", logo: "Assets/Pictures/Non-edited/Free-n.webp"},
  {name:"Fruit Ninja", path:"Assets/Game Data/fruitninja/index.html", logo:"Assets/Pictures/Non-edited/FruitNinja-n.jpg"},
   {name:'Flappy Bird', path:'Assets/Game Data/flappybird/index.html', logo:'Assets/Pictures/Non-edited/FlappyBird-n.webp'},
  {name: 'Friday Night Funkin (For Jacob)', path: 'Assets/Game Data/Friday Night Funkin.html', logo: 'Assets/Pictures/Non-edited/Friday-n.png'},
   {name:'Geometry Dash', path:'Assets/Game Data/geometrydash/index.html', logo:'Assets/Pictures/Non-edited/GeometryDash-n.jpg'},
   {name:"Gobble", path:'Assets/Game Data/Gobble.html', logo:"Assets/Pictures/Non-edited/Gobble-n.png"},
  {name:"Granny", path:"Assets/Game Data/Granny.html", logo:"Assets/Pictures/Non-edited/Granny-n.png"},
   {name:'Idle Breakout', path:'Assets/Game Data/idle-breakout-main/idle-breakout-main/game.html', logo:'Assets/Pictures/Non-edited/IdleBreakout-n.png'},
   {name:'Super Mario Bros', path:'Assets/Game Data/mario/index.html', logo:"Assets/Pictures/Non-edited/Mario-n.png"},
   {name:'Monkey Mart', path: 'Assets/Game Data/monkeymart/index.html', logo:'Assets/Pictures/Non-edited/monkeymart-n.avif'},
  {name:"Minecraft", path:"Assets/Game Data/Minecraft 1.8.8.html", logo:"Assets/Pictures/Non-edited/Minecraft-n.png",external:true},
  {name:"Moto X3M 2", path:"Assets/Game Data/motox3m2/index.html", logo:"Assets/Pictures/Non-edited/Motox3m2-n.png"},
  {name:"Moto X3M 3", path:"Assets/Game Data/Moto X3M 3.html", logo:"Assets/Pictures/Non-edited/Motox3m3-n.png"},
  {name:"Moto X3M Pool Party", path:"Assets/Game Data/motox3m-pool/index.html", logo:"Assets/Pictures/Non-edited/Motox3mPool-n.jpg"},
  {name:"Moto X3M Spooky", path:"Assets/Game Data/motox3m-spooky/index.html", logo:"Assets/Pictures/Non-edited/Motox3mSpooky-n.jpeg"},
  {name:"Moto X3M Winter", path:"Assets/Game Data/motox3mwinter/index.html", logo:"Assets/Pictures/Non-edited/Motox3mWinter-n.webp"},
   {name:'Ovo', path:'Assets/Game Data/ovo/index.html', logo:'Assets/Pictures/Non-edited/ovo-n.png'},
   
   {name:'Pac-Man', path:'Assets/Game Data/pacman/index.html', logo:'Assets/Pictures/Non-edited/Pacman-n.png'},
  {name:"Paper io 2", path:"Assets/Game Data/paperio2/index.html", logo:"Assets/Pictures/Non-edited/Paperio2-n.png"},
 
  {name:"Plants Vs Zombies", path:"Assets/Game Data/Plants vs Zombies.html", logo:"Assets/Pictures/Non-edited/PlantsVsZombies-n.png"},
  {name: "Poly Track", path: "Assets/Game Data/poly-track/index.html", logo: "Assets/Pictures/Non-edited/Poly-n.png"},
  {name:"Red Ball 4", path:"Assets/Game Data/Red Ball 4.html", logo:"Assets/Pictures/Non-edited/RedBall4-n.png"},
  {name:"Red Ball 4 Vol. 2", path:"Assets/Game Data/Red Ball 4 Vol. 2.html", logo:"Assets/Pictures/Non-edited/RedBall4-2-n.png"},
  {name:"Red Ball 4 Vol. 3", path:"Assets/Game Data/Red Ball 4 Vol. 3.html", logo:"Assets/Pictures/Non-edited/RedBall4-3-n.png"},
  {name:"Retro Bowl", path:"Assets/Game Data/bowl/index.html", logo:"Assets/Pictures/Non-edited/Retrobowl-n.png"},
  {name:"Rooftop Snipers", path:"Assets/Game Data/rooftop-snipers/index.html", logo:"Assets/Pictures/Non-edited/RooftopSnipers-n.png"},
  {name:"Run", path:"Assets/Game Data/Run 1.html", logo:" Assets/Pictures/Non-edited/Run1-n.png"},
  {name: "Run 2", path: "Assets/Game Data/Run 2.html", logo: "Assets/Pictures/Non-edited/Run-2-n.png"},
  {name:"Run 3", path:"Assets/Game Data/Run 3.html", logo:"Assets/Pictures/Non-edited/Run3-n.png"},
 {name: "Soccer Random", path: "Assets/Game Data/Soccer-Random/index.html", logo: "Assets/Pictures/Non-edited/SoccerRandom-n.jpg"},
 {name: "Soundboard", path: "Assets/Game Data/soundboard/index.html", logo: "Assets/Pictures/Non-edited/Soundboard-n.jpg"},
 
  {name:'Slope', path:'Assets/Game Data/Slope-Game-main/Slope-Game-main/index.html', logo:'Assets/Pictures/Non-edited/Slope-n.png'},
  {name:"Slope 2", path:"Assets/Game Data/Slope 2.html", logo:"Assets/Pictures/Non-edited/Slope2-n.png"},
  {name:"Solar Smash", path:"Assets/Game Data/Solar Smash.html", logo:"Assets/Pictures/Non-edited/SolarSmash-n.png"},
  {name:"Station Saturn", path:"Assets/Game Data/Station Saturn.html", logo:"Assets/Pictures/Non-edited/StationSaturn-n.png"},
  {name:"Steal A Brainrot", path:"Assets/Game Data/Steal A Brainrot.html", logo:"Assets/Pictures/Non-edited/StealABrainrot-n.png"},
  {name:"Stickman Hook", path:"Assets/Game Data/stickman-hook/index.html", logo:"Assets/Pictures/Non-edited/Stickman-n.png"},
 

 {name:"Space Invaders", path:'Assets/Game Data/spaceinvaders/index.html', logo:'Assets/Pictures/Non-edited/SpaceInvaders-n.png'},
 {name:"Thats Not My Neighbor", path: 'Assets/Game Data/Thats Not My Neighbor.html', logo:"Assets/Pictures/Non-edited/ThatsNotMyNeighbor-n.png",external:true},
 
 {name:"The Impossible Quiz", path:"Assets/Game Data/the-impossible-quiz/index.html", logo:"Assets/Pictures/Non-edited/ImpossibleQuiz-n.webp"},
  {name:"The Man In The Window", path:"Assets/Game Data/The Man In The Window.html", logo:"Assets/Pictures/Non-edited/ManFromWindow-n.png"},
  {name:"Tomb of the Mask", path:"Assets/Game Data/Tomb Of The Mask.html", logo:"Assets/Pictures/Non-edited/TombOfMask-n.png"},
  {name:"Volleyball Random", path:"Assets/Game Data/Volley-Random/index.html", logo:"Assets/Pictures/Non-edited/VolleyRandom-n.webp"},
  {name:"Wordle", path:"Assets/Game Data/wordle/index.html", logo:"Assets/Pictures/Non-edited/Wordle-n.webp"},
  {name:"Worlds Hardest Game", path:"Assets/Game Data/worlds-hardest-game/index.html", logo:"Assets/Pictures/Non-edited/WorldHardestGame-n.jpeg"},
  {name:"Yohoho.io", path:"Assets/Game Data/YoHoHo.io-main/index.html", logo: "Assets/Pictures/Non-edited/yohoho-n.jpg"}
];

const gridEl=document.getElementById("gameGrid");
gridEl.innerHTML="";
for(const g of games){
 const c=document.createElement("div");
 c.className="card";
 c.innerHTML=`<img src="${g.logo}"><h3>${g.name}</h3>`;
 c.innerHTML+= g.external 
   ? `<button class="btn" onclick="window.open('${g.path}','_blank')">Open</button>`
   : `<button class="btn" onclick="loadGame('${g.path}')">Play</button>`;
 gridEl.appendChild(c);
}

// === Login System ===
const PASSWORD = "CabinTime2026!"
const MAX_DEVICES = 10;
const DEVICE_KEY = "mathmaster_device_id";
const MASTER_LIST_KEY = "mathmaster_registered_devices";

window.onload = function() {
    const gate = document.getElementById("loginGate");
    let deviceId = localStorage.getItem(DEVICE_KEY);
    let list = JSON.parse(localStorage.getItem(MASTER_LIST_KEY) || "[]");
    
    // Check Login Gate first
    if (deviceId && list.includes(deviceId)) {
        gate.style.display = "none";
        
        // After successful login, check if the tour has been completed
        if (localStorage.getItem("mathmaster_tour_completed") !== "true") {
            // Wait a moment for the rest of the page to load/render before showing the modal
            setTimeout(() => {
                tourWelcomeModal.style.display = "flex";
            }, 500); 
        }
    }
};

function checkPassword() {
    const input = document.getElementById("passwordInput").value;
    const remember = document.getElementById("rememberToggle").checked;
    const error = document.getElementById("loginError");
    const limit = document.getElementById("loginLimit");
    error.style.display = "none"; limit.style.display = "none";

    if (input !== PASSWORD) { error.style.display = "block"; return; }
    if (!remember) { document.getElementById("loginGate").style.display = "none"; return; }

    let list = JSON.parse(localStorage.getItem(MASTER_LIST_KEY) || "[]");
    if (list.length >= MAX_DEVICES) { limit.style.display = "block"; return; }
    
    const newId = crypto.randomUUID();
    list.push(newId);
    localStorage.setItem(DEVICE_KEY, newId);
    localStorage.setItem(MASTER_LIST_KEY, JSON.stringify(list));
    document.getElementById("loginGate").style.display = "none";
    
    // After login, show the tour for the first time
    if (localStorage.getItem("mathmaster_tour_completed") !== "true") {
        setTimeout(() => {
            tourWelcomeModal.style.display = "flex";
        }, 500); 
    }
}

