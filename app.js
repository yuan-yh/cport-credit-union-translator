// frontend/App.js
const WS_URL = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host.replace(/:\d+$/, ':8000') + '/ws/client1';

let ws;
let audioCtx;
let sourceNode;
let processor;
let micStream;
let isRecording = false;

// MediaDevices/getUserMedia polyfill for older browsers/Safari
if (typeof navigator !== 'undefined') {
    if (!navigator.mediaDevices) {
        navigator.mediaDevices = {};
    }
    if (!navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
            const legacyGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            if (!legacyGetUserMedia) {
                return Promise.reject(new Error('getUserMedia is not supported in this browser'));
            }
            return new Promise((resolve, reject) => legacyGetUserMedia.call(navigator, constraints, resolve, reject));
        };
    }
}

// Determine environment preconditions and microphone support
const SECURE_CONTEXT = (typeof window !== 'undefined') && (
    window.isSecureContext || ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname)
);
const MIC_SUPPORTED = !!(
    (typeof navigator !== 'undefined') && (
        (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') ||
        navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
    )
);

// UI Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const flushBtn = document.getElementById('flushBtn');
const transcriptEl = document.getElementById('transcript');
const statusEl = document.getElementById('status');

function updateStatus(status, message) {
    statusEl.className = `status ${status}`;
    statusEl.innerHTML = `<i class="fas fa-circle"></i><span>${message}</span>`;
}

function updateTranscript(text, isError = false) {
    if (isError) {
        transcriptEl.innerHTML = `<span style="color: #e53e3e;">${text}</span>`;
        transcriptEl.className = 'transcript-content';
    } else if (text) {
        transcriptEl.innerHTML = text;
        transcriptEl.className = 'transcript-content';
    } else {
        transcriptEl.innerHTML = 'Click "Start Recording" to begin speech recognition...';
        transcriptEl.className = 'transcript-content empty';
    }
}

function updateButtons(recording) {
    startBtn.disabled = recording;
    stopBtn.disabled = !recording;
    flushBtn.disabled = !recording;
    
    if (recording) {
        startBtn.innerHTML = '<i class="fas fa-play"></i> Recording...';
        startBtn.classList.add('pulse');
    } else {
        startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        startBtn.classList.remove('pulse');
    }
}

async function start() {
    try {
        updateStatus('connecting', 'Connecting...');
        
        // Guard: secure context required by most browsers for mic access
        if (!SECURE_CONTEXT) {
            console.warn('Not a secure context. getUserMedia requires HTTPS or localhost.');
            updateStatus('disconnected', 'Use HTTPS or localhost');
            updateTranscript('Microphone requires a secure context. Please serve over HTTPS or use localhost.', true);
            return;
        }

        // Initialize WebSocket
        ws = new WebSocket(WS_URL);
        ws.binaryType = "arraybuffer";
        
        ws.onopen = () => {
            console.log("WebSocket connected");
            updateStatus('connected', 'Connected');
        };
        
        ws.onclose = () => {
            console.log("WebSocket disconnected");
            updateStatus('disconnected', 'Disconnected');
            if (isRecording) {
                stop();
            }
        };
        
        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            updateStatus('disconnected', 'Connection Error');
            updateTranscript('Connection failed. Please try again.', true);
        };
        
        ws.onmessage = async (evt) => {
            console.log("Received message:", evt.data);
            const text = evt.data;
            try {
                const msg = JSON.parse(text);
                console.log("Parsed message:", msg);
                if (msg.type === 'transcript') {
                    let displayText = msg.text;
                    if (msg.is_translated) {
                        displayText = `[${msg.original_language.toUpperCase()} → EN] ${msg.text}`;
                        console.log(`Translated from ${msg.original_language} to English: ${msg.text}`);
                    }
                    updateTranscript(displayText);
                } else if (msg.type === 'audio') {
                    playBase64Audio(msg.data_b64, msg.sr);
                } else if (msg.type === 'pong') {
                    console.log("Received pong from server");
                }
            } catch (e) {
                console.error("Non-JSON message", e);
            }
        };

        // Initialize audio context and microphone (use default hardware sample rate)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Resume audio context if suspended (required for Chrome)
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
            console.log('Audio context resumed');
        }
        
        console.log('Audio context state:', audioCtx.state);
        
        // Preflight: ensure mediaDevices.getUserMedia is available
        if (!MIC_SUPPORTED) {
            throw new Error('Browser does not support getUserMedia');
        }

        micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        console.log('Microphone stream obtained:', micStream.getTracks()[0].label);
        
        sourceNode = audioCtx.createMediaStreamSource(micStream);

        // Create audio processor for real-time audio processing
        processor = audioCtx.createScriptProcessor(4096, 1, 1);
        sourceNode.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
            if (!isRecording || !ws || ws.readyState !== WebSocket.OPEN) {
                return;
            }

            const input = e.inputBuffer.getChannelData(0);
            const inputSampleRate = audioCtx.sampleRate;
            const targetSampleRate = 16000;
            
            // Check if there's actual audio data (not just silence)
            let hasAudio = false;
            let maxAmplitude = 0;
            for (let i = 0; i < input.length; i++) {
                const amplitude = Math.abs(input[i]);
                if (amplitude > 0.001) {
                    hasAudio = true;
                }
                if (amplitude > maxAmplitude) {
                    maxAmplitude = amplitude;
                }
            }
            
            if (hasAudio) {
                // Resample to 16kHz if needed (simple decimation/linear interpolation)
                let toSend = input;
                if (inputSampleRate !== targetSampleRate) {
                    const ratio = inputSampleRate / targetSampleRate;
                    const outLen = Math.floor(input.length / ratio);
                    const out = new Float32Array(outLen);
                    let pos = 0;
                    for (let i = 0; i < outLen; i++) {
                        const idx = i * ratio;
                        const idx0 = Math.floor(idx);
                        const idx1 = Math.min(idx0 + 1, input.length - 1);
                        const frac = idx - idx0;
                        out[i] = input[idx0] * (1 - frac) + input[idx1] * frac;
                    }
                    toSend = out;
                }

                // Convert Float32 to little-endian bytes
                const arrayBuffer = new ArrayBuffer(toSend.length * 4);
                const view = new DataView(arrayBuffer);
                for (let i = 0; i < toSend.length; i++) {
                    view.setFloat32(i * 4, toSend[i], true);
                }
                
                try {
                    ws.send(arrayBuffer);
                    console.log('Sent audio chunk:', toSend.length, 'samples @16kHz (in:', input.length, '@', inputSampleRate, 'Hz), max amp:', maxAmplitude.toFixed(4));
                    
                    // Visual feedback that audio is being sent
                    transcriptEl.style.borderLeft = '4px solid #667eea';
                    setTimeout(() => {
                        transcriptEl.style.borderLeft = 'none';
                    }, 100);
                    
                } catch (error) {
                    console.error('Error sending audio:', error);
                }
            }
        };

        isRecording = true;
        updateButtons(true);
        updateTranscript('Listening... Speak now!');
        
        // Add visual feedback
        document.querySelector('.logo').classList.add('pulse');
        
        // Send a test message to verify connection
        setTimeout(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({cmd: "ping"}));
                console.log('Sent ping to test connection');
            }
        }, 1000);
        
    } catch (error) {
        console.error("Error starting recording:", error);
        updateStatus('disconnected', 'Error');
        
        if (error.name === 'NotAllowedError') {
            updateTranscript('Microphone access denied. Please allow microphone permissions and try again.', true);
        } else if (error.name === 'NotFoundError') {
            updateTranscript('No microphone found. Please connect a microphone and try again.', true);
        } else {
            updateTranscript(`Error: ${error.message}`, true);
        }
    }
}

