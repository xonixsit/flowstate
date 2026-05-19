import * as Tone from 'tone';

let isInitialized = false;

// Binaural beats oscillators
let oscLeft, oscRight;
// Generative synth
let polySynth, reverb, autoFilter;
// Pattern sequencer
let pattern;

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
  
  await Tone.start();

  waveformAnalyser = new Tone.Analyser("waveform", 256);
  meter = new Tone.Meter();
  
  // Master Limiter to prevent clipping and popping
  const limiter = new Tone.Limiter(-2).toDestination();
  // Drastically reduce main gain to ensure we don't smash the limiter (which causes distortion)
  const mainOut = new Tone.Gain(0.4).connect(limiter);
  
  mainOut.connect(waveformAnalyser);
  mainOut.connect(meter);
  
  // 1. Binaural Beats setup
  // Base frequency (e.g., 200Hz) + offset (e.g., 14Hz Beta waves for focus)
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
  
  // Set initial volumes to silence to prevent startup clicks
  oscLeft.volume.value = -Infinity;
  oscRight.volume.value = -Infinity;
  
  // 2. Generative Ambient Synth with lush effects chain
  const delay = new Tone.FeedbackDelay("8n.", 0.3).connect(mainOut);
  
  // Using Freeverb which is an algorithmic reverb (100% CPU safe, completely eliminates crackling)
  reverb = new Tone.Freeverb({
    roomSize: 0.9, 
    dampening: 2000,
    wet: 0.6
  }).connect(delay);
  
  // Removed Chorus to further reduce any risk of buffer under-runs
  autoFilter = new Tone.AutoFilter({
    frequency: 0.05, // 20 second breathing cycle
    baseFrequency: 200,
    octaves: 4, // wider sweep
    type: "sine"
  }).connect(reverb);
  autoFilter.start();
  
  polySynth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 4, 
    oscillator: { type: "sine" },
    envelope: {
      attack: 4, 
      decay: 2,
      sustain: 1,
      release: 4 
    }
  }).connect(autoFilter);
  
  polySynth.volume.value = -24; // Very low to sit in background cleanly

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
  Tone.Transport.start();
  
  if (oscLeft.state !== "started") oscLeft.start();
  if (oscRight.state !== "started") oscRight.start();
  
  // Fade in smoothly
  oscLeft.volume.rampTo(-15, 2);
  oscRight.volume.rampTo(-15, 2);
  
  pattern.start(0);
};

export const stopSession = () => {
  if (!isInitialized) return;
  Tone.Transport.stop();
  pattern.stop();
  
  // Fade out to avoid clicks
  oscLeft.volume.rampTo(-Infinity, 1);
  oscRight.volume.rampTo(-Infinity, 1);
  
  setTimeout(() => {
    if (oscLeft.state === "started") oscLeft.stop();
    if (oscRight.state === "started") oscRight.stop();
  }, 1000);
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
