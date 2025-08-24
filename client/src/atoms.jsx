import { atom } from "recoil";

// saving previously selected language and theme to local storage
const localStorageEffect = (key) => ({ setSelf, onSet }) => {
  const savedValue = localStorage.getItem(key);
  if (savedValue != null) {
    try {
      // Try parsing, fallback to raw string if parsing fails
      const parsed = JSON.parse(savedValue);
      setSelf(parsed);
    } catch (e) {
      setSelf(savedValue); // fallback: set raw string
    }
  }

  onSet((newValue) => {
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  });
};


export const language = atom({
  key: "language",
  default: { id: "63", value: "javascript" },
  effects_UNSTABLE: [localStorageEffect("language")],
});

export const cmtheme = atom({
  key: "cmtheme",
  default: "monokai",
  effects_UNSTABLE: [localStorageEffect("cmtheme")],
});

export const username = atom({
  key: "username",
  default: "",
  effects_UNSTABLE: [localStorageEffect("username")],
});

export const roomId = atom({
  key: "roomId",
  default: "",
  effects_UNSTABLE: [localStorageEffect("roomId")],
});

export const data = atom({
  key: "data",
  default: "",
  effects_UNSTABLE: [localStorageEffect("data")],
});