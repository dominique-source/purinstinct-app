import { createContext, useContext } from "react";
import { zn } from "../config/zones.js";
import { T } from "../config/translations.js";

export const LangContext = createContext({ lang:"fr", setLang:()=>{} });

export function useT() { const { lang } = useContext(LangContext); return T[lang]; }

export function useLang() { return useContext(LangContext); }

export function useZn(){const{lang}=useContext(LangContext);return(zone)=>zn(zone,lang);}
