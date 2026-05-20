import * as Tone from 'tone';

let isInitialized = false;

// Binaural beats oscillators
let oscLeft, oscRight;
// Generative synth
let polySynth, reverb, autoFilter;
// Pattern sequencer
let pattern;
// Global master output gain node (for click-free session fades)
let mainOut;
// Timeout reference to manage stopping transistions and avoid race conditions
let stopTimeout = null;

export let waveformAnalyser;
export let meter;

export const getAudioIntensity = () => {
  if (!meter) return 0;
  const db = meter.getValue();
  // normalize roughly from -60db to 0db into 0 to 1
  return Math.max(0, Math.min(1, (db + 60) / 60));
};

export const initAudio = async () => {
  if (isInitialized) return;
  
  // Create a new Tone.Context with 'playback' latency hint and assign it globally.
  // This completely eliminates audio glitches/crackles caused by CPU/WebGL spikes on the main thread.
  const context = new Tone.Context({
    latencyHint: "playback"
  });
  Tone.setContext(context);
  
  // Set lookAhead on the new context
  Tone.context.lookAhead = 0.15; // 150ms scheduling buffer
  
  await Tone.start();

  waveformAnalyser = new Tone.Analyser("waveform", 256);
  meter = new Tone.Meter();
  
  // 1. Professional Master Compressor (Replaces the aggressive hard Limiter).
  // With a threshold of -12dB and slow attack/release times (30ms/250ms),
  // it manages volume peaks smoothly over time rather than cycle-by-cycle,
  // completely preventing intermodulation distortion on low-frequency sine waves.
  const masterCompressor = new Tone.Compressor({
    threshold: -12,
    ratio: 4,
    attack: 0.03,
    release: 0.25
  }).toDestination();
  
  // 2. Global mainOut node with initial gain set to 0.
  // This allows us to fade the entire application in and out seamlessly on session start/stop.
  mainOut = new Tone.Gain(0).connect(masterCompressor);
  
  mainOut.connect(waveformAnalyser);
  mainOut.connect(meter);
  
  // 3. Binaural Beats setup
  const baseFreq = 200;
  const binauralOffset = 14; 
  
  oscLeft = new Tone.Oscillator(baseFreq, "sine");
  oscRight = new Tone.Oscillator(baseFreq + binauralOffset, "sine");
  
  // Hard panning for binaural effect
  const panLeft = new Tone.Panner(-1).connect(mainOut);
  const panRight = new Tone.Panner(1).connect(mainOut);
  
  oscLeft.disconnect();
  oscLeft.connect(panLeft);
  
  oscRight.disconnect();
  oscRight.connect(panRight);
  
  // Initialize oscillators at safe silent -100 dB and start them immediately.
  // Keeping oscillators running continuously avoids node start/stop clicks.
  oscLeft.volume.value = -100;
  oscRight.volume.value = -100;
  oscLeft.start();
  oscRight.start();
  
  // 4. Generative Ambient Synth with lush effects chain
  const delay = new Tone.FeedbackDelay("8n.", 0.3).connect(mainOut);
  
  // algorithmic Freeverb (100% CPU safe)
  reverb = new Tone.Freeverb({
    roomSize: 0.9, 
    dampening: 2000,
    wet: 0.6
  }).connect(delay);
  
  autoFilter = new Tone.AutoFilter({
    frequency: 0.05, // 20 second breathing cycle
    baseFrequency: 200,
    octaves: 4, // wider sweep
    type: "sine"
  }).connect(reverb);
  autoFilter.start();
  
  // Synthesizer with increased polyphony to completely prevent voice-stealing clicks
  polySynth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 12, // Increased from 4 to 12 to handle overlapping decays gracefully
    oscillator: { type: "sine" },
    envelope: {
      attack: 4, 
      decay: 2,
      sustain: 1,
      release: 4 
    }
  }).connect(autoFilter);
  
  // Lowered from -24 to -28 dB to provide generous digital headroom
  polySynth.volume.value = -28; 

  // Initial calm scale
  const notes = ["C4", "E4", "G4", "B4"];
  
  pattern = new Tone.Pattern((time, note) => {
    // Trigger a long swelling note, lower velocity to be safe
    polySynth.triggerAttackRelease(note, "2m", time, Math.random() * 0.3 + 0.1);
  }, notes, "randomWalk");
  
  pattern.interval = "2m";

  isInitialized = true;
};

