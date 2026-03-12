/**
 * PipelineView v2 — 5-phase pipeline board with live data
 *
 * Uses usePipeline() hook for real-time pipeline data from the API.
 */

import { PipelineBoard } from "../components/pipeline/pipeline-board";

export default function PipelineView({ onNavigateToOrder }: { onNavigateToOrder: (id: string) => void }) {
  return (
    <div className="h-full w-full">
      <PipelineBoard onNavigateToOrder={onNavigateToOrder} />
    </div>
  );
}
