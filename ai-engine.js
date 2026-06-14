/* ==========================================================================
   EcoTrace AI - AI Algorithms and Neural Network Simulator
   ========================================================================== */

// ==========================================================================
// 1. Carbon footprint calculations & AI Recommendation Engine
// ==========================================================================

const EMISSION_FACTORS = {
  electricityPerDollar: 0.0058, // Tons CO2e per dollar spent (avg US energy cost & grid intensity)
  heating: {
    'natural-gas': 1.8,         // Tons CO2e per year avg
    'electricity': 0.8,         // Heat pump / electric
    'oil': 3.2,                 // Fuel oil
    'wood': 0.4                 // Biomass
  },
  solarMultiplier: {
    'none': 1.0,
    'partial': 0.6,
    'full': 0.05
  },
  commuteMilePerYear: 0.00035,  // Tons CO2e per mile
  vehicleFuelMultiplier: {
    'gasoline': 1.0,
    'hybrid': 0.5,
    'electric': 0.15,
    'none': 0.0
  },
  flightHour: 0.18,             // Tons CO2e per hour of flight
  diet: {
    'heavy-meat': 2.9,          // Tons CO2e per year
    'moderate-meat': 1.7,
    'vegetarian': 1.1,
    'vegan': 0.7
  },
  waste: {
    'high': 0.6,
    'moderate': 0.35,
    'low': 0.1
  },
  recycleCredit: {
    'no': 0.0,
    'some': -0.15,
    'yes': -0.35
  }
};

/**
 * Calculates carbon footprint based on user metrics
 */
function calculateFootprint(inputs) {
  // Energy Sector
  const energyBase = inputs.electricity * 12 * EMISSION_FACTORS.electricityPerDollar;
  const heatingBase = EMISSION_FACTORS.heating[inputs.heating];
  const solarFactor = EMISSION_FACTORS.solarMultiplier[inputs.solar];
  const totalEnergy = (energyBase + heatingBase) * solarFactor;

  // Transport Sector
  const commuteMilesYearly = inputs.commute * 52;
  const transportBase = commuteMilesYearly * EMISSION_FACTORS.commuteMilePerYear;
  const vehicleFactor = EMISSION_FACTORS.vehicleFuelMultiplier[inputs.vehicleType];
  const flightEmissions = inputs.flights * EMISSION_FACTORS.flightHour;
  const totalTransport = (transportBase * vehicleFactor) + flightEmissions;

  // Diet & Consumption Sector
  const dietEmissions = EMISSION_FACTORS.diet[inputs.diet];
  const wasteEmissions = EMISSION_FACTORS.waste[inputs.waste];
  const recycleOffset = EMISSION_FACTORS.recycleCredit[inputs.recycle];
  const totalLifestyle = Math.max(0.1, dietEmissions + wasteEmissions + recycleOffset);

  // Totals
  const total = totalEnergy + totalTransport + totalLifestyle;

  return {
    total: parseFloat(total.toFixed(2)),
    energy: parseFloat(totalEnergy.toFixed(2)),
    transport: parseFloat(totalTransport.toFixed(2)),
    lifestyle: parseFloat(totalLifestyle.toFixed(2))
  };
}

/**
 * AI Recommendation Engine
 * Analyzes parameters to offer custom weighted advice
 */
function generateAIRecommendations(inputs, currentBreakdown) {
  const recommendations = [];

  // 1. Electricity / Renewable Energy Recommendations
  if (inputs.solar !== 'full') {
    let text = "";
    let impact = 0.0;
    if (inputs.solar === 'none') {
      text = "Transition to clean energy: Contract a green electricity provider or install rooftop solar panels.";
      impact = currentBreakdown.energy * 0.7;
    } else {
      text = "Maximize solar self-consumption: Expand rooftop battery storage to reduce evening peak grid reliance.";
      impact = currentBreakdown.energy * 0.4;
    }
    
    if (impact > 0.3) {
      recommendations.push({
        id: 'rec-solar',
        icon: 'fa-sun',
        title: inputs.solar === 'none' ? 'Go Solar / Clean Utility' : 'Add Battery Storage',
        desc: text,
        impact: parseFloat(impact.toFixed(1))
      });
    }
  }

  // 2. Vehicle Transition Recommendations
  if (inputs.vehicleType === 'gasoline' && inputs.commute > 40) {
    const impact = currentBreakdown.transport * 0.75;
    recommendations.push({
      id: 'rec-ev',
      icon: 'fa-car-side',
      title: "Transition to Hybrid / EV",
      desc: "Switching commuter miles to an EV or plug-in hybrid reduces tailpipe emissions to near-zero.",
      impact: parseFloat(impact.toFixed(1))
    });
  }

  // 3. Flight Reductions
  if (inputs.flights > 15) {
    const impact = inputs.flights * EMISSION_FACTORS.flightHour * 0.4;
    recommendations.push({
      id: 'rec-flights',
      icon: 'fa-plane-slash',
      title: "Reduce Short-Haul Flights",
      desc: "Substitute regional business flights with virtual meetings or high-speed rail lines where available.",
      impact: parseFloat(impact.toFixed(1))
    });
  }

  // 4. Diet Transitions
  if (inputs.diet === 'heavy-meat') {
    recommendations.push({
      id: 'rec-diet',
      icon: 'fa-leaf',
      title: "Introduce Meatless Days",
      desc: "Replacing beef and pork with plant-based alternatives just 3 days a week cuts dietary footprint by 40%.",
      impact: 0.9
    });
  }

  // 5. Waste and Recycling
  if (inputs.waste === 'high') {
    recommendations.push({
      id: 'rec-waste',
      icon: 'fa-trash-arrow-up',
      title: "Optimize Meal Planning",
      desc: "Reduce food waste by meal planning, tracking expiration dates, and composting organic residues.",
      impact: 0.45
    });
  }

  if (inputs.recycle === 'no') {
    recommendations.push({
      id: 'rec-recycle',
      icon: 'fa-recycle',
      title: "Implement Waste Sorting",
      desc: "Sort cardboards, plastics, glass, and metals to return reusable materials to the supply chain.",
      impact: 0.25
    });
  }

  // Fallback if user has very low emissions
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-perfect',
      icon: 'fa-award',
      title: "Maintain Low-Carbon Routine",
      desc: "You already display an exceptionally sustainable footprint. Share your habits and advocate for local community eco-initiatives!",
      impact: 0.1
    });
  }

  // Sort by highest impact first
  return recommendations.sort((a, b) => b.impact - a.impact).slice(0, 3);
}


