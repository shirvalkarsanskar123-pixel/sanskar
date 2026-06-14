# Capstone Project: EcoTrace AI
### Artificial Intelligence Final Project — United Nations Sustainable Development Goals (SDG 13: Climate Action)

EcoTrace AI is an interactive, artificial intelligence-powered carbon footprint optimizer and climate action advisor. The application uses client-side machine learning and intelligent advisory algorithms to empower individuals to analyze, track, and mitigate their environmental footprint, bridging the gap between macro climate goals and micro personal choices.

---

## 1. Problem Statement
Global climate change is one of the most critical challenges of our time, directly targeted by **UN Sustainable Development Goal 13 (Climate Action)**. While international treaties outline carbon-reduction targets, individuals lack clean, visual, and actionable feedback loops to evaluate how their daily energy, travel, and food habits accumulate into environmental impacts. 

Current carbon calculators are static, dry worksheets that do not suggest actionable changes. Furthermore, the integration of green energy grids faces grid demand balancing issues, which require intelligent edge load management. There is a lack of educational tools demonstrating how artificial intelligence and neural networks can actively manage clean energy transitions in smart homes.

---

## 2. Project Objective
The objective of **EcoTrace AI** is to design and develop a web-based prototype that demonstrates a working AI solution for climate action. The application is designed to:
- Educate users on the breakdown of carbon footprints using an **Interactive Calculator**.
- Generate prioritized, custom mitigation paths using an **AI Recommendation Engine**.
- Answer user queries about ecological practices via **EcoBot**, an NLP-based conversational assistant.
- Simulate how **Neural Networks (ANN)** stabilize electric grids and save carbon in real-time.
- Promote commitment to sustainable habits using an **Eco Goal and Task Tracker**.

---

## 3. Solution Description
EcoTrace AI is built as a self-contained, high-fidelity Single Page Web Application utilizing:
- **Core Stack**: HTML5, Vanilla CSS3 (incorporating custom dark-mode gradients and glassmorphism), and Vanilla JavaScript (ES6+).
- **Libraries**: Chart.js (for rendering interactive doughnut breakdown and line trend charts), FontAwesome (for vector iconography), and Canvas Confetti (for celebrating eco milestones).

The application contains five main functional modules:

### A. Carbon Footprint Calculations
Calculations are executed in real-time in `ai-engine.js` using standard carbon equivalency factors ($CO_2e$):
- **Utility Energy**: $Electricity\ (\$/mo) \times 12 \times 0.0058\ Tons\ CO_2/\$$ adjusted for heating fuels (Natural Gas, Oil, Electricity) and offsets from home solar.
- **Transit & Travel**: $Commute\ Miles\ (Weekly) \times 52 \times 0.00035\ Tons/Mile$, adjusted for vehicle fuel type (Gasoline, Hybrid, EV, or None) added to short/long-haul flight durations ($0.18\ Tons/Hour$).
- **Lifestyle & Diet**: Factored by eating preferences (heavy meat consumption vs. plant-based vegan diets) and waste recycling patterns.

### B. AI Recommendation Engine
An expert rule-based engine analyzes the user's high-emission parameters and matches them against database solutions (e.g. EV transition, smart batteries, meal-planning, sorting recycle bins). It weights the recommendations by potential carbon savings and renders the top 3 highest impact tips.

### C. "EcoBot" Conversational AI
A natural language processing pattern matcher parses user text input for key climate terms and serves instant contextual explanations about carbon offsets, green living, and SDG goals, creating an educational interface.

### D. AI Smart Grid Neural Network Simulator
A custom **Feedforward/Backpropagation Neural Network (ANN)** is coded from scratch in JavaScript without frameworks. 
- **Topology**: 4 Input Neurons (Grid Demand, Solar Output, Battery SoC, Carbon Intensity) $\rightarrow$ 5 Hidden Neurons $\rightarrow$ 1 Output Neuron (AI Grid Decision: Charge Battery, Discharge Battery, Standby).
- **Interactive Visualizer**: The browser renders the neural network topology live on an HTML5 canvas. The connection lines representing synapse weights change thickness and color based on active updates. Spark particles represent signals passing through nodes. When training is activated, the model updates weights to minimize MSE (Mean Square Error) loss and flattens grid peak demand.

### E. Goal Tracker & Progress Ring
Allows users to toggle eco commitments (e.g., swapping LED lights, turning off vampire loads). Toggling completions deducts simulated offsets from their active carbon score, updating the dashboard trend line and animating the SVG progress circle.

### 4. Future Scope
- **IoT Smart Home Integration**: Link the simulator to actual smart home APIs (like Home Assistant) to switch appliance loads based on real-time carbon grid signals.
- **Machine Learning API**: Expand the rule-based recommender to consume multi-user datasets and utilize clustering algorithms (like K-Means) to predict user conservation success rates.
- **Global Database Syncing**: Integrate a cloud database (such as Firebase) to enable users to log in, save historical footprint timelines permanently, and compete in community eco-leaderboards.
