import { createContext, useContext } from "react";
import { MODES } from "../config/modes.js";

export const ModeContext = createContext({ mode:null, modeConfig:null });

export function useMode() { return useContext(ModeContext); }

// Un mode donné a-t-il accès à cette catégorie de vue (MODES[mode].enabledViews) ?
export function hasView(mode, category) {
  return !!MODES[mode]?.enabledViews.includes(category);
}
