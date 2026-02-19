import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  ShieldAlert,
  Coins,
  MousePointer2,
  Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import './App.css';

// --- Constants ---
const INITIAL_CONFIG = [
  {
    id: 1,
    type: 'cylinder',
    title: "LEVEL 01",
    clue: "Arm A,B. All Keys Horizontal. I am the darkest night at sea. In the world of direct current (DC), I am the 'ground'. What color am I? (Wire Target - Black)",
    timer: 60,
    wires: [
      { id: 'black', color: '#1a1a1a', isCorrect: true },
      { id: 'red', color: '#ff3e3e', isCorrect: false }
    ],
    switches: [{ id: 'A', label: 'A', isCorrect: true }, { id: 'B', label: 'B', isCorrect: true }],
    levers: [],
    knobs: [{ id: 'K1', label: 'DIAL', isCorrect: 2, current: 0 }],
    keys: [],
    hasKeypad: false,
    keypadCode: "",
    hasButtons: false,
    batteries: 2,
    ports: ["DVI", "Serial"],
    chips: [{ id: 'C1', label: 'MT-40', isCorrect: true }],
    resistors: [{ id: 'R1', color: '#b91c1c' }, { id: 'R2', color: '#1d4ed8' }],
    leds: [{ id: 'L1', label: 'PWR', color: '#ef4444', linkedSwitch: 'A' }],
    hasExit: true
  },
  {
    id: 2,
    type: 'crate',
    title: "LEVEL 02",
    clue: "All Keys Horizontal. In the pirate's code of resistor bands, I represent the number 5. I'm the color of a lucky clover found on a distant shore. What am I? (Wire Target - Green) I am the color of the 'Go' button on the Kraken-repelling machine. What am I? (Button Target - Green)",
    timer: 45,
    wires: [
      { id: 'green', color: '#22c55e', isCorrect: true },
      { id: 'purple', color: '#a855f7', isCorrect: false }
    ],
    switches: [
      { id: 'A', label: 'A', isCorrect: true },
      { id: 'B', label: 'B', isCorrect: true },
      { id: 'C', label: 'C', isCorrect: true }
    ],
    levers: [],
    knobs: [],
    keys: [{ id: 'K1', label: 'SECURE', isCorrect: true, state: false }],
    hasKeypad: false,
    keypadCode: "",
    hasButtons: true,
    buttons: [
      { id: 'BTN1', color: '#22c55e', isCorrect: true }
    ],
    batteries: 3,
    ports: ["Parallel", "RJ-45"],
    chips: [],
    resistors: [{ id: 'R1', color: '#facc15' }],
    leds: [{ id: 'L1', label: 'GO', color: '#22c55e', linkedSwitch: 'A' }],
    hasExit: true
  },
  {
    id: 3,
    type: 'bundle',
    title: "LEVEL 03",
    clue: "All Security Keys ON. In the pirate's code of resistor bands, I represent the number 5. I'm the color of a lucky clover found on a distant shore. What am I? (Wire Target - Yellow) A cannon-heating resistor of 21 Ω carries 21 A before firing. Power dissipated? (Safe Code - 9261)",
    timer: 40,
    wires: [
      { id: 'yellow', color: '#facc15', isCorrect: true },
      { id: 'green', color: '#22c55e', isCorrect: false }
    ],
    switches: [
      { id: 'A', label: 'A', isCorrect: true },
      { id: 'B', label: 'B', isCorrect: true }
    ],
    levers: [],
    knobs: [],
    keys: [
      { id: 'K1', label: 'KY1', isCorrect: true, state: false },
      { id: 'K2', label: 'KY2', isCorrect: true, state: false },
      { id: 'K3', label: 'KY3', isCorrect: true, state: false }
    ],
    hasKeypad: false,
    keypadCode: "9261",
    hasButtons: false,
    batteries: 4,
    ports: ["DVI", "Serial"],
    chips: [{ id: 'C1', label: 'CPU-X', isCorrect: true }],
    resistors: [{ id: 'R1', color: '#facc15' }],
    leds: [{ id: 'L1', label: 'PWR', color: '#22c55e', linkedSwitch: 'A' }],
    hasExit: true
  }
];

