// src/VersionReset.jsx
import { useEffect } from 'react';

// ⚠️ CHANGE THIS STRING TO FORCE A RESET FOR EVERYONE
const CURRENT_VERSION = "v1.0_RESET_DEC19"; 

export default function VersionReset() {
  useEffect(() => {
    const savedVersion = localStorage.getItem("app_version");

    if (savedVersion !== CURRENT_VERSION) {
      console.log("New update detected! Wiping local data...");
      
      // 1. Wipe everything
      localStorage.clear();
      
      // 2. Save new version
      localStorage.setItem("app_version", CURRENT_VERSION);
      
      // 3. Reload to start fresh
      window.location.reload();
    }
  }, []);

  // This component doesn't render anything visible
  return null;
}