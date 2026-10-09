import type { DemoKind } from "../content";
import { DocumentDemo } from "./document-demo";
import { ManagementDemo } from "./management-demo";
import { PosDemo } from "./pos-demo";
import { LinesDemo } from "./lines-demo";

export function ProjectDemo({ kind }: { kind: Exclude<DemoKind, null> }) {
  return (
    <div className={`project-demo demo-theme-${kind}`}>
      <div className="fictional-label">
        <span /> Dados fictícios
      </div>
      {kind === "pos" ? <PosDemo /> : null}
      {kind === "management" ? <ManagementDemo /> : null}
      {kind === "document" ? <DocumentDemo /> : null}
      {kind === "lines" ? <LinesDemo /> : null}
    </div>
  );
}
