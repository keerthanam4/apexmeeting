/**
 * ApexMeeting Audio Processing Engine
 * Web Audio API analyser, real-time VAD (Voice Activity Detection),
 * Canvas oscilloscope/spectrum visualizer, and simulated/live playback engine
 */

const ApexAudioProcessor = (() => {
  let audioCtx = null;
  let micStream = null;
  let micSourceNode = null;
  let analyserNode = null;
  let vadThreshold = 0.025; // Default energy threshold for VAD
  let isRecording = false;
  let isVadActive = false;
  let animFrameId = null;
  let listeners = {
    vadState: [],
    level: [],
    transcriptChunk: []
  };

  // Playback state for meeting audio
  let playbackAudio = null;
  let isPlaying = false;
  let playbackCurrentTime = 0;
  let playbackDuration = 465;
  let playbackRate = 1.0;
  let playbackInterval = null;
  let speechSynthUtterance = null;

  // Initialize Web Audio API
  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Start Live Microphone Ingestion with VAD
  async function startMicrophone(canvasWaveform, canvasSpectrum) {
    try {
      initAudioContext();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser environment.');
      }

      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micSourceNode = audioCtx.createMediaStreamSource(micStream);
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 1024;
      analyserNode.smoothingTimeConstant = 0.8;
      micSourceNode.connect(analyserNode);

      isRecording = true;
      startVisualizerLoop(canvasWaveform, canvasSpectrum);
      startSpeechRecognition();

      return { success: true };
    } catch (err) {
      console.warn('Microphone permission blocked or unavailable:', err);
      // Fallback to simulated live streaming so the user can test the UI anywhere!
      isRecording = true;
      startSimulatedAudioLoop(canvasWaveform, canvasSpectrum);
      return { success: false, fallback: true, message: err.message };
    }
  }

  // Stop Microphone Ingestion
  function stopMicrophone() {
    isRecording = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }
    if (micSourceNode) {
      micSourceNode.disconnect();
      micSourceNode = null;
    }
    stopSpeechRecognition();
    notifyVad(false, 0);
  }

  // Set VAD sensitivity threshold
  function setVadSensitivity(val) {
    // val: 0.01 (high sensitivity) to 0.08 (low sensitivity)
    vadThreshold = Math.max(0.005, Math.min(0.1, val));
  }

  function getVadSensitivity() {
    return vadThreshold;
  }

  // Visualizer loop for real mic stream
  function startVisualizerLoop(canvasWave, canvasSpec) {
    if (!analyserNode) return;
    const timeData = new Uint8Array(analyserNode.fftSize);
    const freqData = new Uint8Array(analyserNode.frequencyBinCount);

    function draw() {
      if (!isRecording) return;
      animFrameId = requestAnimationFrame(draw);

      analyserNode.getByteTimeDomainData(timeData);
      analyserNode.getByteFrequencyData(freqData);

      // Compute RMS for Voice Activity Detection (VAD)
      let sumSquares = 0;
      for (let i = 0; i < timeData.length; i++) {
        const normalized = (timeData[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / timeData.length);
      const isSpeaking = rms > vadThreshold;

      if (isSpeaking !== isVadActive) {
        isVadActive = isSpeaking;
        notifyVad(isVadActive, rms);
      }
      notifyLevel(rms);

      // Render Waveform Canvas
      if (canvasWave) renderWaveform(canvasWave, timeData, isSpeaking);
      // Render Frequency Spectrum Canvas
      if (canvasSpec) renderSpectrum(canvasSpec, freqData, isSpeaking);
    }

    draw();
  }

  // Simulated visualizer loop when mic is not available
  function startSimulatedAudioLoop(canvasWave, canvasSpec) {
    let tick = 0;
    const bufferSize = 512;
    const timeData = new Uint8Array(bufferSize);
    const freqData = new Uint8Array(bufferSize / 2);

    function draw() {
      if (!isRecording) return;
      animFrameId = requestAnimationFrame(draw);
      tick += 0.08;

      // Create natural pulsating voice wave simulation
      const voiceBurst = Math.sin(tick * 0.4) > -0.2;
      const amplitude = voiceBurst ? (0.4 + Math.sin(tick * 1.5) * 0.25) : 0.05;

      for (let i = 0; i < bufferSize; i++) {
        const wave = Math.sin(i * 0.08 + tick * 3) * Math.cos(i * 0.02 + tick) * amplitude;
        timeData[i] = Math.max(0, Math.min(255, Math.floor(128 + wave * 128)));
      }

      for (let i = 0; i < freqData.length; i++) {
        const falloff = Math.exp(-i / 40);
        freqData[i] = Math.max(0, Math.min(255, Math.floor(amplitude * 250 * falloff * (0.7 + Math.random() * 0.3))));
      }

      const isSpeaking = amplitude > 0.15;
      if (isSpeaking !== isVadActive) {
        isVadActive = isSpeaking;
        notifyVad(isVadActive, amplitude);
      }
      notifyLevel(amplitude);

      if (canvasWave) renderWaveform(canvasWave, timeData, isSpeaking);
      if (canvasSpec) renderSpectrum(canvasSpec, freqData, isSpeaking);
    }

    draw();
  }

  // Draw Waveform Oscilloscope on HTML5 Canvas
  function renderWaveform(canvas, dataArray, isSpeaking) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Waveform line
    ctx.lineWidth = 2.5;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    if (isSpeaking) {
      gradient.addColorStop(0, '#38bdf8');
      gradient.addColorStop(0.5, '#10b981');
      gradient.addColorStop(1, '#6366f1');
    } else {
      gradient.addColorStop(0, '#64748b');
      gradient.addColorStop(1, '#475569');
    }
    ctx.strokeStyle = gradient;

    ctx.beginPath();
    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  // Draw Frequency Spectrum Bars on HTML5 Canvas
  function renderSpectrum(canvas, freqArray, isSpeaking) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const barCount = 48;
    const barWidth = (width / barCount) - 2;
    const step = Math.floor(freqArray.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = freqArray[i * step] || 0;
      const percent = value / 255;
      const barHeight = Math.max(3, percent * (height - 6));
      const x = i * (barWidth + 2);
      const y = height - barHeight;

      const grad = ctx.createLinearGradient(0, height, 0, y);
      if (isSpeaking) {
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.8)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0.9)');
      } else {
        grad.addColorStop(0, 'rgba(100, 116, 139, 0.4)');
        grad.addColorStop(1, 'rgba(71, 85, 105, 0.6)');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  // Web Speech API Integration for Live Speech-to-Text
  let speechRecognizer = null;
  function startSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      speechRecognizer = new SpeechRec();
      speechRecognizer.continuous = true;
      speechRecognizer.interimResults = true;
      speechRecognizer.lang = 'en-US';

      speechRecognizer.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        listeners.transcriptChunk.forEach(cb => cb({
          interim: interimTranscript,
          final: finalTranscript,
          timestamp: new Date().toLocaleTimeString()
        }));
      };

      speechRecognizer.onerror = (e) => {
        console.warn('Speech recognition status:', e.error);
      };

      speechRecognizer.start();
    } catch (e) {
      console.warn('SpeechRecognizer could not start:', e);
    }
  }

  function stopSpeechRecognition() {
    if (speechRecognizer) {
      try {
        speechRecognizer.stop();
      } catch (e) {}
      speechRecognizer = null;
    }
  }

  // Synchronized Audio Player for Meeting Playback
  function playMeetingAudio(durationSec, onTimeUpdate, onEnded) {
    initAudioContext();
    playbackDuration = durationSec || 465;
    isPlaying = true;

    if (playbackInterval) clearInterval(playbackInterval);

    // Audio time tick every 200ms
    playbackInterval = setInterval(() => {
      if (!isPlaying) return;
      playbackCurrentTime += 0.2 * playbackRate;
      if (playbackCurrentTime >= playbackDuration) {
        playbackCurrentTime = playbackDuration;
        pauseMeetingAudio();
        if (onEnded) onEnded();
      }
      if (onTimeUpdate) onTimeUpdate(playbackCurrentTime, playbackDuration);
    }, 200);
  }

  function pauseMeetingAudio() {
    isPlaying = false;
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
  }

  function seekMeetingAudio(seconds, onTimeUpdate) {
    playbackCurrentTime = Math.max(0, Math.min(playbackDuration, seconds));
    if (onTimeUpdate) onTimeUpdate(playbackCurrentTime, playbackDuration);
  }

  function setPlaybackSpeed(rate) {
    playbackRate = rate;
  }

  function formatTime(totalSec) {
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function parseTime(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 0;
  }

  function notifyVad(isActive, rms) {
    listeners.vadState.forEach(cb => cb(isActive, rms));
  }

  function notifyLevel(rms) {
    listeners.level.forEach(cb => cb(rms));
  }

  return {
    startMicrophone,
    stopMicrophone,
    setVadSensitivity,
    getVadSensitivity,
    onVadChange: (cb) => listeners.vadState.push(cb),
    onLevelChange: (cb) => listeners.level.push(cb),
    onTranscriptChunk: (cb) => listeners.transcriptChunk.push(cb),
    playMeetingAudio,
    pauseMeetingAudio,
    seekMeetingAudio,
    setPlaybackSpeed,
    formatTime,
    parseTime,
    isPlaying: () => isPlaying,
    getCurrentTime: () => playbackCurrentTime
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApexAudioProcessor;
}
