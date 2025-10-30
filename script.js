// DOM Elements
const textInput = document.getElementById('text-input');
const speakBtn = document.getElementById('speak-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const voiceSelect = document.getElementById('voice-select');
const rateInput = document.getElementById('rate');
const pitchInput = document.getElementById('pitch');
const rateValue = document.getElementById('rate-value');
const pitchValue = document.getElementById('pitch-value');
const charCount = document.getElementById('char-count');
const statusDiv = document.getElementById('result');

// Speech synthesis setup
let voices = [];
let currentUtterance = null;
let isPaused = false;

// Initialize the application
function init() {
  // Load voices when they become available
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices(); // Try to load voices immediately
  
  // Event listeners
  speakBtn.addEventListener('click', toggleSpeech);
  pauseBtn.addEventListener('click', togglePause);
  stopBtn.addEventListener('click', stopSpeech);
  rateInput.addEventListener('input', updateRate);
  pitchInput.addEventListener('input', updatePitch);
  textInput.addEventListener('input', updateCharCount);
  
  // Update UI
  updateCharCount();
  
  // Set up speech synthesis events
  window.speechSynthesis.onend = onSpeechEnd;
  window.speechSynthesis.onpause = onSpeechPause;
  window.speechSynthesis.onresume = onSpeechResume;
  
  // Show initial status
  updateStatus('Ready', 'info');
}

// Load available voices
function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  
  // Clear existing options
  voiceSelect.innerHTML = '';
  
  // Add a default option
  const defaultOption = document.createElement('option');
  defaultOption.textContent = 'Select a voice';
  defaultOption.value = '';
  voiceSelect.appendChild(defaultOption);
  
  // Add all available voices
  voices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.textContent = `${voice.name} (${voice.lang})`;
    option.setAttribute('data-voice-index', index);
    option.value = voice.voiceURI;
    voiceSelect.appendChild(option);
  });
  
  // Try to set a default voice
  const defaultVoice = voices.find(voice => 
    voice.lang.startsWith(navigator.language) || 
    voice.lang.startsWith(navigator.language.split('-')[0])
  );
  
  if (defaultVoice) {
    voiceSelect.value = defaultVoice.voiceURI;
  }
}

// Toggle speech synthesis
function toggleSpeech() {
  if (speechSynthesis.speaking && !isPaused) {
    // If already speaking, stop first
    stopSpeech();
    return;
  }
  
  if (isPaused) {
    // If paused, resume
    resumeSpeech();
    return;
  }
  
  // Start new speech
  startSpeech();
}

// Start speech synthesis
function startSpeech() {
  const text = textInput.value.trim();
  
  if (!text) {
    updateStatus('Please enter some text to convert to speech!', 'error');
    return;
  }
  
  if (!window.speechSynthesis) {
    updateStatus('Your browser does not support Text-to-Speech.', 'error');
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Create a new utterance
  currentUtterance = new SpeechSynthesisUtterance(text);
  
  // Set voice if selected
  const selectedVoice = voices.find(voice => voice.voiceURI === voiceSelect.value);
  if (selectedVoice) {
    currentUtterance.voice = selectedVoice;
  }
  
  // Set rate and pitch
  currentUtterance.rate = parseFloat(rateInput.value);
  currentUtterance.pitch = parseFloat(pitchInput.value);
  
  // Set up event handlers
  currentUtterance.onstart = () => {
    updateStatus('Speaking...', 'success');
    speakBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    textInput.disabled = true;
    voiceSelect.disabled = true;
  };
  
  currentUtterance.onend = () => {
    if (!isPaused) {
      onSpeechEnd();
    }
  };
  
  currentUtterance.onerror = (event) => {
    console.error('SpeechSynthesis error:', event);
    updateStatus('An error occurred while speaking.', 'error');
    resetControls();
  };
  
  // Start speaking
  window.speechSynthesis.speak(currentUtterance);
}

// Pause speech
function togglePause() {
  if (isPaused) {
    resumeSpeech();
  } else {
    pauseSpeech();
  }
}

function pauseSpeech() {
  if (speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    isPaused = true;
    updateStatus('Paused', 'warning');
    pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
  }
}

function resumeSpeech() {
  if (speechSynthesis.paused) {
    window.speechSynthesis.resume();
    isPaused = false;
    updateStatus('Speaking...', 'success');
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
  }
}

// Stop speech
function stopSpeech() {
  window.speechSynthesis.cancel();
  onSpeechEnd();
}

// Handle speech end
function onSpeechEnd() {
  updateStatus('Speech completed', 'info');
  resetControls();
}

function onSpeechPause() {
  isPaused = true;
  updateStatus('Paused', 'warning');
  pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
}

function onSpeechResume() {
  isPaused = false;
  updateStatus('Speaking...', 'success');
  pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
}

// Update rate
function updateRate() {
  rateValue.textContent = rateInput.value;
  if (currentUtterance) {
    currentUtterance.rate = parseFloat(rateInput.value);
  }
}

// Update pitch
function updatePitch() {
  pitchValue.textContent = pitchInput.value;
  if (currentUtterance) {
    currentUtterance.pitch = parseFloat(pitchInput.value);
  }
}

// Update character count
function updateCharCount() {
  const count = textInput.value.length;
  charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
}

// Update status message
function updateStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = 'status';
  
  switch (type) {
    case 'error':
      statusDiv.style.color = '#e53e3e';
      statusDiv.style.backgroundColor = '#fff5f5';
      break;
    case 'success':
      statusDiv.style.color = '#38a169';
      statusDiv.style.backgroundColor = '#f0fff4';
      break;
    case 'warning':
      statusDiv.style.color = '#dd6b20';
      statusDiv.style.backgroundColor = '#fffaf0';
      break;
    default:
      statusDiv.style.color = 'inherit';
      statusDiv.style.backgroundColor = 'transparent';
  }
}

// Reset UI controls
function resetControls() {
  speakBtn.innerHTML = '<i class="fas fa-play"></i> Play';
  pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  textInput.disabled = false;
  voiceSelect.disabled = false;
  isPaused = false;
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);