/* ==========================================================================
   EcoTrace AI - Front-end App Controllers & Chart Handlers
   ========================================================================== */

// Global App State
const state = {
  currentTab: 'dashboard',
  calculator: {
    step: 1,
    electricity: 75,
    heating: 'natural-gas',
    solar: 'none',
    commute: 100,
    vehicleType: 'gasoline',
    flights: 5,
    diet: 'heavy-meat',
    waste: 'high',
    recycle: 'no',
    result: { total: 0, energy: 0, transport: 0, lifestyle: 0 }
  },
  history: [
    { date: 'Initial (1 Year Ago)', total: 11.2 },
    { date: '6 Months Ago', total: 9.8 }
  ],
  goals: [
    { id: 'goal-led', title: 'Switch to LED Lighting', desc: 'Replace old bulbs with highly efficient LEDs.', impact: 0.15, completed: false },
    { id: 'goal-thermostat', title: 'Smart Thermostat Adjustment', desc: 'Set heating lower by 2°F during winter nights.', impact: 0.25, completed: false },
    { id: 'goal-transit', title: 'Eco Transit Day', desc: 'Leave the car home and ride public transit once a week.', impact: 0.85, completed: false },
    { id: 'goal-diet', title: 'Eat Plant-Based for 3 Days', desc: 'Swap red meat for plant alternatives.', impact: 0.40, completed: false },
    { id: 'goal-compost', title: 'Compost Organic Waste', desc: 'Avoid food decay in landfill, reducing methane.', impact: 0.20, completed: false },
    { id: 'goal-vampire', title: 'Unplug Standby Appliances', desc: 'Eliminate standby power drain on home electronics.', impact: 0.08, completed: false }
  ],
  nnSim: {
    model: null,
    isTraining: false,
    epoch: 0,
    accumulatedSavings: 0.0,
    gridDemand: 5.0,
    solarOutput: 2.0,
    batterySOC: 0.5,
    carbonIntensity: 350,
    animationFrameId: null
  }
};

// Global Charts
let breakdownChart = null;
let historyChart = null;

// ==========================================================================
// Initialization
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  // Load default carbon calculations
  runLiveCalculator();
  
  // Initialize charts
  initCharts();
  
  // Render Goals checklist
  renderGoalsList();
  
  // Setup Neural Network simulator
  initNNSimulator();

  // Resize canvas when tab changes
  window.addEventListener('resize', () => {
    resizeNNCanvas();
  });
});