// ==========================================================================
// 2. EcoBot NLP Chatbot Engine (Client-side Keyword Matcher)
// ==========================================================================

const CHAT_INTENTS = [
  {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'bot', 'welcome'],
    response: "Hello! I am EcoBot, your AI climate advisor. I can explain carbon calculations, share energy efficiency tips, explain SDG 13, or talk about green technology. What would you like to discuss?"
  },
  {
    keywords: ['what is carbon footprint', 'carbon footprint', 'definition', 'co2', 'emissions'],
    response: "A **Carbon Footprint** represents the total amount of greenhouse gases (including carbon dioxide and methane) generated by our actions. It is usually expressed in **Metric Tons of CO₂ equivalent (CO₂e)** per year. The average global footprint is about 4.7 tons, but to limit global warming to under 1.5°C, the target average needs to drop to under 2 tons per person by 2050."
  },
  {
    keywords: ['meat', 'beef', 'food', 'diet', 'eating', 'vegetarian', 'vegan'],
    response: "Diet has a massive climate impact. **Beef production** generates about 60 kg of greenhouse gases per kg of meat—nearly **10 times** more than chicken and **30 times** more than wheat. Methane emissions from cattle digestion, combined with deforestation for pastureland, make agriculture responsible for roughly 26% of global emissions. Switching to vegetarianism or veganism is one of the most effective personal actions you can take."
  },
  {
    keywords: ['sdg 13', 'sdg', 'sustainable development goal', 'united nations', 'goals'],
    response: "**SDG 13: Climate Action** is one of the 17 UN Sustainable Development Goals. It urges nations to take urgent action to combat climate change and its impacts. Targets include strengthening resilience to climate-related hazards, integrating climate measures into national policies, and improving education and human capacity on climate change mitigation."
  },
  {
    keywords: ['energy', 'save electricity', 'lightbulb', 'heating', 'appliances', 'power'],
    response: "To optimize home energy:\n1. **Upgrade to LED bulbs**: They use 75% less energy than incandescent lighting.\n2. **Install a smart thermostat**: Adjusts heating/cooling when you are sleeping or away.\n3. **Wash clothes in cold water**: Heating water accounts for 90% of a washing machine's electricity.\n4. **Unplug vampire loads**: Electronics draw power even when turned off; use smart power strips."
  },
  {
    keywords: ['solar', 'panels', 'renewable', 'clean energy', 'battery'],
    response: "Rooftop solar panels convert sunlight directly into electricity using photovoltaic (PV) cells. Generating your own solar electricity reduces grid dependency (which is often powered by coal or gas). Pairing solar with a **home battery** allows you to store excess daytime generation for use at night, achieving close to 100% household carbon reduction in utilities."
  },
  {
    keywords: ['offsets', 'credits', 'credit', 'offsetting', 'planting trees'],
    response: "**Carbon Offsets** allow individuals or businesses to fund environmental projects (like reforestation or renewable energy building) to balance out their own emissions. While helpful, offsets should **not** replace active emission reductions. Always look for certified offset standards (like Gold Standard or VCS) to ensure project additionality and permanence."
  },
  {
    keywords: ['waste', 'recycling', 'recycle', 'compost', 'garbage'],
    response: "Organic waste in landfills decomposes anaerobically to produce **methane**, a greenhouse gas 28 times more potent than carbon dioxide. Composting organic waste allows it to decompose aerobically, drastically reducing methane. Recycling glass, cardboard, and aluminum saves massive manufacturing energy compared to refining raw materials."
  },
  {
    keywords: ['travel', 'car', 'commute', 'ev', 'flights', 'planes', 'train'],
    response: "Transportation is a leading emissions source. A standard passenger car emits about 4.6 metric tons of CO₂ per year. You can reduce this by: \n- Taking public transit, cycling, or walking.\n- Purchasing a Hybrid or Electric Vehicle (EV) which runs on batteries.\n- Avoiding aviation: One single long-haul flight can emit more carbon than some people generate in an entire year!"
  }
];