function stop() {
    try {
        // Stop audio processing
        if (processor) { 
            processor.disconnect(); 
            processor = null;
        }
        if (sourceNode) { 
            sourceNode.disconnect(); 
            sourceNode = null;
        }
        if (micStream) {
            micStream.getTracks().forEach(t => t.stop());
            micStream = null;
        }
        
        // Close WebSocket
        if (ws) { 
            ws.close(); 
            ws = null; 
        }
        
        // Reset state
        isRecording = false;
        updateButtons(false);
        updateStatus('disconnected', 'Disconnected');
        updateTranscript('Recording stopped. Click "Start Recording" to begin again.');
        
        // Remove visual feedback
        document.querySelector('.logo').classList.remove('pulse');
        
    } catch (error) {
        console.error("Error stopping recording:", error);
    }
}

function base64ToFloat32Array(b64) {
    const binary = atob(b64);
    const len = binary.length / 4;
    const floats = new Float32Array(len);
    const dv = new DataView(new ArrayBuffer(binary.length));
    for (let i = 0; i < binary.length; i++) {
        dv.setUint8(i, binary.charCodeAt(i));
    }
    for (let i = 0; i < len; i++) {
        floats[i] = dv.getFloat32(i * 4, true);
    }
    return floats;
}

async function playBase64Audio(b64, sr) {
    try {
        const floats = base64ToFloat32Array(b64);
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = ac.createBuffer(1, floats.length, sr);
        buffer.copyToChannel(floats, 0, 0);
        const src = ac.createBufferSource();
        src.buffer = buffer;
        src.connect(ac.destination);
        src.start();
        
        // Add visual feedback for audio playback
        transcriptEl.style.borderLeft = '4px solid #48bb78';
        setTimeout(() => {
            transcriptEl.style.borderLeft = 'none';
        }, 1000);
        
    } catch (error) {
        console.error("Error playing audio:", error);
    }
}

// Event listeners (attach; Start will early-return with helpful message if unsupported)
{
    startBtn.addEventListener('click', start);
    stopBtn.addEventListener('click', stop);
    flushBtn.addEventListener('click', () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({cmd: "flush"}));
            console.log('Sent flush command');
        }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('button, input, textarea')) {
            e.preventDefault();
            if (isRecording) {
                stop();
            } else {
                start();
            }
        }
    });

    // Add tooltips
    startBtn.title = 'Press Space to start/stop recording';
    stopBtn.title = 'Press Space to start/stop recording';

    // Initialize UI with diagnostics
    if (!SECURE_CONTEXT) {
        updateStatus('disconnected', 'Use HTTPS or localhost');
        updateTranscript('Microphone requires a secure context. Please serve over HTTPS or use localhost.', true);
    } else if (!MIC_SUPPORTED) {
        updateStatus('disconnected', 'Mic not supported');
        updateTranscript('This browser does not support microphone capture. Try Chrome/Edge desktop, with HTTPS or localhost.', true);
    } else {
        updateStatus('disconnected', 'Ready to connect');
        updateButtons(false);
    }
}

// Add some nice animations on page load
setTimeout(() => {
    document.querySelectorAll('.feature').forEach((feature, index) => {
        setTimeout(() => {
            feature.style.opacity = '0';
            feature.style.transform = 'translateY(20px)';
            feature.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                feature.style.opacity = '1';
                feature.style.transform = 'translateY(0)';
            }, 100);
        }, index * 200);
    });
}, 500);
