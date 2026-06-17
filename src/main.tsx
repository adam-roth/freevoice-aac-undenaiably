import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index'
import './index.css'
import App from './App.tsx'

// --- UNDENIABLY NATIVE BRIDGE POLYFILL ---
function setupAndroidBridge() {
  // Cast window to 'any' to bypass strict TypeScript rules for our custom objects
  const win = window as any;

  // 1. Stub the Utterance Constructor
  if (typeof win.SpeechSynthesisUtterance === 'undefined') {
      win.SpeechSynthesisUtterance = function(text: string) {
          this.text = text || '';
          this.lang = 'en-US';
          this.volume = 1.0;
          this.rate = 1.0;
          this.pitch = 1.0;
          this.onstart = null;
          this.onend = null;
          this.onerror = null;
      };
  }

  // 2. Stub the SpeechSynthesis Engine
  if (!win.speechSynthesis) {
      win.speechSynthesis = {
          speak: function(utterance: any) {
              if (utterance.onstart) utterance.onstart(new Event('start'));
              if (win.AndroidBridge && win.AndroidBridge.speak) {
		// 2. Store the callback globally instead of firing it immediately
		if (utterance.onend) {
		    win._activeSpeechCallback = utterance.onend;
		}

		// 3. Send text to Kotlin
		win.AndroidBridge.speak(utterance.text);
	    } else {
		// Fallback for desktop testing
		if (utterance.onend) utterance.onend(new Event('end'));
	    }
          },
          cancel: function() {
		if (win.AndroidBridge && win.AndroidBridge.stop) { win.AndroidBridge.stop(); if (win._activeSpeechCallback) win._activeSpeechCallback(new Event('end')); win._activeSpeechCallback = null; }
	  },
          pause: function() {},
          resume: function() {},
          getVoices: function() {
              return [{ name: 'undenAIably Native', lang: 'en-US', default: true, localService: true }];
          },
          onvoiceschanged: null
      };
  } else {
      const originalSpeak = win.speechSynthesis.speak.bind(win.speechSynthesis);
      win.speechSynthesis.speak = function(utterance: any) {
          if (win.AndroidBridge && win.AndroidBridge.speak) {
              win.AndroidBridge.speak(utterance.text);
          } else {
              originalSpeak(utterance);
          }
      };
  }
}

// Execute the rig BEFORE React mounts
setupAndroidBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