// ==========================================================================
// Tab Switching System
// ==========================================================================
function switchTab(tabId) {
  state.currentTab = tabId;
  
  // Update Buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.classList.remove('ai-active');
  });
  
  const activeBtn = document.getElementById(`btn-tab-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    if (tabId === 'grid' || tabId === 'chat') {
      activeBtn.classList.add('ai-active');
    }
  }

  // Update Sections
  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.classList.remove('active');
  });
  
  const activeSection = document.getElementById(`tab-${tabId}`);
  if (activeSection) {
    activeSection.classList.add('active');
  }

  // Handle page-specific updates
  if (tabId === 'dashboard') {
    updateDashboardUI();
    // Re-render charts
    if (breakdownChart && historyChart) {
      breakdownChart.resize();
      historyChart.resize();
    }
  } else if (tabId === 'grid') {
    setTimeout(() => {
      resizeNNCanvas();
      drawNetwork();
    }, 100);
  }
}

// ==========================================================================
// Data Visualization (Chart.js)
// ==========================================================================
function initCharts() {
  const ctxBreakdown = document.getElementById('breakdownChart').getContext('2d');
  const ctxHistory = document.getElementById('historyChart').getContext('2d');

  // Breakdown Doughnut Chart
  breakdownChart = new Chart(ctxBreakdown, {
    type: 'doughnut',
    data: {
      labels: ['Household Energy', 'Transportation', 'Lifestyle & Diet'],
      datasets: [{
        data: [state.calculator.result.energy, state.calculator.result.transport, state.calculator.result.lifestyle],
        backgroundColor: ['#10b981', '#06b6d4', '#8b5cf6'],
        borderColor: '#0b0f19',
        borderWidth: 2,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { family: 'Outfit', size: 12 }
          }
        }
      }
    }
  });

  // History Line Chart
  const historyLabels = state.history.map(h => h.date);
  const historyData = state.history.map(h => h.total);

  historyChart = new Chart(ctxHistory, {
    type: 'line',
    data: {
      labels: historyLabels,
      datasets: [{
        label: 'Carbon Footprint Trend',
        data: historyData,
        fill: true,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#0b0f19',
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Inter' } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { family: 'Inter' } }
        }
      }
    }
  });
}

function updateCharts() {
  if (breakdownChart) {
    breakdownChart.data.datasets[0].data = [
      state.calculator.result.energy,
      state.calculator.result.transport,
      state.calculator.result.lifestyle
    ];
    breakdownChart.update();
  }

  if (historyChart) {
    historyChart.data.labels = state.history.map(h => h.date);
    historyChart.data.datasets[0].data = state.history.map(h => h.total);
    historyChart.update();
  }
}

// ==========================================================================
// Carbon Calculator Controllers
// ==========================================================================
function updateRangeLabel(labelId, value, suffix) {
  document.getElementById(labelId).innerText = value + suffix;
  runLiveCalculator();
}

function changeCalcStep(direction) {
  const currentStep = state.calculator.step;
  const targetStep = currentStep + direction;
  
  if (targetStep < 1 || targetStep > 3) return;

  // Toggle Steps
  document.getElementById(`calc-step-${currentStep}`).classList.remove('active');
  document.getElementById(`step-node-${currentStep}`).classList.remove('active');
  if (direction > 0) {
    document.getElementById(`step-node-${currentStep}`).classList.add('completed');
  } else {
    document.getElementById(`step-node-${targetStep}`).classList.remove('completed');
  }

  document.getElementById(`calc-step-${targetStep}`).classList.add('active');
  document.getElementById(`step-node-${targetStep}`).classList.add('active');

  // Update State
  state.calculator.step = targetStep;

  // Update Nav Buttons
  document.getElementById('calc-btn-prev').disabled = (targetStep === 1);
  const nextBtn = document.getElementById('calc-btn-next');
  if (targetStep === 3) {
    nextBtn.innerHTML = 'Add to Dashboard <i class="fa-solid fa-cloud-arrow-up"></i>';
    nextBtn.onclick = addToDashboard;
  } else {
    nextBtn.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.onclick = () => changeCalcStep(1);
  }
}

function runLiveCalculator() {
  // Collect inputs
  state.calculator.electricity = parseFloat(document.getElementById('input-electricity').value);
  state.calculator.heating = document.getElementById('input-heating').value;
  state.calculator.solar = document.getElementById('input-solar').value;
  state.calculator.commute = parseFloat(document.getElementById('input-commute').value);
  state.calculator.vehicleType = document.getElementById('input-vehicle-type').value;
  state.calculator.flights = parseFloat(document.getElementById('input-flights').value);
  state.calculator.diet = document.getElementById('input-diet').value;
  state.calculator.waste = document.getElementById('input-waste').value;
  state.calculator.recycle = document.getElementById('input-recycle').value;

  // Run calculation logic
  const res = calculateFootprint(state.calculator);
  state.calculator.result = res;

  // Update live side panel score
  document.getElementById('calc-footprint-value').innerText = res.total.toFixed(1);
  
  // Update badge and text
  const badge = document.getElementById('calc-status-badge');
  badge.className = 'score-status';
  if (res.total < 4.0) {
    badge.innerText = 'Low Carbon';
    badge.classList.add('status-low');
  } else if (res.total < 10.0) {
    badge.innerText = 'Moderate';
    badge.classList.add('status-medium');
  } else {
    badge.innerText = 'High Impact';
    badge.classList.add('status-high');
  }

  // Generate recommendations
  const recs = generateAIRecommendations(state.calculator, res);
  const recsContainer = document.getElementById('calc-recs-container');
  recsContainer.innerHTML = '';
  
  recs.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'rec-card';
    card.innerHTML = `
      <div class="rec-icon"><i class="fa-solid ${rec.icon}"></i></div>
      <div class="rec-details">
        <h4>${rec.title}</h4>
        <p>${rec.desc}</p>
        <span class="impact-badge">-${rec.impact} Tons CO₂e Potential</span>
      </div>
    `;
    recsContainer.appendChild(card);
  });
}

function addToDashboard() {
  // Add current calculation to history
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  // Calculate total offset based on active goals
  const activeOffset = getActiveGoalsOffset();
  const footprintScore = Math.max(0.05, state.calculator.result.total - activeOffset);
  
  state.history.push({
    date: dateStr,
    total: parseFloat(footprintScore.toFixed(2))
  });

  // Highlight message and slide transition
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.75 }
  });

  // Update charts
  updateCharts();

  // Reset steps wizard
  changeCalcStep(-2);
  switchTab('dashboard');
}

// ==========================================================================
// Dashboard Logic
// ==========================================================================
function updateDashboardUI() {
  if (state.history.length === 0) return;

  // Get current active calculation score
  const lastCalculation = state.history[state.history.length - 1].total;
  
  document.getElementById('dashboard-footprint-value').innerText = lastCalculation.toFixed(1);

  // Update Rating Badge
  const badge = document.getElementById('dashboard-status-badge');
  badge.className = 'score-status';
  
  const textVsAvg = document.getElementById('dashboard-vs-average');
  const avgUS = 15.0; // Metric Tons CO2 US national average
  const percentage = Math.round(((avgUS - lastCalculation) / avgUS) * 100);

  if (lastCalculation < 4.0) {
    badge.innerText = 'Low Carbon';
    badge.classList.add('status-low');
  } else if (lastCalculation < 10.0) {
    badge.innerText = 'Moderate';
    badge.classList.add('status-medium');
  } else {
    badge.innerText = 'High Impact';
    badge.classList.add('status-high');
  }

  if (percentage >= 0) {
    textVsAvg.innerHTML = `<span class="text-white font-weight-600">${percentage}% Lower</span> than US national average (15t)`;
  } else {
    textVsAvg.innerHTML = `<span class="text-white font-weight-600">${Math.abs(percentage)}% Higher</span> than US national average (15t)`;
  }

  // Update Dashboard Insights List
  const insightsContainer = document.getElementById('dashboard-insights-container');
  insightsContainer.innerHTML = '';

  const activeRecs = generateAIRecommendations(state.calculator, state.calculator.result);
  activeRecs.forEach(rec => {
    const item = document.createElement('div');
    item.className = 'insight-item';
    item.innerHTML = `
      <div class="insight-icon"><i class="fa-solid ${rec.icon}"></i></div>
      <div class="insight-content">
        <h4>${rec.title}</h4>
        <p>${rec.desc}</p>
      </div>
    `;
    insightsContainer.appendChild(item);
  });

  if (activeRecs.length === 0) {
    insightsContainer.innerHTML = `
      <div class="insight-item">
        <div class="insight-icon"><i class="fa-solid fa-award"></i></div>
        <div class="insight-content">
          <h4>Excellent Work!</h4>
          <p>You have reduced your footprint across all energy and lifestyle metrics. Maintain your eco routine!</p>
        </div>
      </div>
    `;
  }
}

// ==========================================================================
// EcoBot Chat Interface
// ==========================================================================
function sendChatPrompt(text) {
  document.getElementById('chat-user-input').value = text;
  handleChatSubmit();
}

function handleChatSubmit() {
  const inputEl = document.getElementById('chat-user-input');
  const messageText = inputEl.value.trim();
  if (messageText === '') return;

  // Append user bubble
  appendChatMsg(messageText, 'user');
  inputEl.value = '';

  // Append temporary bot typing bubble
  const chatBox = document.getElementById('chat-messages-box');
  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-msg bot typing';
  typingBubble.innerText = 'Consulting database';
  chatBox.appendChild(typingBubble);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Process response after delay
  setTimeout(() => {
    typingBubble.remove();
    const response = queryEcoBot(messageText);
    appendChatMsg(response, 'bot');
  }, 900);
}

function appendChatMsg(text, sender) {
  const chatBox = document.getElementById('chat-messages-box');
  const bubble = document.createElement('div');
  bubble.className = `chat-msg ${sender}`;
  
  // Format basic markdown elements
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

  bubble.innerHTML = formatted;
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ==========================================================================
// Neural Network Smart Grid Simulator
// ==========================================================================
let canvas = null;
let ctx = null;

function initNNSimulator() {
  // Setup standard network (4 inputs, 5 hidden neurons, 1 output neuron)
  state.nnSim.model = new NeuralNetwork(4, 5, 1);
  canvas = document.getElementById('nn-canvas');
  ctx = canvas.getContext('2d');
  resizeNNCanvas();
}

function resizeNNCanvas() {
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 380; // Hardcoded container height
    drawNetwork();
  }
}

function toggleNNTraining() {
  const trainBtn = document.getElementById('btn-nn-train');
  if (state.nnSim.isTraining) {
    state.nnSim.isTraining = false;
    trainBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Training';
    trainBtn.className = 'btn btn-ai w-100';
    if (state.nnSim.animationFrameId) {
      cancelAnimationFrame(state.nnSim.animationFrameId);
    }
  } else {
    state.nnSim.isTraining = true;
    trainBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Training';
    trainBtn.className = 'btn btn-secondary w-100';
    runNNTrainingLoop();
  }
}

function resetNN() {
  // Pause training first
  if (state.nnSim.isTraining) {
    toggleNNTraining();
  }
  state.nnSim.epoch = 0;
  state.nnSim.accumulatedSavings = 0.0;
  state.nnSim.model = new NeuralNetwork(4, 5, 1);
  
  // Reset metrics labels
  document.getElementById('nn-epoch').innerText = '0';
  document.getElementById('nn-loss').innerText = '0.0000';
  document.getElementById('nn-reduction').innerText = '0%';
  document.getElementById('nn-emissions').innerText = '0.0 kg';
  
  drawNetwork();
}

function changeGridDemand(value) {
  const demandStrs = ["Very Stable", "Stable", "Mild", "Normal", "Moderate", "Heavy", "High Stress", "Warning", "Critical Peak", "Grid Failure Danger"];
  document.getElementById('label-grid-demand').innerText = `${value} (${demandStrs[value - 1]})`;
}

function runNNTrainingLoop() {
  if (!state.nnSim.isTraining) return;

  const volatility = parseFloat(document.getElementById('input-grid-demand').value) / 10.0;
  
  // 1. Generate live home-grid parameters
  const timeSec = Date.now() / 1000;
  
  // Solar follows clean cosine curve representing daylight hours (peak in center)
  const solarCycle = Math.max(0, Math.cos(timeSec / 8));
  state.nnSim.solarOutput = parseFloat((solarCycle * 5).toFixed(1)); // 0 - 5 kW output

  // Grid demand peaks during evenings/stress
  const baseDemand = 3.5 + Math.sin(timeSec / 4) * 2;
  state.nnSim.gridDemand = parseFloat(Math.max(1, baseDemand + Math.random() * volatility * 2.5).toFixed(1)); // MW grid index

  // Carbon Intensity peaks when utility kicks on coal plants to cover peaks
  const carbonPeak = Math.max(0, Math.sin(timeSec / 4));
  state.nnSim.carbonIntensity = Math.round(180 + carbonPeak * 350 + Math.random() * volatility * 80); // g/kWh

  // 2. Map parameters to Neural Network normalized inputs [0.0 - 1.0]
  const inputGridNormalized = Math.min(1.0, state.nnSim.gridDemand / 10);
  const inputSolarNormalized = Math.min(1.0, state.nnSim.solarOutput / 5);
  const inputSOCNormalized = state.nnSim.batterySOC; // battery is already normalized
  const inputIntensityNormalized = Math.min(1.0, state.nnSim.carbonIntensity / 650);

  const modelInputs = [
    inputGridNormalized,
    inputSolarNormalized,
    inputSOCNormalized,
    inputIntensityNormalized
  ];

  // 3. Define the Optimization Target (Target output [0.0 - 1.0]):
  // If carbon intensity and grid demand are both high, the AI MUST discharge battery to grid (Target = 1.0)
  // If solar is high and grid load is low, battery should charge (Target = 0.0)
  let targetAction = 0.5; // Do nothing
  if (inputIntensityNormalized > 0.6 && inputGridNormalized > 0.5) {
    targetAction = 0.95; // Discharge battery
  } else if (inputSolarNormalized > 0.5 && inputGridNormalized < 0.4) {
    targetAction = 0.05; // Charge battery
  }

  // 4. Train model step and fetch current Loss
  const currentLoss = state.nnSim.model.train(modelInputs, [targetAction]);
  
  // Fetch decisions
  const networkDecision = state.nnSim.model.outputs[0];

  // 5. Update battery state of charge dynamically based on decision output
  // Decision < 0.4 -> Charging. Decision > 0.6 -> Discharging.
  if (networkDecision < 0.4 && state.nnSim.batterySOC < 1.0) {
    state.nnSim.batterySOC = Math.min(1.0, state.nnSim.batterySOC + 0.005);
  } else if (networkDecision > 0.6 && state.nnSim.batterySOC > 0.05) {
    state.nnSim.batterySOC = Math.max(0.0, state.nnSim.batterySOC - 0.007);
    // Discharging during peak saves emissions
    state.nnSim.accumulatedSavings += (0.005 * inputIntensityNormalized * (volatility * 1.5));
  }

  // Increment Epoch
  state.nnSim.epoch++;

  // 6. Update UI labels
  document.getElementById('nn-epoch').innerText = state.nnSim.epoch;
  document.getElementById('nn-loss').innerText = currentLoss.toFixed(5);
  
  // Peak load reduction correlates with trained network capability (1 - loss)
  const reductionPercent = Math.max(0, Math.round((1 - currentLoss * 4) * 85));
  document.getElementById('nn-reduction').innerText = `${Math.min(92, reductionPercent)}%`;
  document.getElementById('nn-emissions').innerText = `${state.nnSim.accumulatedSavings.toFixed(2)} kg`;

  // Update dashboard bars
  updateStatusProgressBars(networkDecision);

  // Render Network
  drawNetwork();

  state.nnSim.animationFrameId = requestAnimationFrame(runNNTrainingLoop);
}

function updateStatusProgressBars(decision) {
  // Update labels text
  document.getElementById('label-live-grid').innerText = `${state.nnSim.gridDemand.toFixed(1)} MW`;
  document.getElementById('label-live-battery').innerText = `${Math.round(state.nnSim.batterySOC * 100)}%`;
  document.getElementById('label-live-solar').innerText = `${state.nnSim.solarOutput.toFixed(1)} kW`;
  document.getElementById('label-live-intensity').innerText = `${state.nnSim.carbonIntensity} g/kWh`;

  // Update bar fills
  document.getElementById('fill-live-grid').style.width = `${Math.min(100, state.nnSim.gridDemand * 10)}%`;
  document.getElementById('fill-live-battery').style.width = `${Math.round(state.nnSim.batterySOC * 100)}%`;
  document.getElementById('fill-live-solar').style.width = `${Math.min(100, state.nnSim.solarOutput * 20)}%`;
  
  const intensityPct = Math.min(100, (state.nnSim.carbonIntensity / 600) * 100);
  document.getElementById('fill-live-intensity').style.width = `${intensityPct}%`;
}

function drawNetwork() {
  if (!ctx || !canvas) return;

  // Clear Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const model = state.nnSim.model;
  if (!model) return;

  // Node coordinates mapping
  const inputCount = model.inputSize;
  const hiddenCount = model.hiddenSize;
  const outputCount = model.outputSize;

  const nodeRadius = 14;
  const paddingX = canvas.width * 0.22;
  const startX = canvas.width * 0.18;

  const inputNodes = [];
  const hiddenNodes = [];
  const outputNodes = [];

  const labels = ["Grid Demand", "Solar Output", "Battery SoC", "Grid Carbon"];

  // 1. Calculate Node Positions
  // Inputs
  const inputSpacing = (canvas.height - 100) / (inputCount - 1);
  for (let i = 0; i < inputCount; i++) {
    inputNodes.push({
      x: startX,
      y: 50 + i * inputSpacing,
      activation: model.hiddenOutputs ? (model.weightsIH[0][i] > 0 ? 0.8 : 0.2) : 0.5
    });
  }

  // Hidden Layer
  const hiddenSpacing = (canvas.height - 80) / (hiddenCount - 1);
  for (let i = 0; i < hiddenCount; i++) {
    hiddenNodes.push({
      x: startX + paddingX,
      y: 40 + i * hiddenSpacing,
      activation: model.hiddenOutputs ? model.hiddenOutputs[i] : 0.5
    });
  }

  // Output
  const outputSpacing = (canvas.height - 100) / outputCount;
  for (let i = 0; i < outputCount; i++) {
    outputNodes.push({
      x: startX + paddingX * 2,
      y: canvas.height / 2,
      activation: model.outputs ? model.outputs[i] : 0.5
    });
  }

  // 2. Draw Synapses (Weights)
  // Input to Hidden Synapses
  for (let h = 0; h < hiddenCount; h++) {
    for (let inp = 0; inp < inputCount; inp++) {
      const weight = model.weightsIH[h][inp];
      const alpha = Math.min(1.0, Math.max(0.08, Math.abs(weight)));
      
      ctx.beginPath();
      ctx.moveTo(inputNodes[inp].x, inputNodes[inp].y);
      ctx.lineTo(hiddenNodes[h].x, hiddenNodes[h].y);
      
      // Teal/cyan for positive reinforcement, orange/red for negative inhibits
      ctx.strokeStyle = weight > 0 ? `rgba(6, 182, 212, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
      ctx.lineWidth = Math.abs(weight) * 3;
      ctx.stroke();

      // Draw active particles moving down the synapses
      if (state.nnSim.isTraining && Math.random() < 0.05) {
        const particleOffset = (Date.now() / 1500 + inp) % 1.0;
        const pX = inputNodes[inp].x + (hiddenNodes[h].x - inputNodes[inp].x) * particleOffset;
        const pY = inputNodes[inp].y + (hiddenNodes[h].y - inputNodes[inp].y) * particleOffset;
        ctx.beginPath();
        ctx.arc(pX, pY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = weight > 0 ? '#22d3ee' : '#f87171';
        ctx.fill();
      }
    }
  }

  // Hidden to Output Synapses
  for (let out = 0; out < outputCount; out++) {
    for (let h = 0; h < hiddenCount; h++) {
      const weight = model.weightsHO[out][h];
      const alpha = Math.min(1.0, Math.max(0.08, Math.abs(weight)));
      
      ctx.beginPath();
      ctx.moveTo(hiddenNodes[h].x, hiddenNodes[h].y);
      ctx.lineTo(outputNodes[out].x, outputNodes[out].y);
      
      ctx.strokeStyle = weight > 0 ? `rgba(16, 185, 129, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
      ctx.lineWidth = Math.abs(weight) * 3.5;
      ctx.stroke();
    }
  }

  // 3. Draw Neurons (Nodes)
  // Input nodes
  inputNodes.forEach((node, idx) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = 'var(--accent-teal)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Node labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(labels[idx], node.x - 20, node.y + 4);
  });

  // Hidden nodes
  hiddenNodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius - 1, 0, Math.PI * 2);
    
    // Brightness matches neuron activation
    const intensity = Math.round(node.activation * 200 + 40);
    ctx.fillStyle = `rgb(${intensity - 80}, ${intensity - 120}, ${intensity})`;
    ctx.fill();
    ctx.strokeStyle = 'var(--accent-purple)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  });

  // Output nodes
  outputNodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = 'var(--accent-green)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Glowing decision fill in center
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius - 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(16, 185, 129, ${node.activation})`;
    ctx.fill();

    // Label Output
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText("AI Output", node.x + 24, node.y - 12);

    ctx.fillStyle = 'var(--accent-green)';
    ctx.font = 'bold 11px Inter';
    let decisionStr = node.activation > 0.6 ? "DISCHARGE GRID" : (node.activation < 0.4 ? "CHARGE BATTERY" : "STANDBY IDLE");
    ctx.fillText(decisionStr, node.x + 24, node.y + 6);
  });
}

