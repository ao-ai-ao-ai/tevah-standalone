/**
 * TheCallView v2 — Decision Infrastructure workspace
 *
 * Uses live API data via useCall() hook. Falls back to legacy
 * CallBoard if the API is unreachable.
 */

import { useState, useEffect } from "react";
import { CallWorkspace } from "../components/the-call/call-workspace";

interface TheCallViewProps {
  onNavigate: (section: string) => void;
}

export function TheCallView({ onNavigate }: TheCallViewProps) {
  return (
    <div className="h-full w-full relative">
      <CallWorkspace onNavigate={onNavigate} />
    </div>
  );
}

export type { TheCallViewProps };
