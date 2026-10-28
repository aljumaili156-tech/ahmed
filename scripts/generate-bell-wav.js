import fs from 'fs';
import path from 'path';

function createWavHeader(numSamples, sampleRate) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + numSamples * 2, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // PCM
  header.writeUInt16LE(1, 22);  // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);  // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(numSamples * 2, 40);
  return header;
}

// 1. Beautiful, Loud Modern School Chime (Westminster Quarters with Rich Bronze Resonance)
function generateMelodicSchoolBell() {
  const sampleRate = 22050;
  const durationSeconds = 7.5;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = Buffer.alloc(numSamples * 2);

  // Westminster 4-phrase melody familiar in modern schools
  // Phrase 1: G#4, F#4, E4, B3  | Phrase 2: E4, F#4, G#4, E4
  const notes = [
    { freq: 415.3, start: 0.1,  decay: 1.8, vol: 0.95 }, // G#4
    { freq: 369.9, start: 0.85, decay: 1.8, vol: 0.95 }, // F#4
    { freq: 329.6, start: 1.6,  decay: 1.8, vol: 0.95 }, // E4
    { freq: 246.9, start: 2.35, decay: 2.5, vol: 1.0 },  // B3 (deep gong)
    // Part 2
    { freq: 329.6, start: 3.5,  decay: 1.8, vol: 0.95 }, // E4
    { freq: 369.9, start: 4.25, decay: 1.8, vol: 0.95 }, // F#4
    { freq: 415.3, start: 5.0,  decay: 1.8, vol: 1.0 },  // G#4
    { freq: 329.6, start: 5.75, decay: 3.2, vol: 1.0 },  // E4 (final long chime)
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const note of notes) {
      if (t >= note.start) {
        const dt = t - note.start;
        const env = Math.exp(-dt * note.decay);
        if (env > 0.001) {
          // Acoustic bronze bell harmonic partials: fundamental + hum tone + tierce + quint + nominal
          const h1 = Math.sin(2 * Math.PI * note.freq * dt);
          const h2 = 0.55 * Math.sin(2 * Math.PI * (note.freq * 2.0) * dt);
          const h3 = 0.35 * Math.sin(2 * Math.PI * (note.freq * 2.76) * dt);
          const h4 = 0.25 * Math.sin(2 * Math.PI * (note.freq * 3.98) * dt);
          const h5 = 0.15 * Math.sin(2 * Math.PI * (note.freq * 5.4) * dt);
          // Crisp clapper strike transient in first 10ms
          const strike = dt < 0.015 ? Math.sin(2 * Math.PI * 1800 * dt) * (1 - dt / 0.015) * 0.4 : 0;

          sample += (h1 + h2 + h3 + h4 + h5 + strike) * env * note.vol * 0.42;
        }
      }
    }

    // Gentle soft-clipping for maximum loudness without distortion
    const clamped = Math.max(-0.95, Math.min(0.95, sample));
    const intSample = Math.floor(clamped * 32767);
    buffer.writeInt16LE(intSample, i * 2);
  }

  const header = createWavHeader(numSamples, sampleRate);
  fs.writeFileSync(path.resolve('public/melodic_bell.wav'), Buffer.concat([header, buffer]));
  console.log('Generated beautiful public/melodic_bell.wav');
}

// 2. High-Clarity Classic School Bell (Loud Brass Chime Strikes)
function generateElectricSchoolBell() {
  const sampleRate = 22050;
  const durationSeconds = 6.5;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = Buffer.alloc(numSamples * 2);

  // 3 distinct energetic school bell ring bursts ("ترررن ... ترررن ... ترررن")
  const bursts = [
    { start: 0.1, duration: 1.6 },
    { start: 2.1, duration: 1.6 },
    { start: 4.1, duration: 2.0 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const b of bursts) {
      if (t >= b.start && t < b.start + b.duration) {
        const bt = t - b.start;
        // Rapid clapper strike 12 Hz inside each burst
        const strikeIndex = Math.floor(bt * 12);
        const timeInStrike = bt % (1 / 12);
        const strikeEnv = Math.exp(-timeInStrike * 28);

        const h1 = Math.sin(2 * Math.PI * 880 * t);
        const h2 = 0.6 * Math.sin(2 * Math.PI * 1320 * t);
        const h3 = 0.4 * Math.sin(2 * Math.PI * 1760 * t);
        const h4 = 0.25 * Math.sin(2 * Math.PI * 2640 * t);
        const click = timeInStrike < 0.005 ? (Math.random() * 2 - 1) * 0.35 : 0;

        sample += (h1 + h2 + h3 + h4 + click) * strikeEnv * 0.75;
      }
    }

    const clamped = Math.max(-0.95, Math.min(0.95, sample));
    const intSample = Math.floor(clamped * 32767);
    buffer.writeInt16LE(intSample, i * 2);
  }

  const header = createWavHeader(numSamples, sampleRate);
  fs.writeFileSync(path.resolve('public/school_bell.wav'), Buffer.concat([header, buffer]));
  console.log('Generated loud public/school_bell.wav');
}

// 3. Ultra-short 0.5s silent audio loop for mobile background keep-alive
function generateSilentKeepAlive() {
  const sampleRate = 8000;
  const numSamples = sampleRate * 1; // 1 second silent track
  const buffer = Buffer.alloc(numSamples * 2); // all zeroes = complete silence
  const header = createWavHeader(numSamples, sampleRate);
  fs.writeFileSync(path.resolve('public/silence.wav'), Buffer.concat([header, buffer]));
  console.log('Generated public/silence.wav for background keep-alive');
}

generateMelodicSchoolBell();
generateElectricSchoolBell();
generateSilentKeepAlive();
