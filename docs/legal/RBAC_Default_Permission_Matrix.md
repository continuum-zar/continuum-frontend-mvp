# CONTINUUM — RBAC Default Permission Matrix

**Role-Based Access Control: Default States per Role**

| Field | Value |
|---|---|
| Document Type | Strategic Architecture Spec |
| Version | 1.0 |
| Status | Draft — For Design & Development Review |
| Date | 04 June 2026 |
| Audience | Design & Development Teams |
| Language | UK English |

**101 Permissions · 6 Default Roles · Role-Based Access**

> Continuum SaaS Platform · Strategic Planning · Confidential Design & Development Reference Spec
> Related: RBAC_Permission_Model.md · DES-001 · DEV-005

---

## How to Read This Document

This matrix shows **Layer 2 (Role Defaults)** only.

Project Owner has every permission ON without exception and is immune to Layer 1 overrides. Their column is omitted from the table — assume ✓ for all 101 permissions.

---

## Role & Member Management

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| roles.view | ✓ | ✓ | ✗ | ✗ | ✗ |
| roles.create | ✓ | ✗ | ✗ | ✗ | ✗ |
| roles.edit | ✓ | ✗ | ✗ | ✗ | ✗ |
| roles.delete | ✓ | ✗ | ✗ | ✗ | ✗ |
| roles.reset_to_default | ✓ | ✗ | ✗ | ✗ | ✗ |
| roles.override_permission | ✓ | ✗ | ✗ | ✗ | ✗ |
| members.invite | ✓ | ✓ | ✗ | ✗ | ✗ |
| members.assign_role | ✓ | ✓ | ✗ | ✗ | ✗ |
| members.remove | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## Project Details

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.edit.view | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.edit.name | ✓ | ✗ | ✗ | ✗ | ✗ |
| project.edit.description | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.edit.start_date | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.edit.target_delivery_date | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.edit.save | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.delete | ✗ | ✗ | ✗ | ✗ | ✗ |
| project.share | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.export.csv | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.export.pdf | ✓ | ✓ | ✗ | ✗ | ✗ |

> **Note:** `project.delete` is OFF for all roles except Project Owner. Deletion of a project is a god-role action only.

---

## Recent Activity

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.activity.view | ✓ | ✓ | ✓ | ✓ | ✗ |

---

## Resources *(project level)*

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.resources.view | ✓ | ✓ | ✓ | ✓ | ✗ |
| project.resources.add | ✓ | ✓ | ✓ | ✗ | ✗ |
| project.resources.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Milestones & Sprints *(project overview)*

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.milestones.view_timeline | ✓ | ✓ | ✓ | ✓ | ✗ |
| project.milestones.view_history | ✓ | ✓ | ✓ | ✓ | ✗ |
| project.milestones.create | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Repositories

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.repositories.view | ✓ | ✓ | ✓ | ✓ | ✗ |
| project.repositories.connect | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.repositories.index | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.repositories.remove | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Team

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.team.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| project.team.view_hours | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.team.view_tasks_completed | ✓ | ✓ | ✓ | ✓ | ✗ |
| project.team.invite | ✓ | ✓ | ✗ | ✗ | ✗ |

> **Note:** `project.team.view` is ON for Contractors — members must always know who their teammates are.

---

## Sprint Visibility & Status

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| sprint.status.view | ✓ | ✓ | ✓ | ✓ | ✗ |

---

## Sprint Management

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.create | ✓ | ✓ | ✗ | ✗ | ✗ |
| sprint.edit.name | ✓ | ✓ | ✗ | ✗ | ✗ |
| sprint.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Sprint Views

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.view.kanban | ✓ | ✓ | ✓ | ✓ | ✓ |
| sprint.view.list | ✓ | ✓ | ✓ | ✓ | ✓ |
| sprint.view.gantt | ✓ | ✓ | ✓ | ✓ | ✗ |
| sprint.view.calendar | ✓ | ✓ | ✓ | ✓ | ✗ |

---

