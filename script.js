/**
 * ═══════════════════════════════════════════════════════════════════
 * SPACE EXPLORER: MISSION CONTROL — GAME ENGINE
 * ═══════════════════════════════════════════════════════════════════
 * Architecture:
 *  • StarfieldRenderer   — canvas animated background
 *  • GameState           — single source of truth
 *  • MissionData         — all missions, events, upgrades
 *  • ScreenManager       — screen transitions
 *  • GameEngine          — core game loop & logic
 *  • UIController        — DOM updates & rendering
 *  • StorageManager      — localStorage persistence
 * ═══════════════════════════════════════════════════════════════════
 */

'use strict';

/* ════════════════════════════════════════════════════ STARFIELD ══ */
const StarfieldRenderer = (() => {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [], nebulas = [], raf;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = Array.from({ length: 280 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.8 + 0.2,
      speed: Math.random() * 0.4 + 0.05,
      alpha: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleDir: Math.random() > 0.5 ? 1 : -1,
    }));
    nebulas = Array.from({ length: 4 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 200 + 80,
      hue:   [200, 260, 300, 180][Math.floor(Math.random() * 4)],
      alpha: Math.random() * 0.06 + 0.02,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Nebula clouds
    nebulas.forEach(n => {
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, `hsla(${n.hue}, 80%, 60%, ${n.alpha})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Stars with parallax scroll and twinkle
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }

      s.alpha += s.twinkleSpeed * s.twinkleDir;
      if (s.alpha > 1 || s.alpha < 0.1) s.twinkleDir *= -1;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 230, 255, ${s.alpha})`;
      ctx.fill();

      // Occasional bright star cross
      if (s.r > 1.5) {
        ctx.strokeStyle = `rgba(200, 230, 255, ${s.alpha * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r * 3, s.y);
        ctx.lineTo(s.x + s.r * 3, s.y);
        ctx.moveTo(s.x, s.y - s.r * 3);
        ctx.lineTo(s.x, s.y + s.r * 3);
        ctx.stroke();
      }
    });

    raf = requestAnimationFrame(draw);
  }

  return {
    start() { resize(); draw(); window.addEventListener('resize', resize); },
    stop()  { cancelAnimationFrame(raf); },
  };
})();


/* ═══════════════════════════════════════════════ MISSION DATA ══ */
const MissionData = {

  planets: [
    { id: 'mercury', name: 'MERCURY', emoji: '🟤', desc: 'Scorched rock near the sun. High radiation, scarce fuel.', x: 0.15, y: 0.25, reward: 120, fuelCost: 12 },
    { id: 'venus',   name: 'VENUS',   emoji: '🟡', desc: 'Toxic atmosphere, crushing pressure. Rich in minerals.', x: 0.32, y: 0.55, reward: 180, fuelCost: 16 },
    { id: 'mars',    name: 'MARS',    emoji: '🔴', desc: 'The Red Planet. Ancient ruins of unknown civilizations.', x: 0.52, y: 0.30, reward: 200, fuelCost: 18 },
    { id: 'jupiter', name: 'JUPITER', emoji: '🟠', desc: 'Gas giant. Storm systems can devastate your hull.', x: 0.72, y: 0.60, reward: 260, fuelCost: 24 },
    { id: 'saturn',  name: 'SATURN',  emoji: '🪐', desc: 'Ringed beauty. Navigate the rings for rare crystals.', x: 0.88, y: 0.35, reward: 320, fuelCost: 28 },
    { id: 'uranus',  name: 'URANUS',  emoji: '🔵', desc: 'Ice giant. Massive O2 reserves for the brave.', x: 0.60, y: 0.75, reward: 380, fuelCost: 32 },
    { id: 'neptune', name: 'NEPTUNE', emoji: '💙', desc: 'The edge of the solar system. Unknown dangers await.', x: 0.35, y: 0.82, reward: 440, fuelCost: 36 },
    { id: 'pluto',   name: 'PLUTO',   emoji: '⚪', desc: 'Dwarf world at the system edge. Mysterious signals.', x: 0.82, y: 0.85, reward: 500, fuelCost: 40 },
  ],

  missions: [
    {
      id: 'sol1', name: 'INNER SYSTEM SURVEY', planet: '☿ Mercury', emoji: '🟤',
      desc: 'Map the inner planets and collect mineral data.',
      objectives: ['Visit 3 planets', 'Survive 2 random events', 'Score 300+ points'],
      reward: 150, difficulty: 'easy', minLevel: 1,
      planetSequence: ['mercury', 'venus', 'mars'],
    },
    {
      id: 'sol2', name: 'GAS GIANT EXPEDITION', planet: '♃ Jupiter', emoji: '🟠',
      desc: 'Study Jupiter and Saturn. Collect gas samples.',
      objectives: ['Visit Jupiter & Saturn', 'Maintain oxygen > 30%', 'Score 500+ points'],
      reward: 250, difficulty: 'normal', minLevel: 1,
      planetSequence: ['mars', 'jupiter', 'saturn'],
    },
    {
      id: 'sol3', name: 'OUTER RIM RECON', planet: '♆ Neptune', emoji: '💙',
      desc: 'Push to the outer planets. Extremely dangerous.',
      objectives: ['Visit 4 planets', 'Survive an asteroid storm', 'Score 900+ points'],
      reward: 400, difficulty: 'hard', minLevel: 2,
      planetSequence: ['jupiter', 'uranus', 'neptune', 'pluto'],
    },
    {
      id: 'sol4', name: 'FULL SYSTEM TOUR', planet: '🌌 All Planets', emoji: '✨',
      desc: 'Visit every planet in the solar system. A legendary journey.',
      objectives: ['Visit all 8 planets', 'Keep hull > 20% at end', 'Score 1500+ points'],
      reward: 800, difficulty: 'hard', minLevel: 3,
      planetSequence: ['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'],
    },
    {
      id: 'andromeda1', name: 'ANDROMEDA GATEWAY', planet: '🌌 Andromeda', emoji: '🌌',
      desc: 'Travel through the newly discovered warp gate to Andromeda galaxy.',
      objectives: ['Enter warp gate', 'Survive 4 alien encounters', 'Score 2000+ points'],
      reward: 1200, difficulty: 'hard', minLevel: 4,
      planetSequence: ['mercury','mars','jupiter','saturn','neptune'],
    },
    {
      id: 'training', name: 'CADET TRAINING', planet: '🌍 Earth Orbit', emoji: '🌍',
      desc: 'Practice flight in Earth orbit. Low risk, low reward.',
      objectives: ['Visit 2 planets', 'Score 100+ points'],
      reward: 80, difficulty: 'easy', minLevel: 1,
      planetSequence: ['mercury', 'venus'],
    },
  ],

  events: [
    {
      id: 'asteroid',
      type: 'bad',
      icon: '☄️',
      title: 'ASTEROID STORM',
      desc: 'A dense field of asteroids appears on your trajectory. Your hull takes heavy damage as you navigate through the debris.',
      effects: { hp: -20, fuel: -8 },
      message: '☄️ Asteroid storm! Hull damaged.',
    },
    {
      id: 'alien',
      type: 'mixed',
      icon: '👽',
      title: 'ALIEN ENCOUNTER',
      desc: 'An unknown alien vessel approaches. After tense communication, they offer fuel in exchange for sensor data.',
      effects: { fuel: +18, oxygen: -5 },
      message: '👽 Alien contact! Fuel received, slight O2 leak.',
    },
    {
      id: 'fuel_leak',
      type: 'bad',
      icon: '⛽',
      title: 'FUEL LEAK DETECTED',
      desc: 'A micrometeorite punctured your fuel tank. Emergency systems sealed the breach but fuel was lost.',
      effects: { fuel: -22, hp: -5 },
      message: '⛽ Fuel leak! Emergency patch deployed.',
    },
    {
      id: 'treasure',
      type: 'good',
      icon: '💎',
      title: 'SPACE TREASURE',
      desc: 'Your scanners detect an abandoned cargo pod containing precious materials. Score bonus awarded!',
      effects: { score: +150, fuel: +10 },
      message: '💎 Space treasure found! Score bonus earned.',
    },
    {
      id: 'solar_flare',
      type: 'bad',
      icon: '🌟',
      title: 'SOLAR FLARE',
      desc: 'A massive solar flare disrupts your systems. Oxygen recyclers are temporarily offline.',
      effects: { oxygen: -18, hp: -8 },
      message: '🌟 Solar flare! Oxygen depleted.',
    },
    {
      id: 'nebula',
      type: 'good',
      icon: '🌌',
      title: 'ENERGY NEBULA',
      desc: 'Your ship flies through an energy-rich nebula, recharging your batteries and boosting hull integrity.',
      effects: { hp: +15, oxygen: +10 },
      message: '🌌 Energy nebula! Hull and O2 restored.',
    },
    {
      id: 'wormhole',
      type: 'mixed',
      icon: '🌀',
      title: 'WORMHOLE DETECTED',
      desc: 'A stable wormhole shortens your journey dramatically. You emerge near your destination but oxygen is consumed.',
      effects: { fuel: +25, oxygen: -12, score: +80 },
      message: '🌀 Wormhole shortcut! Fuel saved, O2 used.',
    },
    {
      id: 'debris',
      type: 'bad',
      icon: '🗑️',
      title: 'SPACE DEBRIS FIELD',
      desc: 'Dense orbital debris from an ancient collision forces slow navigation, burning extra fuel.',
      effects: { fuel: -15, hp: -6 },
      message: '🗑️ Debris field! Slow navigation required.',
    },
    {
      id: 'distress',
      type: 'good',
      icon: '📡',
      title: 'DISTRESS SIGNAL',
      desc: 'You rescue a stranded probe carrying experimental oxygen reserves. Mission control is pleased.',
      effects: { oxygen: +20, score: +100 },
      message: '📡 Probe rescued! O2 replenished.',
    },
    {
      id: 'ion_storm',
      type: 'bad',
      icon: '⚡',
      title: 'ION STORM',
      desc: 'Charged particles overwhelm your shields, damaging systems across the board.',
      effects: { hp: -15, fuel: -10, oxygen: -8 },
      message: '⚡ Ion storm! All systems damaged.',
    },
  ],

  upgrades: [
    {
      id: 'speed',
      name: 'WARP DRIVE',
      icon: '⚡',
      desc: 'Increases ship speed, reducing travel time and fuel consumption per jump.',
      maxLevel: 3,
      costs: [100, 200, 400],
      effects: ['Speed +0.3x', 'Speed +0.5x', 'Speed +0.8x · Fuel -15%'],
      apply(ship, level) { ship.speed = 1 + level * 0.3; },
    },
    {
      id: 'fuel',
      name: 'FUEL EFFICIENCY',
      icon: '⛽',
      desc: 'Advanced combustion systems reduce fuel burned per maneuver.',
      maxLevel: 3,
      costs: [120, 240, 480],
      effects: ['Fuel use -10%', 'Fuel use -20%', 'Fuel use -30% · Regen'],
      apply(ship, level) { ship.fuelEfficiency = 1 - level * 0.1; },
    },
    {
      id: 'oxygen',
      name: 'O2 RECYCLER',
      icon: '💨',
      desc: 'Recycles and boosts oxygen capacity, extending mission duration.',
      maxLevel: 3,
      costs: [100, 180, 360],
      effects: ['Max O2 +25', 'Max O2 +50', 'O2 regen passive'],
      apply(ship, level) { ship.maxOxygen = 100 + level * 25; },
    },
    {
      id: 'hull',
      name: 'HULL ARMOR',
      icon: '🛡️',
      desc: 'Reinforced alloy plating reduces damage from asteroid impacts.',
      maxLevel: 3,
      costs: [150, 300, 600],
      effects: ['HP +20 · Dmg -10%', 'HP +40 · Dmg -20%', 'HP +60 · Dmg -35%'],
      apply(ship, level) { ship.maxHealth = 100 + level * 20; ship.damageReduction = level * 0.12; },
    },
  ],

  skins: [
    { id: 'classic', name: 'CLASSIC', emoji: '🚀', unlockScore: 0 },
    { id: 'fighter', name: 'FIGHTER', emoji: '✈️', unlockScore: 300 },
    { id: 'ufo',     name: 'SCOUT',   emoji: '🛸', unlockScore: 600 },
    { id: 'shuttle', name: 'SHUTTLE', emoji: '🛲', unlockScore: 1000 },
    { id: 'rocket',  name: 'HEAVY',   emoji: '🔭', unlockScore: 1500 },
  ],

  achievements: [
    { id: 'first_travel',    icon: '🚀', name: 'FIRST FLIGHT',     desc: 'Travel to your first planet.',          check: s => s.planetsVisited >= 1 },
    { id: 'explorer',        icon: '🌍', name: 'EXPLORER',         desc: 'Visit 5 planets total.',                check: s => s.totalPlanets >= 5 },
    { id: 'survivor',        icon: '💀', name: 'SURVIVOR',         desc: 'Survive 5 dangerous events.',           check: s => s.dangerousSurvived >= 5 },
    { id: 'treasure_hunter', icon: '💎', name: 'TREASURE HUNTER',  desc: 'Find space treasure.',                  check: s => s.treasureFound >= 1 },
    { id: 'speed_demon',     icon: '⚡', name: 'SPEED DEMON',      desc: 'Fully upgrade the warp drive.',         check: s => (s.upgrades.speed || 0) >= 3 },
    { id: 'centurion',       icon: '💯', name: 'CENTURION',        desc: 'Score 1000 points in a single mission.', check: s => s.sessionScore >= 1000 },
    { id: 'legend',          icon: '🏆', name: 'LEGEND',           desc: 'Score 3000 total points.',              check: s => s.totalScore >= 3000 },
    { id: 'economist',       icon: '💰', name: 'ECONOMIST',        desc: 'Accumulate 500 credits.',               check: s => s.credits >= 500 },
    { id: 'untouchable',     icon: '🛡️', name: 'UNTOUCHABLE',      desc: 'Complete a mission without hull damage.',check: s => s.sessionNoDamage },
    { id: 'marathon',        icon: '⏱️', name: 'MARATHON',         desc: 'Complete a mission with >2min left.',   check: s => s.sessionTimeLeft > 120 },
  ],
};


/* ═══════════════════════════════════════════════ STORAGE MANAGER ══ */
const StorageManager = {
  KEY: 'spaceExplorerSave',

  defaultSave() {
    return {
      totalScore: 0,
      credits: 0,
      totalPlanets: 0,
      dangerousSurvived: 0,
      treasureFound: 0,
      unlockedMissions: ['sol1', 'training'],
      unlockedGalaxies: ['solar'],
      upgrades: { speed: 0, fuel: 0, oxygen: 0, hull: 0 },
      achievements: [],
      activeSkin: 'classic',
      leaderboard: [],
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.defaultSave();
      return { ...this.defaultSave(), ...JSON.parse(raw) };
    } catch { return this.defaultSave(); }
  },

  save(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch {}
  },

  addLeaderboardEntry(save, score, planetsVisited, difficulty) {
    const rank = GameEngine.getRank(score);
    save.leaderboard.push({
      score, planetsVisited, difficulty, rank,
      date: new Date().toLocaleDateString(),
      pilot: `PILOT-${Math.floor(Math.random() * 9000 + 1000)}`,
    });
    save.leaderboard.sort((a, b) => b.score - a.score);
    save.leaderboard = save.leaderboard.slice(0, 10);
  },
};


/* ════════════════════════════════════════════════ GAME STATE ══ */
const GameState = {
  // Persistent
  save: null,

  // Session
  currentMission: null,
  difficulty: 'easy',

  // Spaceship object
  ship: null,

  // Mission state
  missionStarted: false,
  currentPlanetIdx: 0,
  planetsVisited: 0,
  eventsTriggered: 0,
  sessionScore: 0,
  sessionNoDamage: true,
  sessionTimeLeft: 300,
  timerInterval: null,
  isTraveling: false,

  makeShip() {
    const upgrades = this.save.upgrades;
    return {
      fuel:            100,
      maxFuel:         100,
      oxygen:          100 + (upgrades.oxygen || 0) * 25,
      maxOxygen:       100 + (upgrades.oxygen || 0) * 25,
      health:          100 + (upgrades.hull   || 0) * 20,
      maxHealth:       100 + (upgrades.hull   || 0) * 20,
      speed:           1   + (upgrades.speed  || 0) * 0.3,
      fuelEfficiency:  1   - (upgrades.fuel   || 0) * 0.1,
      damageReduction: (upgrades.hull || 0) * 0.12,
      score:           0,
      level:           1,
    };
  },

  diffMultiplier() {
    return { easy: 0.7, normal: 1.0, hard: 1.4 }[this.difficulty] || 1;
  },
};


/* ════════════════════════════════════════════════ SCREEN MANAGER ══ */
const ScreenManager = {
  screens: {},
  current: null,

  init() {
    document.querySelectorAll('.screen').forEach(el => {
      this.screens[el.id] = el;
    });
    this.current = 'screen-launch';
  },

  show(id) {
    Object.values(this.screens).forEach(el => {
      el.classList.remove('active');
    });
    const target = this.screens[id];
    if (target) {
      target.classList.add('active');
      this.current = id;
    }
  },
};


/* ════════════════════════════════════════════════ GAME ENGINE ══ */
const GameEngine = {

  getRank(score) {
    if (score >= 2000) return '★ ADMIRAL';
    if (score >= 1200) return '◆ COMMANDER';
    if (score >= 700)  return '▲ LIEUTENANT';
    if (score >= 300)  return '● ENSIGN';
    return '○ CADET';
  },

  startMission(missionId) {
    const mission = MissionData.missions.find(m => m.id === missionId);
    if (!mission) return;

    GameState.currentMission      = mission;
    GameState.ship                = GameState.makeShip();
    GameState.currentPlanetIdx    = 0;
    GameState.planetsVisited      = 0;
    GameState.eventsTriggered     = 0;
    GameState.sessionScore        = 0;
    GameState.sessionNoDamage     = true;
    GameState.sessionTimeLeft     = 300;
    GameState.isTraveling         = false;

    // Scale timer by difficulty
    const diff = GameState.difficulty;
    if (diff === 'easy')   GameState.sessionTimeLeft = 360;
    if (diff === 'normal') GameState.sessionTimeLeft = 300;
    if (diff === 'hard')   GameState.sessionTimeLeft = 240;

    UIController.initGameplay();
    ScreenManager.show('screen-gameplay');
    this.startTimer();

    UIController.addLog('🚀 Mission commenced. Good luck, Commander.', 'neutral');
    UIController.addLog(`📍 Destination: ${mission.name}`, 'neutral');
  },

  startTimer() {
    clearInterval(GameState.timerInterval);
    GameState.timerInterval = setInterval(() => {
      GameState.sessionTimeLeft--;
      UIController.updateTimer(GameState.sessionTimeLeft);

      // Passive oxygen and fuel drain
      const ship = GameState.ship;
      const drain = GameState.diffMultiplier();
      ship.oxygen -= 0.08 * drain;
      ship.fuel   -= 0.04 * drain;

      if (ship.oxygen < 0) ship.oxygen = 0;
      if (ship.fuel   < 0) ship.fuel   = 0;

      UIController.updateResourceBars();

      // Danger mode when resources low
      const gp = document.getElementById('screen-gameplay');
      if (ship.health < 25 || ship.oxygen < 15 || ship.fuel < 10) {
        gp.classList.add('danger-mode');
      } else {
        gp.classList.remove('danger-mode');
      }

      // Death by oxygen or fuel
      if (ship.oxygen <= 0) {
        clearInterval(GameState.timerInterval);
        UIController.addLog('💀 OXYGEN DEPLETED — Mission failed.', 'bad');
        setTimeout(() => this.endMission(false, 'oxygen'), 1500);
        return;
      }
      if (ship.fuel <= 0) {
        clearInterval(GameState.timerInterval);
        UIController.addLog('💀 FUEL EXHAUSTED — Ship adrift. Mission failed.', 'bad');
        setTimeout(() => this.endMission(false, 'fuel'), 1500);
        return;
      }
      if (ship.health <= 0) {
        clearInterval(GameState.timerInterval);
        UIController.addLog('💀 HULL BREACH — Ship destroyed. Mission failed.', 'bad');
        setTimeout(() => this.endMission(false, 'hull'), 1500);
        return;
      }

      if (GameState.sessionTimeLeft <= 0) {
        clearInterval(GameState.timerInterval);
        UIController.addLog('⏰ Time expired. Returning to base.', 'bad');
        setTimeout(() => this.endMission(true), 1500);
      }
    }, 1000);
  },

  travelToNextPlanet() {
    if (GameState.isTraveling) return;
    const mission = GameState.currentMission;
    const planets = mission.planetSequence;

    if (GameState.currentPlanetIdx >= planets.length - 1) {
      UIController.addLog('✅ All planets visited! Returning home.', 'good');
      clearInterval(GameState.timerInterval);
      setTimeout(() => this.endMission(true), 1500);
      return;
    }

    GameState.isTraveling = true;
    GameState.currentPlanetIdx++;

    const planetId   = planets[GameState.currentPlanetIdx];
    const planetData = MissionData.planets.find(p => p.id === planetId);
    const fuelCost   = Math.floor(
      planetData.fuelCost * GameState.ship.fuelEfficiency * GameState.diffMultiplier()
    );

    // Deduct fuel
    GameState.ship.fuel = Math.max(0, GameState.ship.fuel - fuelCost);

    // Travel animation
    const gp = document.getElementById('screen-gameplay');
    gp.classList.add('traveling');
    setTimeout(() => gp.classList.remove('traveling'), 1400);

    UIController.addLog(`🚀 Traveling to ${planetData.name}... (${fuelCost} fuel)`, 'neutral');
    UIController.animateShipToplanet(GameState.currentPlanetIdx);

    setTimeout(() => {
      GameState.planetsVisited++;
      GameState.isTraveling = false;

      // Score for visiting
      const scoreGain = Math.floor(planetData.reward * GameState.diffMultiplier());
      GameState.ship.score       += scoreGain;
      GameState.sessionScore     += scoreGain;
      GameState.ship.score        = GameState.sessionScore; // keep synced

      UIController.addLog(`🌍 Arrived at ${planetData.name}! +${scoreGain} points`, 'good');
      UIController.updateResourceBars();
      UIController.updateScoreDisplay();
      UIController.updateMiniMap();

      // Save global planet count
      GameState.save.totalPlanets = (GameState.save.totalPlanets || 0) + 1;

      // Check objectives
      UIController.checkObjectives();

      // Random event (60% chance, 80% on hard)
      const eventChance = GameState.difficulty === 'hard' ? 0.80
                        : GameState.difficulty === 'normal' ? 0.65 : 0.50;
      if (Math.random() < eventChance) {
        setTimeout(() => this.triggerRandomEvent(), 700);
      } else {
        UIController.addLog('📍 Sector clear. No anomalies detected.', 'neutral');
      }

      UIController.checkAchievements();
    }, 1400);
  },

  triggerRandomEvent() {
    const events = MissionData.events;
    const event  = events[Math.floor(Math.random() * events.length)];
    const ship   = GameState.ship;
    const dr     = ship.damageReduction || 0;

    // Apply effects
    const effectApplied = {};
    Object.entries(event.effects).forEach(([key, val]) => {
      let adjusted = val;
      if (val < 0 && (key === 'hp' || key === 'fuel' || key === 'oxygen')) {
        adjusted = Math.floor(val * (1 - dr) * GameState.diffMultiplier());
      }
      effectApplied[key] = adjusted;

      if (key === 'hp')      ship.health  = Math.min(ship.maxHealth,  Math.max(0, ship.health  + adjusted));
      if (key === 'fuel')    ship.fuel    = Math.min(ship.maxFuel,    Math.max(0, ship.fuel    + adjusted));
      if (key === 'oxygen')  ship.oxygen  = Math.min(ship.maxOxygen,  Math.max(0, ship.oxygen  + adjusted));
      if (key === 'score')   { ship.score += adjusted; GameState.sessionScore += adjusted; }
    });

    GameState.eventsTriggered++;
    if (event.type === 'bad') {
      if (ship.health < ship.maxHealth || effectApplied.hp < 0) {
        GameState.save.dangerousSurvived = (GameState.save.dangerousSurvived || 0) + 1;
      }
      GameState.sessionNoDamage = false;
    }
    if (event.id === 'treasure') {
      GameState.save.treasureFound = (GameState.save.treasureFound || 0) + 1;
    }

    UIController.showEventPopup(event, effectApplied);
    UIController.addLog(event.message, event.type === 'bad' ? 'bad' : event.type === 'good' ? 'good' : 'event');
    UIController.updateResourceBars();
    UIController.updateScoreDisplay();
    UIController.checkAchievements();
  },

  scanSector() {
    const r = Math.random();
    const ship = GameState.ship;
    let msg;

    if (r < 0.3) {
      const gain = Math.floor(Math.random() * 30 + 10);
      ship.oxygen = Math.min(ship.maxOxygen, ship.oxygen + gain);
      msg = `📡 Scan complete. Oxygen pocket detected! +${gain} O2`;
      UIController.addLog(msg, 'good');
    } else if (r < 0.6) {
      const gain = Math.floor(Math.random() * 20 + 8);
      ship.fuel = Math.min(ship.maxFuel, ship.fuel + gain);
      msg = `📡 Scan complete. Fuel cache nearby! +${gain} Fuel`;
      UIController.addLog(msg, 'good');
    } else if (r < 0.8) {
      const bonus = Math.floor(Math.random() * 50 + 20);
      GameState.sessionScore += bonus;
      msg = `📡 Scan complete. Stellar data collected. +${bonus} Score`;
      UIController.addLog(msg, 'neutral');
    } else {
      UIController.addLog('📡 Scan complete. Nothing significant detected.', 'neutral');
    }

    UIController.updateResourceBars();
    UIController.updateScoreDisplay();

    // Fuel cost for scan
    ship.fuel = Math.max(0, ship.fuel - 5);
  },

  emergencyRepair() {
    const ship = GameState.ship;
    if (ship.fuel < 20) {
      UIController.showToast('⚠️ Not enough fuel for repair!');
      return;
    }
    ship.fuel   -= 20;
    ship.health  = Math.min(ship.maxHealth, ship.health + 30);
    UIController.addLog('🔧 Emergency repair complete. +30 Hull, -20 Fuel.', 'good');
    UIController.updateResourceBars();
  },

  endMission(success, causeOfDeath = null) {
    clearInterval(GameState.timerInterval);
    document.getElementById('screen-gameplay').classList.remove('danger-mode');

    const score    = GameState.sessionScore;
    const save     = GameState.save;

    // Update persistent stats
    save.totalScore = (save.totalScore || 0) + score;
    save.credits    = (save.credits    || 0) + Math.floor(score * 0.4);
    GameState.sessionTimeLeft = Math.max(0, GameState.sessionTimeLeft);

    // Unlock next missions
    const mission = GameState.currentMission;
    if (success && score >= 300 && !save.unlockedMissions.includes('sol2')) save.unlockedMissions.push('sol2');
    if (success && score >= 600 && !save.unlockedMissions.includes('sol3')) save.unlockedMissions.push('sol3');
    if (success && score >= 1200 && !save.unlockedMissions.includes('sol4')) save.unlockedMissions.push('sol4');
    if (success && score >= 2000 && !save.unlockedMissions.includes('andromeda1')) {
      save.unlockedMissions.push('andromeda1');
      if (!save.unlockedGalaxies.includes('andromeda')) save.unlockedGalaxies.push('andromeda');
    }

    // Leaderboard
    StorageManager.addLeaderboardEntry(save, score, GameState.planetsVisited, GameState.difficulty);

    // Check session achievements
    GameState.save.sessionScore     = score;
    GameState.save.sessionNoDamage  = GameState.sessionNoDamage;
    GameState.save.sessionTimeLeft  = GameState.sessionTimeLeft;
    UIController.checkAchievements(true);

    StorageManager.save(save);
    UIController.showCompleteScreen(success, score, causeOfDeath);
  },

  purchaseUpgrade(upgradeId) {
    const def  = MissionData.upgrades.find(u => u.id === upgradeId);
    if (!def) return;
    const save = GameState.save;
    const curLevel = save.upgrades[upgradeId] || 0;

    if (curLevel >= def.maxLevel) {
      UIController.showToast('✅ Already at max level!');
      return;
    }
    const cost = def.costs[curLevel];
    if (save.credits < cost) {
      UIController.showToast(`⚠️ Need ${cost} credits!`);
      return;
    }

    save.credits         -= cost;
    save.upgrades[upgradeId] = curLevel + 1;
    StorageManager.save(save);
    UIController.showToast(`✅ ${def.name} upgraded to level ${curLevel + 1}!`);
    UIController.renderUpgradeScreen();
    UIController.checkAchievements();
  },

  selectSkin(skinId) {
    const skin     = MissionData.skins.find(s => s.id === skinId);
    const save     = GameState.save;
    if (!skin || save.totalScore < skin.unlockScore) {
      UIController.showToast(`🔒 Unlock at ${skin.unlockScore} total score.`);
      return;
    }
    save.activeSkin = skinId;
    StorageManager.save(save);
    UIController.renderUpgradeScreen();
    UIController.showToast(`✅ Skin activated: ${skin.name}`);
  },
};


/* ═══════════════════════════════════════════════ UI CONTROLLER ══ */
const UIController = {

  currentObjectives: [],
  completedObjectives: [],

  init() {
    this.bindButtons();
    this.renderMissionGrid();
    this.updateLaunchStats();
    this.renderUpgradeScreen();
  },

  bindButtons() {
    // Launch
    document.getElementById('btn-start').addEventListener('click', () => {
      ScreenManager.show('screen-mission');
      this.renderMissionGrid();
    });
    document.getElementById('btn-leaderboard-open').addEventListener('click', () => this.showLeaderboard());

    // Mission select back
    document.getElementById('btn-back-mission').addEventListener('click', () => ScreenManager.show('screen-launch'));

    // Difficulty
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        GameState.difficulty = btn.dataset.diff;
        this.renderMissionGrid();
      });
    });

    // Gameplay actions
    document.getElementById('btn-travel').addEventListener('click',  () => GameEngine.travelToNextPlanet());
    document.getElementById('btn-scan').addEventListener('click',    () => GameEngine.scanSector());
    document.getElementById('btn-repair').addEventListener('click',  () => GameEngine.emergencyRepair());
    document.getElementById('btn-restart-gp').addEventListener('click', () => {
      clearInterval(GameState.timerInterval);
      ScreenManager.show('screen-mission');
      this.renderMissionGrid();
    });
    document.getElementById('btn-upgrades-open').addEventListener('click', () => {
      this._upgradeFromGameplay = true;
      ScreenManager.show('screen-upgrade');
      this.renderUpgradeScreen();
    });

    // Complete screen
    document.getElementById('btn-play-again').addEventListener('click', () => {
      ScreenManager.show('screen-mission');
      this.renderMissionGrid();
    });
    document.getElementById('btn-home').addEventListener('click', () => {
      ScreenManager.show('screen-launch');
      this.updateLaunchStats();
    });
    document.getElementById('btn-upgrade-go').addEventListener('click', () => {
      this._upgradeFromGameplay = false;
      ScreenManager.show('screen-upgrade');
      this.renderUpgradeScreen();
    });

    // Upgrade back
    document.getElementById('btn-back-upgrade').addEventListener('click', () => {
      if (this._upgradeFromGameplay) {
        ScreenManager.show('screen-gameplay');
        this._upgradeFromGameplay = false;
      } else {
        ScreenManager.show('screen-complete');
      }
    });

    // Leaderboard
    document.getElementById('btn-lb-close').addEventListener('click', () => {
      document.getElementById('modal-leaderboard').classList.add('hidden');
    });

    // Event popup
    document.getElementById('ep-close').addEventListener('click', () => {
      document.getElementById('event-popup').classList.add('hidden');
      document.getElementById('event-backdrop').classList.add('hidden');
    });
  },

  /* ─── MISSION GRID ─────────────────────────────── */
  renderMissionGrid() {
    const grid    = document.getElementById('mission-grid');
    const save    = GameState.save;
    const diff    = GameState.difficulty;
    grid.innerHTML = '';

    MissionData.missions.forEach(m => {
      const isLocked   = !save.unlockedMissions.includes(m.id);
      const mDiff      = m.difficulty;
      const stars      = { easy: '★☆☆', normal: '★★☆', hard: '★★★' }[mDiff];
      const card       = document.createElement('div');
      card.className   = `mission-card ${isLocked ? 'locked' : ''}`;

      card.innerHTML = `
        ${isLocked ? '<div class="mc-lock">🔒</div>' : ''}
        <div class="mc-planet">${m.emoji}</div>
        <div class="mc-stars">${stars}</div>
        <div class="mc-name">${m.name}</div>
        <div class="mc-desc">${m.desc}</div>
        <div class="mc-meta">
          <span class="mc-tag diff-${mDiff}">${mDiff.toUpperCase()}</span>
          <span class="mc-tag reward">+${m.reward} CREDITS</span>
        </div>
      `;

      if (!isLocked) {
        card.addEventListener('click', () => GameEngine.startMission(m.id));
      } else {
        card.title = 'Complete previous missions to unlock.';
      }

      grid.appendChild(card);
    });
  },

  /* ─── GAMEPLAY INIT ─────────────────────────────── */
  initGameplay() {
    // Log
    const log = document.getElementById('mission-log');
    log.innerHTML = '';

    // Objectives
    const mission = GameState.currentMission;
    this.currentObjectives  = [...mission.objectives];
    this.completedObjectives = [];

    const objList = document.getElementById('gp-obj-list');
    objList.innerHTML = '';
    this.currentObjectives.forEach(obj => {
      const li = document.createElement('li');
      li.textContent = obj;
      li.dataset.obj = obj;
      objList.appendChild(li);
    });

    // Achievements
    this.renderAchievements();

    // Mini map
    this.initMiniMap();
    this.updateMiniMap();

    // Resource bars
    this.updateResourceBars();
    this.updateScoreDisplay();
    this.updateTimer(GameState.sessionTimeLeft);

    // Ship skin
    const skin = MissionData.skins.find(s => s.id === GameState.save.activeSkin) || MissionData.skins[0];
    document.getElementById('dash-ship-anim').textContent = skin.emoji;
  },

  addLog(text, type = 'neutral') {
    const log     = document.getElementById('mission-log');
    const now     = new Date();
    const time    = `${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const entry   = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-text ${type}">${text}</span>`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  },

  updateResourceBars() {
    const s = GameState.ship;
    if (!s) return;
    const pct = (v, max) => Math.max(0, Math.min(100, (v / max) * 100));

    document.getElementById('fuel-bar').style.width  = pct(s.fuel,   s.maxFuel) + '%';
    document.getElementById('oxy-bar').style.width   = pct(s.oxygen, s.maxOxygen) + '%';
    document.getElementById('hp-bar').style.width    = pct(s.health, s.maxHealth) + '%';
    document.getElementById('speed-bar').style.width = Math.min(100, s.speed * 40) + '%';

    document.getElementById('fuel-val').textContent  = Math.floor(s.fuel);
    document.getElementById('oxy-val').textContent   = Math.floor(s.oxygen);
    document.getElementById('hp-val').textContent    = Math.floor(s.health);
    document.getElementById('speed-val').textContent = s.speed.toFixed(1) + 'x';

    // Color warning
    const fuelBar = document.getElementById('fuel-bar');
    const oxyBar  = document.getElementById('oxy-bar');
    const hpBar   = document.getElementById('hp-bar');

    fuelBar.style.background = s.fuel < 20  ? 'linear-gradient(90deg, #aa3300, #ff3c5a)' : '';
    oxyBar.style.background  = s.oxygen < 20 ? 'linear-gradient(90deg, #aa3300, #ff3c5a)' : '';
    hpBar.style.background   = s.health < 20 ? 'linear-gradient(90deg, #aa0022, #ff3c5a)' : '';
  },

  updateScoreDisplay() {
    document.getElementById('score-display').textContent   = GameState.sessionScore;
    document.getElementById('level-display').textContent   = GameState.ship.level;
    document.getElementById('planets-display').textContent = GameState.planetsVisited;

    // Level up every 500 pts
    const newLevel = Math.floor(GameState.sessionScore / 500) + 1;
    if (newLevel > GameState.ship.level) {
      GameState.ship.level = newLevel;
      this.addLog(`⬆️ LEVEL UP! Now Level ${newLevel}.`, 'good');
      this.showToast(`🎉 Level Up! Level ${newLevel}`);
    }

    document.getElementById('header-score-val').textContent = GameState.save.totalScore || 0;
  },

  updateTimer(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    const str = `${m}:${s}`;
    document.getElementById('gp-timer').textContent = str;

    // Color urgency
    const el = document.getElementById('gp-timer');
    el.style.color = seconds < 30 ? '#ff3c5a' : seconds < 60 ? '#ffb800' : '';
  },

  checkObjectives() {
    const ship  = GameState.ship;
    const score = GameState.sessionScore;
    const list  = document.getElementById('gp-obj-list');
    const items = list ? list.querySelectorAll('li') : [];

    items.forEach(li => {
      const txt = li.dataset.obj;
      let done  = false;

      if (txt.startsWith('Visit') && txt.includes('planets')) {
        const n = parseInt(txt.match(/\d+/)?.[0]);
        if (!isNaN(n) && GameState.planetsVisited >= n) done = true;
      }
      if (txt.startsWith('Visit Jupiter')) {
        const seq = GameState.currentMission.planetSequence;
        const idx = GameState.currentPlanetIdx;
        done = seq.slice(0, idx + 1).includes('jupiter') && seq.slice(0, idx + 1).includes('saturn');
      }
      if (txt.startsWith('Score')) {
        const n = parseInt(txt.replace(/,/g,'').match(/\d+/)?.[0]);
        if (!isNaN(n) && score >= n) done = true;
      }
      if (txt.startsWith('Survive') && txt.includes('events')) {
        const n = parseInt(txt.match(/\d+/)?.[0]);
        if (!isNaN(n) && GameState.eventsTriggered >= n) done = true;
      }
      if (txt.startsWith('Maintain oxygen')) {
        done = ship.oxygen > 30;
      }
      if (txt.startsWith('Visit all')) done = GameState.planetsVisited >= 8;
      if (txt.startsWith('Keep hull')) done = ship.health > 20;

      if (done && !li.classList.contains('done')) {
        li.classList.add('done');
        this.addLog(`✅ Objective complete: ${txt}`, 'good');
        this.showToast(`✅ ${txt}`);
      }
    });
  },

  /* ─── MINI MAP ──────────────────────────────────── */
  initMiniMap() {
    const miniPlanets = document.getElementById('mini-planets');
    const miniSvg     = document.getElementById('mini-svg');
    const mission     = GameState.currentMission;
    miniPlanets.innerHTML = '';
    miniSvg.innerHTML     = '';

    // Draw path lines
    const seq     = mission.planetSequence;
    const planets = MissionData.planets;

    for (let i = 0; i < seq.length - 1; i++) {
      const p1 = planets.find(p => p.id === seq[i]);
      const p2 = planets.find(p => p.id === seq[i + 1]);
      if (!p1 || !p2) continue;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', `${p1.x * 100}%`);
      line.setAttribute('y1', `${p1.y * 100}%`);
      line.setAttribute('x2', `${p2.x * 100}%`);
      line.setAttribute('y2', `${p2.y * 100}%`);
      line.setAttribute('stroke', 'rgba(0,200,255,0.18)');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '4,4');
      miniSvg.appendChild(line);
    }

    // Planet nodes
    seq.forEach((planetId, idx) => {
      const pd   = planets.find(p => p.id === planetId);
      if (!pd) return;
      const node = document.createElement('div');
      node.className = 'mini-planet-node';
      node.style.left = `${pd.x * 100}%`;
      node.style.top  = `${pd.y * 100}%`;
      node.textContent = pd.emoji;
      node.dataset.idx = idx;

      // Label
      const label = document.createElement('div');
      label.className = 'planet-label';
      label.style.left = `${pd.x * 100}%`;
      label.style.top  = `calc(${pd.y * 100}% + 16px)`;
      label.textContent = pd.name;
      miniPlanets.appendChild(label);
      miniPlanets.appendChild(node);
    });
  },

  updateMiniMap() {
    const seq     = GameState.currentMission.planetSequence;
    const idx     = GameState.currentPlanetIdx;
    const planets = MissionData.planets;

    // Update planet styles
    const nodes = document.querySelectorAll('.mini-planet-node');
    nodes.forEach(n => {
      const nIdx = parseInt(n.dataset.idx);
      n.classList.remove('current', 'visited');
      if (nIdx === idx)  n.classList.add('current');
      if (nIdx < idx)    n.classList.add('visited');
    });

    // Move ship
    const pd   = planets.find(p => p.id === seq[idx]);
    if (!pd) return;
    const ship = document.getElementById('mini-ship');
    ship.style.left = `${pd.x * 100}%`;
    ship.style.top  = `${pd.y * 100}%`;
  },

  animateShipToplanet(idx) {
    this.updateMiniMap();
  },

  /* ─── EVENTS ────────────────────────────────────── */
  showEventPopup(event, effects) {
    document.getElementById('ep-icon').textContent  = event.icon;
    document.getElementById('ep-title').textContent = event.title;
    document.getElementById('ep-desc').textContent  = event.desc;

    const efDiv = document.getElementById('ep-effects');
    efDiv.innerHTML = '';
    Object.entries(effects).forEach(([key, val]) => {
      const label  = { hp: 'HULL', fuel: 'FUEL', oxygen: 'OXYGEN', score: 'SCORE' }[key] || key.toUpperCase();
      const isPos  = val > 0;
      const badge  = document.createElement('div');
      badge.className = `ep-effect ${isPos ? 'pos' : 'neg'}`;
      badge.textContent = `${label}: ${isPos ? '+' : ''}${val}`;
      efDiv.appendChild(badge);
    });

    document.getElementById('event-popup').classList.remove('hidden');
    document.getElementById('event-backdrop').classList.remove('hidden');
  },

  /* ─── COMPLETE SCREEN ──────────────────────────── */
  showCompleteScreen(success, score, cause) {
    const rank = GameEngine.getRank(score);

    document.getElementById('complete-icon').textContent  = success ? '🎖️' : '💀';
    document.getElementById('complete-title').textContent = success ? 'MISSION COMPLETE' : 'MISSION FAILED';
    document.getElementById('complete-sub').textContent   = success
      ? 'Excellent work, Commander. Mission accomplished.'
      : `Ship lost: ${cause ? cause.toUpperCase() + ' DEPLETION' : 'UNKNOWN CAUSE'}`;

    document.getElementById('cs-score').textContent   = score;
    document.getElementById('cs-planets').textContent = GameState.planetsVisited;
    document.getElementById('cs-events').textContent  = GameState.eventsTriggered;
    document.getElementById('cs-time').textContent    = GameState.sessionTimeLeft + 's';
    document.getElementById('cs-rank').textContent    = rank;

    // Unlock message
    const unlockDiv = document.getElementById('complete-unlock');
    let unlockMsg = '';
    if (score >= 2000 && !GameState.save.unlockedGalaxies?.includes('andromeda_shown')) {
      unlockMsg = '🌌 NEW GALAXY UNLOCKED: ANDROMEDA SYSTEM';
    } else if (score >= 1200) {
      unlockMsg = '✅ New missions available in Mission Select!';
    } else {
      unlockMsg = `Credits earned: +${Math.floor(score * 0.4)} · Total: ${GameState.save.credits}`;
    }
    unlockDiv.textContent = unlockMsg;

    document.getElementById('upgrade-credits').textContent = GameState.save.credits || 0;

    ScreenManager.show('screen-complete');
  },

  /* ─── UPGRADE SCREEN ───────────────────────────── */
  renderUpgradeScreen() {
    const save   = GameState.save;
    document.getElementById('upgrade-credits').textContent = save.credits || 0;

    // Upgrades
    const grid   = document.getElementById('upgrade-grid');
    grid.innerHTML = '';
    MissionData.upgrades.forEach(upg => {
      const level  = save.upgrades[upg.id] || 0;
      const maxed  = level >= upg.maxLevel;
      const cost   = maxed ? '—' : upg.costs[level];
      const pips   = Array.from({ length: upg.maxLevel }, (_, i) =>
        `<div class="uc-pip ${i < level ? 'filled' : ''}"></div>`).join('');

      const card   = document.createElement('div');
      card.className = `upgrade-card ${maxed ? 'maxed' : ''}`;
      card.innerHTML = `
        <div class="uc-icon">${upg.icon}</div>
        <div class="uc-name">${upg.name}</div>
        <div class="uc-desc">${upg.desc}</div>
        <div class="uc-level">${pips}</div>
        <div>${maxed
          ? '<div class="uc-maxed">✅ MAX LEVEL</div>'
          : `<div class="uc-cost">COST: ${cost} CREDITS · ${upg.effects[level]}</div>`}</div>
      `;
      if (!maxed) {
        card.addEventListener('click', () => GameEngine.purchaseUpgrade(upg.id));
      }
      grid.appendChild(card);
    });

    // Skins
    const skinRow = document.getElementById('skin-row');
    skinRow.innerHTML = '';
    MissionData.skins.forEach(skin => {
      const unlocked = save.totalScore >= skin.unlockScore;
      const active   = save.activeSkin === skin.id;
      const card     = document.createElement('div');
      card.className = `skin-card ${active ? 'active' : ''} ${!unlocked ? 'locked-skin' : ''}`;
      card.innerHTML = `
        <div class="skin-emoji">${skin.emoji}</div>
        <div class="skin-name">${skin.name}</div>
        ${!unlocked ? `<div class="skin-name" style="color:#ff3c5a;font-size:.6rem;">LOCKED ${skin.unlockScore}pts</div>` : ''}
      `;
      card.addEventListener('click', () => GameEngine.selectSkin(skin.id));
      skinRow.appendChild(card);
    });
  },

  /* ─── ACHIEVEMENTS ──────────────────────────────── */
  renderAchievements() {
    const list  = document.getElementById('ach-list');
    list.innerHTML = '';
    const save  = GameState.save;

    MissionData.achievements.forEach(a => {
      const unlocked = save.achievements?.includes(a.id);
      const div      = document.createElement('div');
      div.className  = `ach-item ${unlocked ? 'unlocked' : 'ach-locked'}`;
      div.id         = `ach-${a.id}`;
      div.title      = a.desc;
      div.innerHTML  = `<span class="ach-icon">${a.icon}</span><span class="ach-name">${a.name}</span>`;
      list.appendChild(div);
    });
  },

  checkAchievements(final = false) {
    const save = GameState.save;
    if (!save.achievements) save.achievements = [];

    // Build check state
    const checkState = {
      ...save,
      planetsVisited: GameState.planetsVisited,
      sessionScore:   GameState.sessionScore,
      sessionNoDamage: GameState.sessionNoDamage,
      sessionTimeLeft: GameState.sessionTimeLeft,
    };

    MissionData.achievements.forEach(a => {
      if (save.achievements.includes(a.id)) return;
      try {
        if (a.check(checkState)) {
          save.achievements.push(a.id);
          StorageManager.save(save);
          this.showToast(`🏅 Achievement: ${a.name}!`);
          this.addLog(`🏅 Achievement unlocked: ${a.name}`, 'good');

          // Update UI
          const el = document.getElementById(`ach-${a.id}`);
          if (el) el.classList.add('unlocked'), el.classList.remove('ach-locked');
        }
      } catch {}
    });
  },

  /* ─── LEADERBOARD ───────────────────────────────── */
  showLeaderboard() {
    const save = GameState.save;
    const body = document.getElementById('lb-body');
    body.innerHTML = '';

    const entries = save.leaderboard || [];
    if (!entries.length) {
      body.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#5a8aaa;padding:20px;">No missions logged yet.</td></tr>';
    } else {
      entries.forEach((e, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td>${e.pilot}</td><td>${e.score}</td><td>${e.rank}</td>`;
        body.appendChild(tr);
      });
    }
    document.getElementById('modal-leaderboard').classList.remove('hidden');
  },

  /* ─── LAUNCH STATS ──────────────────────────────── */
  updateLaunchStats() {
    const save = GameState.save;
    const el   = document.getElementById('launch-stats');
    el.textContent = `TOTAL SCORE: ${save.totalScore || 0}  ·  CREDITS: ${save.credits || 0}  ·  ACHIEVEMENTS: ${(save.achievements || []).length}/${MissionData.achievements.length}`;
  },

  /* ─── TOAST ─────────────────────────────────────── */
  _toastTimeout: null,
  showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    el.classList.add('show');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.classList.add('hidden'), 400);
    }, 2800);
  },
};


/* ═════════════════════════════════════════════════════ BOOT ══ */
(function boot() {
  StarfieldRenderer.start();
  ScreenManager.init();
  GameState.save = StorageManager.load();
  UIController.init();
  document.getElementById('header-score-val').textContent = GameState.save.totalScore || 0;
  document.getElementById('map-score-val') && (document.getElementById('map-score-val').textContent = GameState.save.totalScore || 0);
})();