// ==========================================================================
// Eco Goals & Task Checklist Controller
// ==========================================================================
function renderGoalsList() {
  const container = document.getElementById('goals-task-list');
  container.innerHTML = '';

  state.goals.forEach((goal, index) => {
    const item = document.createElement('div');
    item.className = `task-item ${goal.completed ? 'completed' : ''}`;
    item.innerHTML = `
      <div class="task-details" onclick="toggleGoal(${index})">
        <div class="task-checkbox">
          <i class="fa-solid fa-check"></i>
        </div>
        <div>
          <div class="task-title">${goal.title}</div>
          <div class="task-desc">${goal.desc}</div>
        </div>
      </div>
      <div class="task-impact">-${Math.round(goal.impact * 1000)} kg CO₂</div>
    `;
    container.appendChild(item);
  });

  updateGoalsProgress();
}

function toggleGoal(index) {
  state.goals[index].completed = !state.goals[index].completed;
  
  // Visual click animation
  if (state.goals[index].completed) {
    confetti({
      particleCount: 20,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
  }

  renderGoalsList();

  // If we have history entries, adjust the active dashboard values to reflect current completed commitments
  if (state.history.length > 0) {
    const lastBaseResult = state.calculator.result.total;
    const activeOffset = getActiveGoalsOffset();
    const updatedScore = Math.max(0.05, lastBaseResult - activeOffset);
    
    // Update current history index value
    state.history[state.history.length - 1].total = parseFloat(updatedScore.toFixed(2));
    
    // Update charts and dashboard
    updateCharts();
    updateDashboardUI();
  }
}

function getActiveGoalsOffset() {
  return state.goals
    .filter(g => g.completed)
    .reduce((sum, g) => sum + g.impact, 0.0);
}

function updateGoalsProgress() {
  const total = state.goals.length;
  const completed = state.goals.filter(g => g.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Render text counts
  document.getElementById('goals-count-label').innerText = `${completed} of ${total} Goals Completed`;
  
  // Total Offset Sum in kg (Tons * 1000)
  const totalKgOffset = getActiveGoalsOffset() * 1000;
  document.getElementById('goals-total-offset').innerText = `${totalKgOffset.toFixed(0)} kg CO₂`;

  // Draw Circle progress path
  // SVG Circumference = 2 * PI * R = 2 * 3.14159 * 80 = 502.65
  const circumference = 502.6;
  const offset = circumference - (percentage / 100) * circumference;
  
  const circleEl = document.getElementById('goal-progress-circle');
  if (circleEl) {
    circleEl.style.strokeDashoffset = offset;
  }
  document.getElementById('goal-progress-percent').innerText = `${percentage}%`;

  // Special celebration if all goals met
  if (completed === total) {
    triggerGoalCelebration();
  }
}

function triggerGoalCelebration() {
  const duration = 2 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}