## Board Management

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.board.reorder | ✓ | ✓ | ✗ | ✗ | ✗ |
| sprint.board.create | ✓ | ✓ | ✗ | ✗ | ✗ |
| sprint.board.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Task Movement

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.task.move_within_sprint | ✓ | ✓ | ✓ | ✗ | ✗ |
| sprint.task.move_to_other_sprint | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Time Logging *(sprint level)*

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.time.log_manual | ✓ | ✓ | ✓ | ✗ | ✓ |
| sprint.time.log_timer | ✓ | ✓ | ✓ | ✗ | ✓ |

---

## Task Creation

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.create | ✓ | ✓ | ✓ | ✗ | ✗ |

---

## Task Field Editing

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.edit.status | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.edit.priority | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.edit.tags | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.edit.estimated_effort | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.edit.assigned_to | ✓ | ✓ | ✗ | ✗ | ✗ |
| task.edit.link_repository_branch | ✓ | ✓ | ✓ | ✗ | ✗ |

> **Note:** `task.edit.assigned_to` is OFF for Developers — assigning people to tasks is a PM responsibility by default. This is a common override point.

---

## Checklist

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.checklist.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| task.checklist.add | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.checklist.edit | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.checklist.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

> **Note:** Contractors can edit checklist items (tick them off) but cannot add or delete whole checklists.

---

## Comments

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.comments.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| task.comments.add | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.comments.edit_own | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.comments.delete_own | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.comments.delete_any | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Activity Log

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.activity.view | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Resources *(task level)*

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.resources.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| task.resources.add_link | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.resources.add_file | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.resources.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Dependencies

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.dependencies.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| task.dependencies.add | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.dependencies.remove | ✓ | ✓ | ✓ | ✗ | ✗ |

---

## Time Logging *(task level)*

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.time.log_manual | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.time.log_timer | ✓ | ✓ | ✓ | ✗ | ✓ |

---

## AI Assistant

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.ai.view | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.ai.interact | ✓ | ✓ | ✓ | ✗ | ✗ |

---

## Task Deletion

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Invoices

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| invoices.view | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices.create | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices.edit | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices.delete | ✓ | ✗ | ✗ | ✗ | ✗ |
| invoices.export_pdf | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices.send | ✓ | ✓ | ✗ | ✗ | ✗ |

> **Note:** `invoices.delete` is Admin-only. Deleting an invoice is a high-risk financial action.

---

## Timesheets

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| timesheets.view | ✓ | ✓ | ✓ | ✗ | ✓ |
| timesheets.view_own | ✓ | ✓ | ✓ | ✗ | ✓ |
| timesheets.view_team | ✓ | ✓ | ✗ | ✗ | ✗ |
| timesheets.edit_own | ✓ | ✓ | ✓ | ✗ | ✓ |
| timesheets.edit_any | ✓ | ✓ | ✗ | ✗ | ✗ |
| timesheets.approve | ✓ | ✓ | ✗ | ✗ | ✗ |
| timesheets.export | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Summary — Permissions ON per Role

| Role | Permissions ON | Out of 101 |
|---|:---:|:---:|
| Project Owner | 101 | 101 |
| Admin | 86 | 101 |
| Project Manager | 72 | 101 |
| Developer | 40 | 101 |
| View Only | 22 | 101 |
| Contractor | 24 | 101 |

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| `project.delete` is Owner-only | Deleting an entire project is irreversible. No other role should have this by default, ever. |
| `roles.create/edit/delete` is Admin-only | Project Managers are operational leads, not system administrators. Role architecture is an admin concern. |
| `members.remove` is Admin-only | PMs can invite and assign, but removing a person from a project is an administrative action with HR implications. |
| `task.edit.assigned_to` is OFF for Developers | Assignment is a PM responsibility by default. Developers can request this override if needed. |
| `invoices.delete` is Admin-only | Financial record deletion is high-risk. PM can create and send, but not destroy. |
| Contractors get time logging but not task creation | Contractors work on assigned tasks only — they don't create scope. |
| Contractors get `task.checklist.edit` but not add | They can tick off items on their work, not restructure the checklist itself. |
| View Only has NO write access of any kind | Pure observation. Not even comments. If they need to comment, they need a different role. |
