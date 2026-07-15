import { COLOR } from "./tokens.js";

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,700;0,900;1,700;1,900&family=DM+Sans:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: ${COLOR.bg}; }
@keyframes pulseLime { 0%,100% { opacity:1; } 50% { opacity:.35; } }
@keyframes pulseOrange { 0%,100% { box-shadow:0 0 0 3px rgba(249,115,22,0.5); } 50% { box-shadow:0 0 0 3px rgba(249,115,22,0.08); } }
.pulse-accepted { animation: pulseOrange 1.2s ease-in-out infinite; }
@keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes popIn { from { opacity:0; transform:scale(.82); } to { opacity:1; transform:scale(1); } }
@keyframes scoreBump { 0% { transform:scale(1); } 35% { transform:scale(1.22); } 100% { transform:scale(1); } }
.anim-up { animation: slideUp .26s ease-out; }
.anim-pop { animation: popIn .22s cubic-bezier(.175,.885,.32,1.275); }
.pulse-lime { animation: pulseLime 1.4s ease-in-out infinite; }
.flash-change { animation: scoreBump .5s cubic-bezier(.22,1,.36,1); }
button:focus-visible, input:focus-visible, select:focus-visible { outline:2px solid ${COLOR.lime}; outline-offset:2px; }
@media (prefers-reduced-motion: reduce) {
  .anim-up, .anim-pop, .pulse-lime, .pulse-accepted, .flash-change { animation:none; }
}
`;