function queryEcoBot(userMessage) {
  const normalized = userMessage.toLowerCase().trim();
  
  // Look for keyword matches
  for (const intent of CHAT_INTENTS) {
    for (const keyword of intent.keywords) {
      if (normalized.includes(keyword)) {
        return intent.response;
      }
    }
  }

  // Fallback response with helpful hints
  return "I'm not sure I fully understand that topic. You can ask me about: \n- *What a carbon footprint is*\n- *The impact of eating meat*\n- *What SDG 13 is*\n- *How to save energy at home*\n- *Rooftop solar and home batteries*\n- *Carbon offsets and credits*";
}


// ==========================================================================
// 3. Custom Artificial Neural Network (ANN) from Scratch
// ==========================================================================

class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    // Weights matrices
    // Weights from Input to Hidden
    this.weightsIH = [];
    for (let i = 0; i < this.hiddenSize; i++) {
      this.weightsIH[i] = [];
      for (let j = 0; j < this.inputSize; j++) {
        this.weightsIH[i][j] = Math.random() * 2 - 1; // Random values between -1 and 1
      }
    }

    // Weights from Hidden to Output
    this.weightsHO = [];
    for (let i = 0; i < this.outputSize; i++) {
      this.weightsHO[i] = [];
      for (let j = 0; j < this.hiddenSize; j++) {
        this.weightsHO[i][j] = Math.random() * 2 - 1;
      }
    }

    // Biases
    this.biasH = new Array(this.hiddenSize).fill(0).map(() => Math.random() * 2 - 1);
    this.biasO = new Array(this.outputSize).fill(0).map(() => Math.random() * 2 - 1);

    this.learningRate = 0.15;
  }

  // Sigmoid Activation Function
  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  // Derivative of Sigmoid for Backpropagation
  dSigmoid(y) {
    return y * (1 - y);
  }

  // Feedforward calculation
  feedforward(inputs) {
    // Hidden layer activations
    this.hiddenOutputs = [];
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = this.biasH[i];
      for (let j = 0; j < this.inputSize; j++) {
        sum += inputs[j] * this.weightsIH[i][j];
      }
      this.hiddenOutputs[i] = this.sigmoid(sum);
    }

    // Output layer activations
    this.outputs = [];
    for (let i = 0; i < this.outputSize; i++) {
      let sum = this.biasO[i];
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += this.hiddenOutputs[j] * this.weightsHO[i][j];
      }
      this.outputs[i] = this.sigmoid(sum);
    }

    return this.outputs;
  }

  // Backpropagation to train neural network weights
  train(inputs, targets) {
    // 1. Get predictions (feedforward sets outputs & hiddenOutputs)
    this.feedforward(inputs);

    // 2. Calculate Output Errors (Target - Output)
    const outputErrors = [];
    for (let i = 0; i < this.outputSize; i++) {
      outputErrors[i] = targets[i] - this.outputs[i];
    }

    // 3. Calculate Hidden Layer Errors (Propagate output errors back)
    const hiddenErrors = [];
    for (let i = 0; i < this.hiddenSize; i++) {
      let error = 0;
      for (let j = 0; j < this.outputSize; j++) {
        error += outputErrors[j] * this.weightsHO[j][i];
      }
      hiddenErrors[i] = error;
    }

    // 4. Update Hidden -> Output weights and Output biases
    for (let i = 0; i < this.outputSize; i++) {
      const gradient = outputErrors[i] * this.dSigmoid(this.outputs[i]) * this.learningRate;
      this.biasO[i] += gradient;
      for (let j = 0; j < this.hiddenSize; j++) {
        this.weightsHO[i][j] += gradient * this.hiddenOutputs[j];
      }
    }

    // 5. Update Input -> Hidden weights and Hidden biases
    for (let i = 0; i < this.hiddenSize; i++) {
      const gradient = hiddenErrors[i] * this.dSigmoid(this.hiddenOutputs[i]) * this.learningRate;
      this.biasH[i] += gradient;
      for (let j = 0; j < this.inputSize; j++) {
        this.weightsIH[i][j] += gradient * inputs[j];
      }
    }

    // Return current error squared
    let errorSum = 0;
    for (let i = 0; i < this.outputSize; i++) {
      errorSum += outputErrors[i] * outputErrors[i];
    }
    return errorSum / this.outputSize; // MSE
  }
}