export const startSession = () => {
  if (!isInitialized) return;
  
  // Clear any active stop timeouts to prevent starting and stopping race conditions
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }
  
  Tone.Transport.start();
  
  // Fade in oscillators smoothly from silent -100 dB to optimal -25 dB (lower volume = better headroom)
  oscLeft.volume.rampTo(-25, 2);
  oscRight.volume.rampTo(-25, 2);
  
  // Fade in the master mainOut gain smoothly from 0 to 0.4 over 1.5 seconds
  mainOut.gain.rampTo(0.4, 1.5);
  
  pattern.start(0);
};

export const stopSession = () => {
  if (!isInitialized) return;
  
  if (stopTimeout) {
    clearTimeout(stopTimeout);
  }
  
  // Fade out the master mainOut gain smoothly to 0 over 0.8 seconds to avoid any stop pop/click
  mainOut.gain.rampTo(0, 0.8);
  
  // Gracefully release all active synth voices
  polySynth.releaseAll();
  
  // Stop the pattern sequencer immediately
  pattern.stop();
  
  // Fade down the oscillators to -100 dB
  oscLeft.volume.rampTo(-100, 0.8);
  oscRight.volume.rampTo(-100, 0.8);
  
  // Wait for the 800ms master fade out to complete before stopping the transport
  stopTimeout = setTimeout(() => {
    Tone.Transport.stop();
    stopTimeout = null;
  }, 800);
};

export const setMode = (mode) => {
    // mode can be "focus", "break", or "meditate"
    if (!isInitialized) return;

    if (mode === "focus") {
        // 200Hz base + 14Hz Beta waves for focus
        const baseFreq = 200;
        oscLeft.frequency.rampTo(baseFreq, 2);
        oscRight.frequency.rampTo(baseFreq + 14, 2);
        autoFilter.frequency.rampTo(0.05, 2);
        pattern.interval = "2m"; // Very slow, prevents voice-stealing crackles
        pattern.values = ["C4", "E4", "G4", "B4"]; // C Major 7 (Calm, driving)
    } else if (mode === "break") {
        // 200Hz base + 8Hz Alpha waves for relaxation
        const baseFreq = 200;
        oscLeft.frequency.rampTo(baseFreq, 2);
        oscRight.frequency.rampTo(baseFreq + 8, 2);
        autoFilter.frequency.rampTo(0.1, 2);
        pattern.interval = "2m";
        pattern.values = ["F3", "A3", "C4", "E4"]; // F Major 7 (Floating, relaxed)
    } else if (mode === "meditate") {
        // 852Hz Solfeggio (Third Eye) + 4Hz Theta waves for deep meditation
        const baseFreq = 852;
        oscLeft.frequency.rampTo(baseFreq, 4);
        oscRight.frequency.rampTo(baseFreq + 4, 4);
        autoFilter.frequency.rampTo(0.02, 4);
        pattern.interval = "2m";
        pattern.values = ["D3", "F3", "A3", "C4", "E4"]; // D minor 9 (Deep, introspective)
    } else if (mode === "detox") {
        // 396Hz Solfeggio (Grounding/Anti-anxiety) + 2Hz Delta waves
        const baseFreq = 396;
        oscLeft.frequency.rampTo(baseFreq, 3);
        oscRight.frequency.rampTo(baseFreq + 2, 3);
        autoFilter.frequency.rampTo(0.03, 3);
        pattern.interval = "2m";
        pattern.values = ["G2", "C3", "G3", "C4"]; // Deep C drone (Grounding)
    } else if (mode === "awaken") {
        // 963Hz Solfeggio (Pineal Gland/Awakening) + 40Hz Gamma waves
        const baseFreq = 963;
        oscLeft.frequency.rampTo(baseFreq, 3);
        oscRight.frequency.rampTo(baseFreq + 40, 3);
        autoFilter.frequency.rampTo(0.2, 3);
        pattern.interval = "1m"; // Slower to prevent polyphony cutoff
        pattern.values = ["E4", "G#4", "B4", "D#5"]; // E Major 7 (Bright, uplifting)
    }
}
