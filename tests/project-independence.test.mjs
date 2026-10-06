import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("o projeto não depende do editor que originou o código", () => {
  const result = spawnSync(process.execPath, ["scripts/check-project-independence.mjs"], {
    cwd: new URL("../", import.meta.url),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
