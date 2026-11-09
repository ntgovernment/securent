import assert from "node:assert/strict";
import test from "node:test";
import { getPageWindow } from "./page-window.mjs";

test("shows every page when there are five or fewer", () => {
  assert.deepEqual(getPageWindow(1, 1), [1]);
  assert.deepEqual(getPageWindow(3, 5), [1, 2, 3, 4, 5]);
});

test("compacts page numbers around the first page", () => {
  assert.deepEqual(getPageWindow(1, 10), [1, 2, "ellipsis", 10]);
  assert.deepEqual(getPageWindow(2, 10), [1, 2, 3, "ellipsis", 10]);
});

test("compacts page numbers around a middle page", () => {
  assert.deepEqual(getPageWindow(5, 10), [1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
});

test("compacts page numbers around the last page", () => {
  assert.deepEqual(getPageWindow(10, 10), [1, "ellipsis", 9, 10]);
  assert.deepEqual(getPageWindow(9, 10), [1, "ellipsis", 8, 9, 10]);
});

test("uses a single ellipsis for a six-page list", () => {
  assert.deepEqual(getPageWindow(3, 6), [1, 2, 3, 4, "ellipsis", 6]);
});