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
          cancel: function() {},
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

  // HACK: force empty speech to fix issue where first tap produces no speech
  // (ineffective; issue appears to be triggered by navigating/changing categories in freevoice itself)
  // (looks like FreeVoice is attempting to avoid speech on scroll operations by ignoring the 'next' speech operation; unfortunately this is failing as the tap to scroll still triggers the speech, and then it ignore the first tap that occurs *after* the scroll event has completed) 
  /*setTimeout(function() {
    if (window.AndroidBridge && window.AndroidBridge.speak) {
      window.AndroidBridge.speak(" ")
    }
  }, 1000)*/

  // 3. Auto-Configure the Child's Name
  // FIXME:  implement
  /*try {
      const params = new URLSearchParams(window.location.search);
      const defaultName = params.get('defaultName');

      if (defaultName) {
          // TODO: You must verify the exact localStorage key FreeVoice uses!
          // If they use a state manager like Zustand, it might be stored as a JSON string.
          // e.g., localStorage.setItem('freevoice-storage', JSON.stringify({ state: { name: defaultName } }))

          const storageKey = 'userName'; // CHANGE THIS TO THE REAL KEY
          if (!localStorage.getItem(storageKey)) {
              localStorage.setItem(storageKey, defaultName);
          }
      }
  } catch (e) {
      console.error("Bridge Init Error", e);
  }*/
}

// Execute the rig BEFORE React mounts
setupAndroidBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
