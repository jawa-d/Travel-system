import assert from "node:assert/strict";
import {
  isFinalizedStatus,
  isWorkflowStatus,
  validateWorkflowTransition,
  workflowStatuses
} from "../src/lib/workflow-status";

assert.deepEqual(workflowStatuses, ["OPEN", "UNDER_REVIEW", "APPROVED", "REJECTED", "CLOSED"]);
assert.equal(isWorkflowStatus("OPEN"), true);
assert.equal(isWorkflowStatus("DRAFT"), false);
assert.equal(isWorkflowStatus("NEW"), false);
assert.equal(isFinalizedStatus("REJECTED"), true);
assert.equal(isFinalizedStatus("CLOSED"), true);
assert.equal(isFinalizedStatus("APPROVED"), false);
assert.equal(validateWorkflowTransition("OPEN", "APPROVED"), null);
assert.equal(validateWorkflowTransition("APPROVED", "UNDER_REVIEW"), null);
assert.equal(validateWorkflowTransition("REJECTED", "OPEN"), "FINALIZED");
assert.equal(validateWorkflowTransition("CLOSED", "APPROVED"), "FINALIZED");
assert.equal(validateWorkflowTransition("OPEN", "INVALID"), "INVALID_STATUS");

console.log("Workflow lifecycle checks passed.");