function App() {
  const [rooms, setRooms] = useState({ '123456': INITIAL_CONFIG });
  const [currentRoomCode, setCurrentRoomCode] = useState("");
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [gameState, setGameState] = useState('menu'); // menu, intro, ready, playing, joining, failed, success, victory
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPenaltyActive, setIsPenaltyActive] = useState(false);
  const [cutWires, setCutWires] = useState([]);
  const [activeSwitches, setActiveSwitches] = useState({});
  const [activeLevers, setActiveLevers] = useState({});
  const [knobPositions, setKnobPositions] = useState({}); // { id: number }
  const [keyStates, setKeyStates] = useState({}); // { id: boolean }
  const [buttonPressed, setButtonPressed] = useState({}); // { id: boolean }
  const [enteredCode, setEnteredCode] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [wallet, setWallet] = useState(0);
  const [exitActivated, setExitActivated] = useState(false);

  const timerRef = useRef(null);
  const currentLevel = config[currentLevelIdx];

  // Load broadcasts from localStorage on app start
  useEffect(() => {
    const broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '{}');
    if (broadcasts && Object.keys(broadcasts).length > 0) {
      const formattedRooms = {};
      Object.entries(broadcasts).forEach(([code, data]) => {
        formattedRooms[code] = data.config || data;
      });
      setRooms(prev => ({ ...prev, ...formattedRooms }));
    }
  }, []);

  const handleCreateRoom = () => {
    setIsAdmin(true);
    setGameState('menu');
  };

  const handleGenerateRoomCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to localStorage
    const broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '{}');
    broadcasts[newCode] = {
      config,
      createdAt: new Date().toISOString(),
      accessCount: 0
    };
    localStorage.setItem('broadcasts', JSON.stringify(broadcasts));
    
    const newRooms = { ...rooms, [newCode]: config };
    setRooms(newRooms);
    setCurrentRoomCode(newCode);
    
    // Download as JSON file too (backup)
    const timestamp = new Date().toLocaleString().replace(/[\/:\s]/g, '_');
    const filename = `bomb_mission_${newCode}_${timestamp}.json`;
    const dataStr = JSON.stringify({ roomCode: newCode, config: config, timestamp: new Date().toISOString() }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`✓ MISSION BROADCASTED!\n\nROOM CODE: ${newCode}\n\nShare this code with others to play together!\nFile saved to Downloads as backup.`);
  };

  const handleJoinRoom = () => {
    // Try to get from localStorage broadcasts first
    const broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '{}');
    let broadcastConfig = null;
    
    if (broadcasts[joinCodeInput]) {
      broadcastConfig = broadcasts[joinCodeInput].config;
    }
    
    if (broadcastConfig) {
      setConfig(broadcastConfig);
      setGameState('intro');
      setCurrentLevelIdx(0);
      setJoinCodeInput("");
      // Also save to local rooms for reference
      setRooms(prev => ({ ...prev, [joinCodeInput]: broadcastConfig }));
    } else if (rooms[joinCodeInput]) {
      // Fallback to local rooms if not in broadcasts
      setConfig(rooms[joinCodeInput]);
      setGameState('intro');
      setCurrentLevelIdx(0);
      setJoinCodeInput("");
    } else {
      setFeedback("✗ MISSION NOT FOUND: Invalid authentication code");
      setIsPenaltyActive(true);
      setTimeout(() => { setFeedback(""); setIsPenaltyActive(false); }, 1500);
    }
  };

  const startLevel = () => {
    setTimeLeft(currentLevel.timer);
    setGameState('playing');
    setCutWires([]);
    setActiveSwitches({});
    setActiveLevers({});
    setKnobPositions(currentLevel.knobs?.reduce((acc, k) => ({ ...acc, [k.id]: k.current || 0 }), {}) || {});
    setKeyStates({});
    setButtonPressed({});
    setEnteredCode("");
    setIsPenaltyActive(false);
    setFeedback("");
    setExitActivated(false);
  };

  const nextLevel = () => {
    if (currentLevelIdx < config.length - 1) {
      setCurrentLevelIdx(prev => prev + 1);
      setGameState('ready');
    } else {
      // After last level, go to joining screen instead of victory
      setCurrentLevelIdx(0);
      setGameState('joining');
      setWallet(0);
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
    }
  };

  const checkVictory = () => {
    setGameState('success');
    setWallet(prev => prev + 100);
  };

  const handleWireCut = (wireId, isCorrect) => {
    if (gameState !== 'playing' || cutWires.includes(wireId)) return;

    const reqSwitches = currentLevel.switches || [];
    const switchErr = reqSwitches.some(s => (s.isCorrect && !activeSwitches[s.id]) || (!s.isCorrect && activeSwitches[s.id]));
    const reqLevers = currentLevel.levers || [];
    const leverErr = reqLevers.some(l => (l.isCorrect && !activeLevers[l.id]) || (!l.isCorrect && activeLevers[l.id]));
    const reqKnobs = currentLevel.knobs || [];
    const knobErr = reqKnobs.some(k => (knobPositions[k.id] || 0) !== k.isCorrect);
    const reqKeys = currentLevel.keys || [];
    const keyErr = reqKeys.some(k => (k.isCorrect && !keyStates[k.id]) || (!k.isCorrect && keyStates[k.id]));

    if (switchErr || leverErr || knobErr || keyErr) {
      setFeedback("ERROR: SECURITY PROTOCOL FAILURE");
      triggerPenalty();
      return;
    }

    if (currentLevel.hasKeypad && enteredCode !== currentLevel.keypadCode) {
      setFeedback("ERROR: CODE SEQUENCE MISMATCH");
      triggerPenalty();
      return;
    }

    setCutWires(prev => [...prev, wireId]);
    if (isCorrect) {
      setGameState('success');
      setWallet(prev => prev + 100);
      setFeedback("DEVICE NEUTRALIZED");
    } else {
      setFeedback("ERROR: SYSTEM BREACH - SPEED INCREASED");
      triggerPenalty();
    }
  };

  const handleExit = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    // Prevent multiple clicks
    if (gameState !== 'playing' || !currentLevel.hasExit || exitActivated) return;

    const reqSwitches = currentLevel.switches || [];
    const switchErr = reqSwitches.some(s => (s.isCorrect && !activeSwitches[s.id]) || (!s.isCorrect && activeSwitches[s.id]));
    const reqLevers = currentLevel.levers || [];
    const leverErr = reqLevers.some(l => (l.isCorrect && !activeLevers[l.id]) || (!l.isCorrect && activeLevers[l.id]));
    const reqKnobs = currentLevel.knobs || [];
    const knobErr = reqKnobs.some(k => (knobPositions[k.id] || 0) !== k.isCorrect);
    const reqKeys = currentLevel.keys || [];
    const keyErr = reqKeys.some(k => (k.isCorrect && !keyStates[k.id]) || (!k.isCorrect && keyStates[k.id]));

    // Validate all conditions first, don't trigger penalty yet
    if (switchErr) {
      setFeedback("ERROR: SWITCHES NOT CONFIGURED");
      return;
    }
    if (leverErr) {
      setFeedback("ERROR: LEVERS NOT IN POSITION");
      return;
    }
    if (knobErr) {
      setFeedback("ERROR: DIALS NOT ALIGNED");
      return;
    }
    if (keyErr) {
      setFeedback("ERROR: KEYS NOT TURNED");
      return;
    }

    if (currentLevel.hasKeypad && enteredCode !== currentLevel.keypadCode) {
      setFeedback("ERROR: CODE SEQUENCE MISMATCH");
      return;
    }

    // Check if all wires are cut
    const allWiresCut = currentLevel.wires.every(w => cutWires.includes(w.id));
    if (!allWiresCut) {
      setFeedback("ERROR: ALL CIRCUITS MUST BE SEVERED");
      return;
    }

    // Mark as activated FIRST to prevent re-clicks
    setExitActivated(true);
    setGameState('success');
    setWallet(prev => prev + 100);
    setFeedback("MISSION COMPLETE - EXIT SECURED");
  };

  const triggerPenalty = () => setIsPenaltyActive(true);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const interval = isPenaltyActive ? 500 : 1000;
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('failed');
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, interval);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, isPenaltyActive]);

  // --- Keyboard/Numpad Support ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if focused on input, textarea, or select element
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Only handle keypad input when in menu state (joining)
      if (gameState !== 'menu') return;

      // Check if it's a numpad number (0-9)
      if (e.code.startsWith('Numpad')) {
        const digit = e.code.replace('Numpad', '');
        if (/^\d$/.test(digit)) {
          e.preventDefault();
          setJoinCodeInput(p => (p + digit).slice(0, 6));
          return;
        }
      }

      // Also support regular number keys
      if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setJoinCodeInput(p => (p + e.key).slice(0, 6));
        return;
      }

      // Handle Backspace to delete last digit
      if (e.key === 'Backspace') {
        e.preventDefault();
        setJoinCodeInput(p => p.slice(0, -1));
        return;
      }

      // Handle Enter to submit code
      if (e.key === 'Enter') {
        e.preventDefault();
        if (joinCodeInput.length === 6) {
          handleJoinRoom();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, joinCodeInput]);

  // --- Admin Logic ---
  const updateLvl = (idx, field, val) => {
    const next = [...config];
    next[idx] = { ...next[idx], [field]: val };
    setConfig(next);
  };

  const addWire = (idx) => {
    const next = [...config];
    next[idx].wires = [...next[idx].wires, { id: Math.random().toString(36).substr(2, 5), color: '#ffffff', isCorrect: false }];
    setConfig(next);
  };

  const removeWire = (idx, wireIdx) => {
    const next = [...config];
    const newWires = [...next[idx].wires];
    newWires.splice(wireIdx, 1);
    next[idx].wires = newWires;
    setConfig(next);
  };

  const addSwitch = (idx) => {
    const next = [...config];
    const id = String.fromCharCode(65 + (next[idx].switches?.length || 0));
    next[idx].switches = [...(next[idx].switches || []), { id, label: id, isCorrect: true }];
    setConfig(next);
  };

  const removeSwitch = (idx, sIdx) => {
    const next = [...config];
    const newSwitches = [...next[idx].switches];
    newSwitches.splice(sIdx, 1);
    next[idx].switches = newSwitches;
    setConfig(next);
  };

  const addLever = (idx) => {
    const next = [...config];
    const id = String.fromCharCode(88 - (next[idx].levers?.length || 0));
    next[idx].levers = [...(next[idx].levers || []), { id, label: id, isCorrect: true }];
    setConfig(next);
  };

  const removeLever = (idx, lIdx) => {
    const next = [...config];
    const newLevers = [...next[idx].levers];
    newLevers.splice(lIdx, 1);
    next[idx].levers = newLevers;
    setConfig(next);
  };

  const addKnob = (idx) => {
    const next = [...config];
    const id = 'KN-' + (next[idx].knobs?.length || 0);
    next[idx].knobs = [...(next[idx].knobs || []), { id, label: 'KNOB', isCorrect: 1, current: 0 }];
    setConfig(next);
  };

  const removeKnob = (idx, kIdx) => {
    const next = [...config];
    const newKnobs = [...next[idx].knobs];
    newKnobs.splice(kIdx, 1);
    next[idx].knobs = newKnobs;
    setConfig(next);
  };

  const addKey = (idx) => {
    const next = [...config];
    const id = 'KY-' + (next[idx].keys?.length || 0);
    next[idx].keys = [...(next[idx].keys || []), { id, label: 'KEY', isCorrect: true, state: false }];
    setConfig(next);
  };

  const removeKey = (idx, keyIdx) => {
    const next = [...config];
    const newKeys = [...next[idx].keys];
    newKeys.splice(keyIdx, 1);
    next[idx].keys = newKeys;
    setConfig(next);
  };

  const addChip = (idx) => {
    const next = [...config];
    const id = 'CH-' + (next[idx].chips?.length || 0);
    next[idx].chips = [...(next[idx].chips || []), { id, label: 'CHIP', isCorrect: true }];
    setConfig(next);
  };

  const removeChip = (idx, cIdx) => {
    const next = [...config];
    const newChips = [...next[idx].chips];
    newChips.splice(cIdx, 1);
    next[idx].chips = newChips;
    setConfig(next);
  };

  const togglePort = (idx, port) => {
    const next = [...config];
    const currentPorts = next[idx].ports || [];
    if (currentPorts.includes(port)) {
      next[idx].ports = currentPorts.filter(p => p !== port);
    } else {
      next[idx].ports = [...currentPorts, port];
    }
    setConfig(next);
  };

  const addResistor = (idx) => {
    const next = [...config];
    next[idx].resistors = [...(next[idx].resistors || []), { id: `R${Date.now()}`, color: '#ffcc00' }];
    setConfig(next);
  };

  const removeResistor = (idx, rIdx) => {
    const next = [...config];
    next[idx].resistors = next[idx].resistors.filter((_, i) => i !== rIdx);
    setConfig(next);
  };

  const addLed = (idx) => {
    const next = [...config];
    next[idx].leds = [...(next[idx].leds || []), { id: `L${Date.now()}`, label: 'STATUS', color: '#ff0000', linkedSwitch: '' }];
    setConfig(next);
  };

  const removeLed = (idx, lIdx) => {
    const next = [...config];
    next[idx].leds = next[idx].leds.filter((_, i) => i !== lIdx);
    setConfig(next);
  };

  // Export all missions to JSON file
  const handleExportAllMissions = () => {
    const timestamp = new Date().toLocaleString().replace(/[\/:\s]/g, '_');
    const filename = `all_bomb_missions_${timestamp}.json`;
    const dataStr = JSON.stringify({ missions: rooms, exportDate: new Date().toISOString() }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('✓ All missions exported to Downloads!');
  };

  // Import missions from JSON file
  const handleImportMissions = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result);
        let newRooms = { ...rooms };
        let importedCount = 0;

        // Handle "Export All" format (missions object)
        if (importedData.missions && typeof importedData.missions === 'object') {
          newRooms = { ...newRooms, ...importedData.missions };
          importedCount = Object.keys(importedData.missions).length;
        }
        // Handle "Export Current Config" format (single config with roomCode)
        else if (importedData.config && Array.isArray(importedData.config) && importedData.roomCode) {
          newRooms[importedData.roomCode] = importedData.config;
          importedCount = 1;
        }
        // Handle single room broadcast format
        else if (importedData.config && Array.isArray(importedData.config)) {
          const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
          newRooms[roomCode] = importedData.config;
          importedCount = 1;
        }
        // Handle array format directly
        else if (Array.isArray(importedData)) {
          const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
          newRooms[roomCode] = importedData;
          importedCount = 1;
        }
        else {
          alert('✗ Invalid file format. Please export from the game first.');
          return;
        }

        if (importedCount > 0) {
          setRooms(newRooms);
          alert(`✓ Imported ${importedCount} mission(s)!`);
        } else {
          alert('✗ No valid missions found in file.');
        }
      } catch (err) {
        alert('✗ Error reading file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Export current working config
  const handleExportCurrentConfig = () => {
    const timestamp = new Date().toLocaleString().replace(/[\/:\s]/g, '_');
    const filename = `bomb_config_${timestamp}.json`;
    const dataStr = JSON.stringify({ config: config, exportDate: new Date().toISOString() }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('✓ Current config exported to Downloads!');
  };

  // --- Views ---
  if (isAdmin) {
    return (
      <div className="admin-overlay">
        <header className="admin-header">
          <div className="header-meta">
            <h2>BOMB FACTORY CMS</h2>
            {currentRoomCode && <span className="active-room">Room: {currentRoomCode}</span>}
          </div>
          <div className="header-actions">
            <button className="btn-broadcast" style={{ background: 'var(--green-primary)', color: '#000' }} onClick={() => setConfig([...config, { ...INITIAL_CONFIG[0], id: Date.now(), title: `LEVEL ${config.length + 1}` }])}>
              <Plus size={18} /> NEW MISSION
            </button>
            <button className="btn-broadcast" onClick={handleGenerateRoomCode}><Zap size={18} /> BROADCAST</button>
            <button className="btn-broadcast" style={{ background: '#0088ff', color: '#fff' }} onClick={handleExportCurrentConfig}><Save size={18} /> EXPORT CONFIG</button>
            <button className="btn-broadcast" style={{ background: '#ff9900', color: '#000' }} onClick={handleExportAllMissions}><Save size={18} /> EXPORT ALL</button>
            <label className="btn-broadcast" style={{ background: '#9933ff', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>📥 IMPORT</span>
              <input type="file" accept=".json" onChange={handleImportMissions} style={{ display: 'none' }} />
            </label>
            <button className="btn-close-admin" onClick={() => setIsAdmin(false)}><Save size={20} /> SAVE & EXIT</button>
          </div>
        </header>
        <div className="admin-body">
          {config.map((lvl, idx) => (
            <div key={idx} className="level-config-block">
              <div className="lvl-config-header">
                <ShieldAlert size={20} className="lvl-icon" />
                <h3>MISSION CONFIGURATION: {lvl.title}</h3>
                <button className="btn-del" style={{ marginLeft: 'auto' }} onClick={() => setConfig(config.filter((_, i) => i !== idx))}><Trash2 size={18} /></button>
              </div>

              <div className="grid-2col">
                <div className="input-group">
                  <label><Plus size={12} /> Level Title</label>
                  <input value={lvl.title} onChange={e => updateLvl(idx, 'title', e.target.value)} />
                </div>
                <div className="input-group">
                  <label><Coins size={12} /> Bomb Type / Shape</label>
                  <select value={lvl.type} onChange={e => updateLvl(idx, 'type', e.target.value)}>
                    <option value="cylinder">Cylinder (Blue)</option>
                    <option value="crate">Crate (Green)</option>
                    <option value="bundle">Bundle (Red)</option>
                    <option value="sphere">Orb / Sphere (Yellow)</option>
                    <option value="hexcase">Hex-Case (Purple)</option>
                    <option value="briefcase">Tactical Briefcase (Grey)</option>
                    <option value="reactor">Nuclear Reactor (Cyan)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label><Clock size={12} /> Timer (Seconds)</label>
                  <input type="number" value={lvl.timer} onChange={e => updateLvl(idx, 'timer', parseInt(e.target.value))} />
                </div>
                {lvl.hasKeypad && (
                  <div className="input-group">
                    <label><Zap size={12} /> Keypad Code</label>
                    <input type="text" value={lvl.keypadCode} onChange={e => updateLvl(idx, 'keypadCode', e.target.value)} placeholder="e.g., 1234" />
                  </div>
                )}
              </div>

              <div className="input-group full">
                <label><CheckCircle2 size={12} /> Instructions (Field Intelligence)</label>
                <textarea rows={3} value={lvl.clue} onChange={e => updateLvl(idx, 'clue', e.target.value)} placeholder="Enter tactical instructions for the defusal unit..." />
              </div>

              <div className="checkbox-row-premium">
                <label className="check-premium"><input type="checkbox" checked={lvl.hasKeypad} onChange={e => updateLvl(idx, 'hasKeypad', e.target.checked)} /> <span>Digital Keypad</span></label>
                <label className="check-premium"><input type="checkbox" checked={lvl.hasButtons} onChange={e => updateLvl(idx, 'hasButtons', e.target.checked)} /> <span>Contact Detonator</span></label>
                <label className="check-premium"><input type="checkbox" checked={lvl.hasExit} onChange={e => updateLvl(idx, 'hasExit', e.target.checked)} /> <span>Exit Mission</span></label>
              </div>

              {/* Component Managers */}
              <div className="manager-sections">
                <div className="manager-box">
                  <div className="flex-head"><strong>Switches</strong> <button className="add-btn" onClick={() => addSwitch(idx)}><Plus size={12} /> ADD</button></div>
                  {lvl.switches?.map((s, sIdx) => (
                    <div key={sIdx} className="item-row industrial">
                      <input className="small-in" value={s.label} onChange={e => {
                        const sw = [...lvl.switches]; sw[sIdx].label = e.target.value; updateLvl(idx, 'switches', sw);
                      }} />
                      <label className="toggle-label"><input type="checkbox" checked={s.isCorrect} onChange={e => {
                        const sw = [...lvl.switches]; sw[sIdx].isCorrect = e.target.checked; updateLvl(idx, 'switches', sw);
                      }} /> <span>Required ON</span></label>
                      <button onClick={() => removeSwitch(idx, sIdx)} className="btn-del"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>

                <div className="manager-box">
                  <div className="flex-head"><strong>Levers</strong> <button className="add-btn" onClick={() => addLever(idx)}><Plus size={12} /> ADD</button></div>
                  {lvl.levers?.map((l, lIdx) => (
                    <div key={lIdx} className="item-row industrial">
                      <input className="small-in" value={l.label} onChange={e => {
                        const lev = [...lvl.levers]; lev[lIdx].label = e.target.value; updateLvl(idx, 'levers', lev);
                      }} />
                      <label className="toggle-label"><input type="checkbox" checked={l.isCorrect} onChange={e => {
                        const lev = [...lvl.levers]; lev[lIdx].isCorrect = e.target.checked; updateLvl(idx, 'levers', lev);
                      }} /> <span>Required PULLED</span></label>
                      <button onClick={() => removeLever(idx, lIdx)} className="btn-del"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>

                <div className="manager-box">
                  <div className="flex-head"><strong>Dials / Knobs</strong> <button className="add-btn" onClick={() => addKnob(idx)}><Plus size={12} /> ADD</button></div>
                  {lvl.knobs?.map((k, kIdx) => (
                    <div key={kIdx} className="item-row industrial">
                      <input className="small-in" value={k.label} onChange={e => {
                        const knobs = [...lvl.knobs]; knobs[kIdx].label = e.target.value; updateLvl(idx, 'knobs', knobs);
                      }} />
                      <label className="toggle-label">Target:
                        <select value={k.isCorrect} onChange={e => {
                          const knobs = [...lvl.knobs]; knobs[kIdx].isCorrect = parseInt(e.target.value); updateLvl(idx, 'knobs', knobs);
                        }}>
                          {[0, 1, 2, 3].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </label>
                      <button onClick={() => removeKnob(idx, kIdx)} className="btn-del"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>

                <div className="manager-box">
                  <div className="flex-head"><strong>Security Keys</strong> <button className="add-btn" onClick={() => addKey(idx)}><Plus size={12} /> ADD</button></div>
                  {lvl.keys?.map((ky, kyIdx) => (
                    <div key={kyIdx} className="item-row industrial">
                      <input className="small-in" value={ky.label} onChange={e => {
                        const keys = [...lvl.keys]; keys[kyIdx].label = e.target.value; updateLvl(idx, 'keys', keys);
                      }} />
                      <label className="toggle-label"><input type="checkbox" checked={ky.isCorrect} onChange={e => {
                        const keys = [...lvl.keys]; keys[kyIdx].isCorrect = e.target.checked; updateLvl(idx, 'keys', keys);
                      }} /> <span>Required ON</span></label>
                      <button onClick={() => removeKey(idx, kyIdx)} className="btn-del"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>

                <div className="manager-box">
                  <div className="flex-head"><strong>Electronics (Chips/Batteries)</strong></div>
                  <div className="input-group">
                    <label>Batteries (Count)</label>
                    <input type="number" value={lvl.batteries || 0} onChange={e => updateLvl(idx, 'batteries', parseInt(e.target.value))} />
                  </div>
                  <div className="chip-manager">
                    <div className="flex-head"><strong>Microchips</strong> <button className="add-btn" onClick={() => addChip(idx)}><Plus size={12} /> ADD</button></div>
                    {lvl.chips?.map((c, cIdx) => (
                      <div key={cIdx} className="item-row industrial">
                        <input className="small-in" value={c.label} onChange={e => {
                          const chips = [...lvl.chips]; chips[cIdx].label = e.target.value; updateLvl(idx, 'chips', chips);
                        }} />
                        <label className="toggle-label"><input type="checkbox" checked={c.isCorrect} onChange={e => {
                          const chips = [...lvl.chips]; chips[cIdx].isCorrect = e.target.checked; updateLvl(idx, 'chips', chips);
                        }} /> <span>Status OK</span></label>
                        <button onClick={() => removeChip(idx, cIdx)} className="btn-del"><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="manager-box">
                  <div className="flex-head"><strong>Electrical Ports</strong></div>
                  <div className="checkbox-grid small">
                    {["DVI", "Serial", "Parallel", "RJ-45", "USB-C"].map(p => (
                      <label key={p} className="check-item min">
                        <input type="checkbox" checked={lvl.ports?.includes(p)} onChange={() => togglePort(idx, p)} />
                        <span>{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="manager-box">
                  <div className="flex-head"><strong>Tactical Resistors</strong> <button className="add-btn" onClick={() => addResistor(idx)}><Plus size={12} /> ADD</button></div>
                  <div className="resistor-grid-admin">
                    {lvl.resistors?.map((r, rIdx) => (
                      <div key={rIdx} className="item-row industrial">
                        <input type="color" value={r.color} onChange={e => {
                          const rx = [...lvl.resistors]; rx[rIdx].color = e.target.value; updateLvl(idx, 'resistors', rx);
                        }} />
                        <button onClick={() => removeResistor(idx, rIdx)} className="btn-del"><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="manager-box">
                  <div className="flex-head"><strong>Interactive LEDs</strong> <button className="add-btn" onClick={() => addLed(idx)}><Plus size={12} /> ADD</button></div>
                  {lvl.leds?.map((l, lIdx) => (
                    <div key={lIdx} className="item-row industrial">
                      <input className="small-in" value={l.label} onChange={e => {
                        const lx = [...lvl.leds]; lx[lIdx].label = e.target.value; updateLvl(idx, 'leds', lx);
                      }} style={{ width: '60px' }} />
                      <input type="color" value={l.color} onChange={e => {
                        const lx = [...lvl.leds]; lx[lIdx].color = e.target.value; updateLvl(idx, 'leds', lx);
                      }} style={{ width: '40px' }} />
                      <select value={l.linkedSwitch} onChange={e => {
                        const lx = [...lvl.leds]; lx[lIdx].linkedSwitch = e.target.value; updateLvl(idx, 'leds', lx);
                      }} style={{ flex: 1, fontSize: '0.6rem' }}>
                        <option value="">No Link</option>
                        {lvl.switches?.map(sw => <option key={sw.id} value={sw.id}>S: {sw.label}</option>)}
                      </select>
                      <button onClick={() => removeLed(idx, lIdx)} className="btn-del"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="wire-list">
                <div className="flex-head"><strong>Wires</strong> <button className="add-btn" onClick={() => addWire(idx)}><Plus size={12} /> ADD</button></div>
                {lvl.wires.map((w, wIdx) => (
                  <div key={wIdx} className="item-row wire-edit-row">
                    <input type="color" value={w.color} onChange={e => {
                      const wires = [...lvl.wires]; wires[wIdx].color = e.target.value; updateLvl(idx, 'wires', wires);
                    }} />
                    <label className="radio-label">
                      <input type="radio" name={`correct-${idx}`} checked={w.isCorrect} onChange={() => {
                        const wires = lvl.wires.map((wire, j) => ({ ...wire, isCorrect: j === wIdx })); updateLvl(idx, 'wires', wires);
                      }} /> <span>TARGET</span>
                    </label>
                    <button onClick={() => removeWire(idx, wIdx)} className="btn-del"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Saved Broadcasts Section */}
          {Object.keys(rooms).length > 0 && (
            <div className="saved-broadcasts-panel">
              <div className="lvl-config-header">
                <ShieldAlert size={20} className="lvl-icon" />
                <h3>SAVED BROADCASTS</h3>
              </div>
              <div className="broadcasts-grid">
                {Object.entries(rooms).map(([code, roomConfig]) => (
                  <div key={code} className="broadcast-card">
                    <div className="broadcast-header">
                      <span className="broadcast-code">{code}</span>
                      <button 
                        className="btn-del" 
                        onClick={() => {
                          const newRooms = { ...rooms };
                          delete newRooms[code];
                          setRooms(newRooms);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="broadcast-info">
                      <p><strong>Levels:</strong> {roomConfig.length}</p>
                      {roomConfig[0] && <p><strong>First:</strong> {roomConfig[0].title}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`app-wrapper ${currentLevel.type}`}>
      {/* Game HUD */}
      <nav className="game-nav">
        <div className="nav-left">
          <div className="wallet-display"><Coins size={20} /> ${wallet}</div>
        </div>
        <div className="nav-center">
          <div className="progress-track">
            {config.map((_, i) => (
              <div key={i} className={`track-step ${i <= currentLevelIdx ? 'active' : ''} ${i < currentLevelIdx ? 'complete' : ''}`}>
                {i < currentLevelIdx ? <CheckCircle2 size={14} /> : i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="nav-right">
          {gameState !== 'playing' && (
            <button className="btn-admin" onClick={() => setIsAdmin(true)}><Settings size={20} /></button>
          )}
        </div>
      </nav>

      <main className="game-viewport">
        {gameState === 'failed' && <div className="glitch-overlay"></div>}
        {gameState === 'success' && <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} className="success-flash" style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 2000, pointerEvents: 'none' }}></motion.div>}


        {/* Statistics & Clues */}
        <div className="side-stats">
          <div className={`timer-box-3d ${isPenaltyActive ? 'penalty' : ''}`}>
            <div className="timer-label">COUNTDOWN</div>
            <div className="timer-val digital">00:{timeLeft.toString().padStart(2, '0')}</div>
          </div>
          <div className="instruction-box">
            <div className="box-label">INSTRUCTIONS</div>
            <p>{currentLevel.clue}</p>
          </div>
        </div>

        <div className="bomb-area">
          <AnimatePresence mode="wait">
            {gameState === 'menu' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="menu" className="modal-fs joining luxury-menu">
                <div className="join-card hologram-flicker">
                  <div className="scan-line"></div>
                  <ShieldAlert size={60} className="menu-icon-small" />
                  <h2>MISSION CONNECTION</h2>
                  <div className="code-input-display" style={{ fontSize: '4rem', letterSpacing: '0.5rem' }}>{joinCodeInput.padEnd(6, '-')}</div>
                  <div className="keypad-grid join-pad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                      <button key={n} style={n === 0 ? { gridColumn: 2 } : {}} onClick={() => setJoinCodeInput(p => (p + n).slice(0, 6))}>{n}</button>
                    ))}
                    <div className="pad-footer" style={{ display: 'contents' }}>
                      <button className="keypad-clr" style={{ gridColumn: 'span 3' }} onClick={() => setJoinCodeInput("")}>CLEAR TERMINAL</button>
                    </div>
                  </div>
                  <button className="proceed-btn" onClick={handleJoinRoom} disabled={joinCodeInput.length < 6}>AUTHENTICATE MISSION</button>
                </div>

                {/* Admin Access in Bottom Right */}
                <button className="admin-shortcut-btn" onClick={handleCreateRoom}>
                  <Settings size={18} /> <span>Admin Console</span>
                </button>
              </motion.div>
            ) : gameState === 'intro' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="intro" className="modal-fs dark">
                <h1>DEFUSE THE BOMB 3D</h1>
                <p>Follow the instructions carefully. One wrong move and everything goes BOOM.</p>
                <button className="start-btn-3d" onClick={() => setGameState('ready')}>ENTER WORKSHOP</button>
              </motion.div>
            ) : gameState === 'ready' ? (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key="ready"
                className="modal-fs"
              >
                <div className="brief-card industrial">
                  <div className="card-header">
                    <ShieldAlert size={24} color="var(--orange-primary)" />
                    <h3>MISSION BRIEFING</h3>
                  </div>
                  <div className="card-body">
                    <h2 className="mission-title">{currentLevel?.title}</h2>
                    <div className="clue-display">
                      <Zap size={16} className="clue-icon" />
                      <p>{currentLevel?.clue}</p>
                    </div>
                  </div>
                  <button className="engage-btn-premium" onClick={startLevel}>
                    <span>INTIATE DEFUSAL</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            ) : (gameState === 'failed' || gameState === 'success' || gameState === 'victory') && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
                key="result"
                className={`modal-fs result-premium ${gameState}`}
              >
                <div className="result-card">
                  {gameState === 'failed' ? (
                    <>
                      <div className="res-icon error"><AlertTriangle size={60} /></div>
                      <h2>SYSTEM CRITICAL</h2>
                      <div className="status-bar error">DETONATION CONFIRMED</div>
                      <p className="res-msg">Mission failure. Tactical unit lost in action.</p>
                      <button className="retry-btn-p" onClick={() => setGameState('ready')}>RE-START SEQUENCE</button>
                    </>
                  ) : gameState === 'victory' ? (
                    <>
                      <div className="res-icon victory"><CheckCircle2 size={60} /></div>
                      <h2>EXPERT NEUTRALIZER</h2>
                      <div className="status-bar victory">ALL THREATS CLEARED</div>
                      <p className="res-msg">Workshop secured. Final Reward: <span className="gold-text">${wallet}</span></p>
                      <button className="retry-btn-p success" onClick={() => { setCurrentLevelIdx(0); setGameState('menu'); }}>RETURN TO COMMAND</button>
                    </>
                  ) : (
                    <>
                      <div className="res-icon success"><CheckCircle2 size={60} /></div>
                      <h2>STABILIZED</h2>
                      <div className="status-bar success">MODULE DISARMED</div>
                      <p className="res-msg">Reward logged: <span className="gold-text">+$100</span></p>
                      <button className="next-btn-p" onClick={nextLevel}>NEXT OBJECTIVE</button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* THE BOMB */}
          <div className={`bomb-container ${currentLevel.type} ${isPenaltyActive ? 'shake' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLevelIdx}
                initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: -90, opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                className="bomb-body"
              >
                {/* Visual modules based on config */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.05 } },
                    hidden: {}
                  }}
                  style={{ display: 'contents' }}
                >
                  {/* Tactical Decorations */}
                  <div className="screw top-left"></div>
                  <div className="screw top-right"></div>
                  <div className="screw bottom-left"></div>
                  <div className="screw bottom-right"></div>
                  <div className="danger-decal">VOLTAGE_CRITICAL</div>
                  <div className="serial-tag">SERIAL_NO: 09-X</div>

                  {/* 1. Toggle Switches (A, B, C style) */}
                  <div className="module-switches">
                    {currentLevel.switches?.map(s => (
                      <motion.div
                        key={s.id}
                        variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                        className="industrial-switch"
                      >
                        <button
                          className={`toggle-btn-3d ${activeSwitches[s.id] ? 'on' : 'off'}`}
                          onClick={() => setActiveSwitches(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                        >
                          <div className="switch-top"></div>
                          <div className="switch-label">{s.label}</div>
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* 2. Levers */}
                  <div className="module-levers">
                    {currentLevel.levers?.map(l => (
                      <motion.div
                        key={l.id}
                        variants={{ hidden: { scale: 0.5, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                        className="lever-housing"
                      >
                        <div className={`lever-stick ${activeLevers[l.id] ? 'pulled' : ''}`} onClick={() => setActiveLevers(prev => ({ ...prev, [l.id]: !prev[l.id] }))}>
                          <div className="lever-knob"></div>
                        </div>
                        <span className="lever-label">{l.label}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* 2.5 Rotary Knobs & Keys */}
                  <div className="extra-modules">
                    {currentLevel.knobs?.map(k => (
                      <motion.div
                        key={k.id}
                        variants={{ hidden: { rotate: -45, opacity: 0 }, visible: { rotate: 0, opacity: 1 } }}
                        className="knob-module"
                      >
                        <div className="knob-surface"
                          style={{ transform: `rotate(${(knobPositions[k.id] || 0) * 90}deg)` }}
                          onClick={() => setKnobPositions(p => ({ ...p, [k.id]: ((p[k.id] || 0) + 1) % 4 }))}
                        >
                          <div className="knob-indicator"></div>
                        </div>
                        <label className="knob-label">{k.label}</label>
                      </motion.div>
                    ))}
                    {currentLevel.keys?.map(ky => (
                      <motion.div
                        key={ky.id}
                        variants={{ hidden: { x: -20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}
                        className="key-module"
                      >
                        <div className={`key-lock ${keyStates[ky.id] ? 'unlocked' : ''}`} onClick={() => setKeyStates(p => ({ ...p, [ky.id]: !p[ky.id] }))}>
                          <div className="key-slot"></div>
                          <div className="key-head"></div>
                        </div>
                        <label className="knob-label">{ky.label}</label>
                      </motion.div>
                    ))}
                  </div>

                  {/* 2.8 Electrical Extras (Batteries, Ports, Chips) */}
                  <div className="electrical-extras">
                    <div className="battery-pack">
                      {Array.from({ length: currentLevel.batteries || 0 }).map((_, bi) => (
                        <motion.div
                          key={bi}
                          variants={{ hidden: { scale: 0, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                          className="battery-cell"
                        >
                          <div className="battery-tip"></div>
                          <div className="battery-body"></div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="port-plate">
                      {currentLevel.ports?.map(p => (
                        <motion.div
                          key={p}
                          variants={{ hidden: { filter: 'blur(5px)', opacity: 0 }, visible: { filter: 'blur(0px)', opacity: 1 } }}
                          className="port-item"
                        >
                          <div className={`port-shape ${p.toLowerCase()}`}></div>
                          <span className="port-tag">{p}</span>
                        </motion.div>
                      ))}
                    </div>
                    <div className="chip-array">
                      {currentLevel.chips?.map(c => (
                        <motion.div
                          key={c.id}
                          variants={{ hidden: { y: -10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                          className="microchip-visual"
                        >
                          <div className="chip-body">
                            <div className="chip-notch"></div>
                            <span className="chip-id">{c.label}</span>
                          </div>
                          <div className="chip-pins left"></div>
                          <div className="chip-pins right"></div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* 2.9 Tactical Components (Resistors & Status LEDs) */}
                  <div className="tactical-components">
                    <div className="resistor-bank">
                      {currentLevel.resistors?.map(r => (
                        <motion.div
                          key={r.id}
                          variants={{ hidden: { scale: 0 }, visible: { scale: 1 } }}
                          className="resistor-visual"
                          style={{ '--r-color': r.color }}
                        >
                          <div className="res-cap-l"></div>
                          <div className="res-body">
                            <div className="res-stripe"></div>
                          </div>
                          <div className="res-cap-r"></div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="led-indicators">
                      {currentLevel.leds?.map(l => (
                        <motion.div
                          key={l.id}
                          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                          className="led-node"
                        >
                          <div
                            className={`led-bulb ${l.linkedSwitch && activeSwitches[l.linkedSwitch] ? 'on' : 'off'}`}
                            style={{ '--led-color': l.color }}
                          ></div>
                          <span className="led-tag">{l.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Wires */}
                  <div className="module-wires">
                    {currentLevel.wires.map(w => (
                      <motion.div
                        key={w.id}
                        variants={{ hidden: { width: 0, opacity: 0 }, visible: { width: '100%', opacity: 1 } }}
                        className={`wire-path ${cutWires.includes(w.id) ? 'cut' : ''}`}
                        style={{ '--w-color': w.color }}
                        onClick={() => handleWireCut(w.id, w.isCorrect)}
                      >
                        <div className="cap left"></div>
                        <div className="wire-line"></div>
                        <div className="cap right"></div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* 4. Keypad */}
                {currentLevel.hasKeypad && (
                  <div className="module-keypad">
                    <div className="keypad-screen">{enteredCode.padEnd(4, '_')}</div>
                    <div className="keypad-grid">
                      {[1, 2, 3, 4].map(n => (
                        <button key={n} onClick={() => setEnteredCode(p => (p + n).slice(-4))}>{n}</button>
                      ))}
                    </div>
                    <button className="keypad-clr" onClick={() => setEnteredCode("")}>CLR</button>
                  </div>
                )}

                {/* 5. Big Button / Exit Button */}
                {currentLevel.hasButtons && !currentLevel.hasExit && currentLevel.buttons && currentLevel.buttons.length > 0 && (
                  <div className="module-big-button">
                    {currentLevel.buttons.map(btn => (
                      <button
                        key={btn.id}
                        className={`button-3d ${buttonPressed[btn.id] ? 'pressed' : ''}`}
                        style={{ '--btn-color': btn.color }}
                        onClick={() => {
                          if (gameState !== 'playing' || buttonPressed[btn.id]) return;
                          
                          const reqSwitches = currentLevel.switches || [];
                          const switchErr = reqSwitches.some(s => (s.isCorrect && !activeSwitches[s.id]) || (!s.isCorrect && activeSwitches[s.id]));
                          const reqLevers = currentLevel.levers || [];
                          const leverErr = reqLevers.some(l => (l.isCorrect && !activeLevers[l.id]) || (!l.isCorrect && activeLevers[l.id]));
                          
                          if (switchErr || leverErr) {
                            setFeedback('ERROR: Verify switch/lever positions');
                            setIsPenaltyActive(true);
                            setTimeout(() => setIsPenaltyActive(false), 500);
                            return;
                          }
                          
                          if (!btn.isCorrect) {
                            setFeedback('ERROR: Wrong button target');
                            setIsPenaltyActive(true);
                            setTimeout(() => setIsPenaltyActive(false), 500);
                            return;
                          }
                          
                          setButtonPressed(prev => ({ ...prev, [btn.id]: true }));
                          setFeedback('✓ Button pressed - module disarmed');
                          checkVictory();
                        }}
                      >
                        <div className="button-surface"></div>
                      </button>
                    ))}
                    <label>PRESS TARGET</label>
                  </div>
                )}

                {/* Exit Mission Button */}
                {currentLevel.hasExit && (
                  <div className="module-exit-button">
                    <motion.button
                      className={`exit-button-3d ${exitActivated ? 'activated' : ''}`}
                      onClick={handleExit}
                      whileHover={{ scale: exitActivated ? 1 : 1.05 }}
                      whileTap={{ scale: exitActivated ? 1 : 0.95 }}
                      disabled={exitActivated}
                    >
                      <div className="exit-surface"></div>
                      <span className="exit-label">EXIT</span>
                    </motion.button>
                  </div>
                )}

                {/* Feedback LED */}
                <div className={`status-led ${isPenaltyActive ? 'error' : 'ok'}`}></div>

                {/* Feedback Msg */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className={`toast ${isPenaltyActive ? 'warn' : 'info'}`}>
                      {feedback}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Tactical HUD Column */}
        <div className="tactical-hud-col">
          {(gameState === 'ready' || gameState === 'playing' || gameState === 'penalty') && (
            <div className="holographic-overlay relative-hud">
              <div className="hud-header">TACTICAL_READOUT</div>
              <div className="line">SYSTEM_STATUS: ONLINE</div>
              <div className="line">CORE_TEMP: 32.4°C</div>
              <div className="line">SIGNAL_STRENGTH: 98%</div>
              <div className="line">ENCRYPTION: AES-256</div>
              <div className="line">DETECTION: MINIMAL</div>
              <div className="line">TIME_REMAINING: {timeLeft}s</div>
              <div className="line">{">>>"} ANALYSIS RUNNING...</div>
              <div className="line" style={{ marginTop: '20px', color: 'var(--green-primary)' }}>DECRYPTION_PROGRESS: [||||||....]</div>
            </div>
          )}
        </div>
      </main>
    </div >
  );
}

export default App;
