export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #06070f; }
@keyframes pulseLime { 0%,100% { opacity:1; } 50% { opacity:.35; } }
@keyframes pulseOrange { 0%,100% { box-shadow:0 0 0 3px rgba(249,115,22,0.5); } 50% { box-shadow:0 0 0 3px rgba(249,115,22,0.08); } }
.pulse-accepted { animation: pulseOrange 1.2s ease-in-out infinite; }
@keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes popIn { from { opacity:0; transform:scale(.82); } to { opacity:1; transform:scale(1); } }
.anim-up { animation: slideUp .26s ease-out; }
.anim-pop { animation: popIn .22s cubic-bezier(.175,.885,.32,1.275); }
.pulse-lime { animation: pulseLime 1.4s ease-in-out infinite; }
`;
