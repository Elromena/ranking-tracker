"use client";

import SettingsView from "../../views/settings";

export default function SettingsPage() {
  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">Credentials, locales, categories, and preferences</p>
      </div>

      <SettingsView />
    </>
  );
}
