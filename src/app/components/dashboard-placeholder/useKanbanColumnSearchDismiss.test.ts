/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";

import { shouldDismissKanbanColumnSearchOnPointerDown } from "./useKanbanColumnSearchDismiss";

function makeDom() {
  const container = document.createElement("div");
  const inside = document.createElement("input");
  container.appendChild(inside);
  document.body.appendChild(container);

  const card = document.createElement("div");
  card.setAttribute("data-no-kanban-search-dismiss", "");
  const cardChild = document.createElement("span");
  card.appendChild(cardChild);
  document.body.appendChild(card);

  const menu = document.createElement("div");
  menu.setAttribute("data-slot", "dropdown-menu-content");
  const menuItem = document.createElement("button");
  menu.appendChild(menuItem);
  document.body.appendChild(menu);

  const outside = document.createElement("p");
  document.body.appendChild(outside);

  return { container, inside, card, cardChild, menuItem, outside };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("shouldDismissKanbanColumnSearchOnPointerDown", () => {
  it("does not dismiss when the target is inside the search container", () => {
    const { container, inside } = makeDom();
    expect(shouldDismissKanbanColumnSearchOnPointerDown(inside, container)).toBe(false);
  });

  it("does not dismiss when the target is inside an opt-out element (e.g. task card)", () => {
    const { container, card, cardChild } = makeDom();
    expect(shouldDismissKanbanColumnSearchOnPointerDown(card, container)).toBe(false);
    expect(shouldDismissKanbanColumnSearchOnPointerDown(cardChild, container)).toBe(false);
  });

  it("does not dismiss when the target is inside a Radix dropdown menu", () => {
    const { container, menuItem } = makeDom();
    expect(shouldDismissKanbanColumnSearchOnPointerDown(menuItem, container)).toBe(false);
  });

  it("dismisses when the target is truly outside the search container", () => {
    const { container, outside } = makeDom();
    expect(shouldDismissKanbanColumnSearchOnPointerDown(outside, container)).toBe(true);
  });

  it("dismisses when the target is null and there is no container", () => {
    expect(shouldDismissKanbanColumnSearchOnPointerDown(null, null)).toBe(true);
  });
});
