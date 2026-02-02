"use client";
import React, { useState } from "react";
import {
  Palette as PaletteIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";

const THEMES = [
  {
    id: "default-dark",
    name: "Default Dark",
    preview: {
      primary: "#3B82F6",
      secondary: "#1F2937",
      accent: "#8B5CF6",
      bg: "#111827",
    },
    colors: {
      "--bg-primary": "#111827",
      "--bg-secondary": "#1F2937",
      "--bg-tertiary": "#374151",
      "--text-primary": "#FFFFFF",
      "--text-secondary": "#9CA3AF",
      "--accent-primary": "#3B82F6",
      "--accent-secondary": "#8B5CF6",
    },
  },
  {
    id: "default-light",
    name: "Default Light",
    preview: {
      primary: "#3B82F6",
      secondary: "#F3F4F6",
      accent: "#8B5CF6",
      bg: "#FFFFFF",
    },
    colors: {
      "--bg-primary": "#FFFFFF",
      "--bg-secondary": "#F3F4F6",
      "--bg-tertiary": "#E5E7EB",
      "--text-primary": "#111827",
      "--text-secondary": "#6B7280",
      "--accent-primary": "#3B82F6",
      "--accent-secondary": "#8B5CF6",
    },
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    preview: {
      primary: "#0EA5E9",
      secondary: "#0C4A6E",
      accent: "#06B6D4",
      bg: "#082F49",
    },
    colors: {
      "--bg-primary": "#082F49",
      "--bg-secondary": "#0C4A6E",
      "--bg-tertiary": "#075985",
      "--text-primary": "#F0F9FF",
      "--text-secondary": "#7DD3FC",
      "--accent-primary": "#0EA5E9",
      "--accent-secondary": "#06B6D4",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    preview: {
      primary: "#22C55E",
      secondary: "#14532D",
      accent: "#10B981",
      bg: "#052E16",
    },
    colors: {
      "--bg-primary": "#052E16",
      "--bg-secondary": "#14532D",
      "--bg-tertiary": "#166534",
      "--text-primary": "#F0FDF4",
      "--text-secondary": "#86EFAC",
      "--accent-primary": "#22C55E",
      "--accent-secondary": "#10B981",
    },
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    preview: {
      primary: "#F97316",
      secondary: "#7C2D12",
      accent: "#FB923C",
      bg: "#431407",
    },
    colors: {
      "--bg-primary": "#431407",
      "--bg-secondary": "#7C2D12",
      "--bg-tertiary": "#9A3412",
      "--text-primary": "#FFF7ED",
      "--text-secondary": "#FDBA74",
      "--accent-primary": "#F97316",
      "--accent-secondary": "#FB923C",
    },
  },
  {
    id: "purple-haze",
    name: "Purple Haze",
    preview: {
      primary: "#A855F7",
      secondary: "#581C87",
      accent: "#C084FC",
      bg: "#3B0764",
    },
    colors: {
      "--bg-primary": "#3B0764",
      "--bg-secondary": "#581C87",
      "--bg-tertiary": "#6B21A8",
      "--text-primary": "#FAF5FF",
      "--text-secondary": "#D8B4FE",
      "--accent-primary": "#A855F7",
      "--accent-secondary": "#C084FC",
    },
  },
  {
    id: "rose",
    name: "Rose Pink",
    preview: {
      primary: "#F43F5E",
      secondary: "#881337",
      accent: "#FB7185",
      bg: "#4C0519",
    },
    colors: {
      "--bg-primary": "#4C0519",
      "--bg-secondary": "#881337",
      "--bg-tertiary": "#9F1239",
      "--text-primary": "#FFF1F2",
      "--text-secondary": "#FDA4AF",
      "--accent-primary": "#F43F5E",
      "--accent-secondary": "#FB7185",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    preview: {
      primary: "#6366F1",
      secondary: "#1E1B4B",
      accent: "#818CF8",
      bg: "#0F0D23",
    },
    colors: {
      "--bg-primary": "#0F0D23",
      "--bg-secondary": "#1E1B4B",
      "--bg-tertiary": "#312E81",
      "--text-primary": "#EEF2FF",
      "--text-secondary": "#A5B4FC",
      "--accent-primary": "#6366F1",
      "--accent-secondary": "#818CF8",
    },
  },
];

export default function ThemeSelector({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  darkMode,
}) {
  const [selectedTheme, setSelectedTheme] = useState(
    currentTheme || "default-dark",
  );

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    const theme = THEMES.find((t) => t.id === themeId);
    if (theme) {
      // Apply CSS variables
      Object.entries(theme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
      onThemeChange && onThemeChange(themeId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div
        className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl shadow-2xl w-full max-w-2xl p-6 animate-scale-in max-h-[80vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <PaletteIcon className="text-white" />
            </div>
            <div>
              <h2
                className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                Choose Theme
              </h2>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Customize your workspace appearance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                selectedTheme === theme.id
                  ? "border-blue-500 ring-2 ring-blue-500/30"
                  : darkMode
                    ? "border-gray-600 hover:border-gray-500"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Theme Preview */}
              <div
                className="h-20 rounded-lg mb-3 overflow-hidden"
                style={{ backgroundColor: theme.preview.bg }}
              >
                <div className="p-2">
                  <div
                    className="h-3 w-12 rounded mb-2"
                    style={{ backgroundColor: theme.preview.primary }}
                  />
                  <div
                    className="h-2 w-16 rounded mb-1"
                    style={{ backgroundColor: theme.preview.secondary }}
                  />
                  <div
                    className="h-2 w-10 rounded"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                </div>
              </div>

              {/* Theme Name */}
              <div
                className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {theme.name}
              </div>

              {/* Selected Indicator */}
              {selectedTheme === theme.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <CheckIcon className="text-white" fontSize="small" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Quick Toggle */}
        <div
          className={`mt-6 p-4 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Quick Mode Toggle
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleThemeSelect("default-light")}
                className={`p-2 rounded-lg transition-colors ${
                  selectedTheme === "default-light"
                    ? "bg-yellow-500 text-white"
                    : darkMode
                      ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <LightModeIcon fontSize="small" />
              </button>
              <button
                onClick={() => handleThemeSelect("default-dark")}
                className={`p-2 rounded-lg transition-colors ${
                  selectedTheme === "default-dark"
                    ? "bg-blue-500 text-white"
                    : darkMode
                      ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <DarkModeIcon fontSize="small" />
              </button>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
          >
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
}
