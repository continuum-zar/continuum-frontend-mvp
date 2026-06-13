# CONTINUUM — RBAC Permission Specification

**System Architecture & Default Permission Matrix**

| Field | Value |
|---|---|
| Document Type | Strategic Architecture Spec |
| Version | Model 1.2 / Matrix 1.0 |
| Status | Draft — For Design & Development Review |
| Date | 04 June 2026 |
| Audience | Design & Development Teams |
| Language | UK English |

**101 Permissions · 6 Default Roles · Role-Based Access**

> Continuum SaaS Platform · Strategic Planning · Confidential Design & Development Reference Spec

---

# CONTINUUM — RBAC PERMISSION MODEL

**Role-Based Access Control: Full Permission Taxonomy**

Version: 1.2 · Status: Draft — For Design & Development Review
Related: DES-001, DEV-005, DEV-006, DEV-007

## Overview

This document defines the complete permission model for Continuum's Role-Based Access Control (RBAC) system. It establishes the atomic permission units that can be bundled into Roles, and describes how the ownership and role management system works.

Permissions are boolean (on/off) for a given role. Roles are named, reusable bundles of permissions. The project owner can create, edit, and delete roles, assign them to members, and override specific permissions within a role without rebuilding it from scratch.

> **KEY PRINCIPLE: "If you can't see it, you can't use it."** Turning off a section-level permission removes the entire section from the user's view. Sub-permissions within that section are implicitly disabled. A user should never see a disabled button without context — they simply should not see the feature at all if they do not have access.

---

## Part 0 — Structural Hierarchy

The RBAC system is built on a strict nesting model:

```
Project
└── Members
    └── Role(s)        ← a member must have at least one role
        └── Permissions ← a role must have at least one permission
```

### Hierarchy Rules

- **Permissions can exist without roles.** Permissions are atomic units defined at the system level. They exist independently of any role.
- **Permissions can exist without members.** A permission being defined does not require any member to hold it.
- **A Role CANNOT exist without permissions.** Every role must have at least one permission defined. An empty role is invalid and must not be saveable.
- **A Member CANNOT exist without a role.** Every active member must hold at least one role at all times. If a member's last role is removed, the Roleless Fallback State applies (see Part 8.6).

---

## Part 1 — Project Ownership & Role Management

### 1.1 Project Ownership

There is exactly **one Project Owner per project** at any time.

**Owner Characteristics:**

- Has ALL permissions enabled by default, with no restrictions.
- Cannot have permissions removed or overridden by any other role.
- Is the only entity that can transfer ownership.

**Ownership Transfer:**

- The owner may transfer ownership to an existing project member.
- The owner may transfer ownership to a person not yet in the project (they will be invited and ownership assigned simultaneously).
- Once transferred, the previous owner becomes a regular member with whatever role the new owner assigns them.

### 1.2 Role Management (Owner & Admin-Level Actions)

The following actions govern roles themselves — these are distinct from the permissions WITHIN roles.

- **`roles.view`** — Can view the list of roles that exist within the project.
- **`roles.create`** — Can create a new role.
- **`roles.edit`** — Can edit the permission bundle of an existing role. Editing a role propagates the change to ALL members assigned to that role.
- **`roles.delete`** — Can delete a role. Deleting a role must prompt a reassignment flow for all affected members.
- **`roles.reset_to_default`** — Can reset a role's permissions back to its default configuration. Overrides are cleared when this action is performed.
- **`roles.override_permission`** — Can apply a specific permission override to a role, superseding the role's default permission bundle without rebuilding the entire role. Precedence rule: override always wins over the role's default bundle. Overrides are auditable (who applied it, when).
- **`members.invite`** — Can invite a new user to the project. Invited user must be assigned a role at the point of invitation.
- **`members.assign_role`** — Can change the role assigned to an existing project member.
- **`members.remove`** — Can remove a member from the project.

---

## Part 2 — Project-Level Permissions

These permissions govern what a member can do at the top-level project view.

### Project Details

- **`project.edit.view`** — Can see the "Edit Project" interface at all. Turning this OFF hides the entire edit section. Sub-permissions below are implicitly off if this is off.
- **`project.edit.name`** — Can change the project name.
- **`project.edit.description`** — Can change the project description.
- **`project.edit.start_date`** — Can change the project start date.
- **`project.edit.target_delivery_date`** — Can change the project's target delivery date.
- **`project.edit.save`** — Can save changes made to project details.
- **`project.delete`** — Can delete the entire project. Must be a standalone, high-confirmation action regardless of role.
- **`project.share`** — Can share the project (e.g. generate a shareable link or invite via external share mechanism).
- **`project.export`** — Can export the project data. Sub-permissions govern export formats:
- **`project.export.csv`** — Can export as CSV.
- **`project.export.pdf`** — Can export as PDF.

### Recent Activity

- **`project.activity.view`** — Can see the Recent Activity feed on the project view. Turning this OFF hides the entire Recent Activity section.

### Resources

- **`project.resources.view`** — Can see the Resources section on the project view. Turning this OFF hides the entire Resources section. Sub-permissions below are implicitly off if this is off.
- **`project.resources.add`** — Can add a new resource (link or file) to the project-level resources.
- **`project.resources.delete`** — Can remove a resource from the project-level resources.

### Milestones / Sprints (Project View Overview)

- **`project.milestones.view_timeline`** — Can see the Milestone/Sprint timeline on the project view. Turning this OFF hides the timeline section entirely.
- **`project.milestones.view_history`** — Can see historical milestones (past sprints).
- **`project.milestones.create`** — Can create a new milestone/sprint from the project view.

### Repositories

- **`project.repositories.view`** — Can see the Repositories section on the project view. Turning this OFF hides the entire Repositories section. Sub-permissions below are implicitly off if this is off.
- **`project.repositories.connect`** — Can connect a new repository to the project.
- **`project.repositories.index`** — Can trigger an index of a connected repository.
- **`project.repositories.remove`** — Can remove (disconnect) a repository from the project.

### Team

- **`project.team.view`** — Can see the Team section on the project view. All members can see WHO is on the team (names/avatars) by default. This cannot be completely hidden — members must always know their teammates.
- **`project.team.view_hours`** — Can see the total hours worked by other team members. When OFF, a member can only see their own hours.
- **`project.team.view_tasks_completed`** — Can see the task completion count of other team members. When OFF, a member can only see their own task count.
- **`project.team.invite`** — Can invite new members to the project (same as `members.invite` above, surfaced here in the Team section context).

---

## Part 3 — Milestone / Sprint Permissions

These permissions govern what a member can do within a specific milestone (sprint). Note: the Project Owner controls visibility of sprints to roles — a member with `sprint.view` = OFF simply does not see that sprint exists.

### Sprint Visibility & Status

- **`sprint.view`** — Can see this sprint/milestone at all. When OFF: the sprint does not appear in any list, timeline, or navigation. This can be set per-sprint per-role by the project owner.
- **`sprint.status.view`** — Can see the sprint status indicator (e.g. On Track / At Risk / Off Target). When OFF: the status badge is hidden.

### Sprint CRUD

- **`sprint.create`** — Can create a new sprint/milestone.
- **`sprint.edit.name`** — Can rename a sprint.
- **`sprint.delete`** — Can delete a sprint.

### Sprint Views

- **`sprint.view.kanban`** — Can access the Kanban board view of the sprint.
- **`sprint.view.list`** — Can access the List view of the sprint.
- **`sprint.view.gantt`** — Can access the Gantt chart view of the sprint.
- **`sprint.view.calendar`** — Can access the Calendar view of the sprint.

### Board (Kanban List) Management

- **`sprint.board.reorder`** — Can drag and reorder Kanban columns/boards within a sprint.
- **`sprint.board.create`** — Can add a new board/column to the sprint.
- **`sprint.board.delete`** — Can delete an existing board/column from the sprint.

### Task Movement

- **`sprint.task.move_within_sprint`** — Can move tasks between boards/columns within the same sprint.
- **`sprint.task.move_to_other_sprint`** — Can move tasks from this sprint to a different sprint within the project.

### Time Logging

- **`sprint.time.log_manual`** — Can manually log time entries on tasks within this sprint.
- **`sprint.time.log_timer`** — Can use the timer recording feature to log time on tasks.

---

## Part 4 — Task / Ticket Permissions

These permissions govern what a member can do on individual tasks/tickets.

### Task Creation

- **`task.create`** — Can create a new task/ticket within a sprint. Note: title and description are always required to create a task. They are not gated behind sub-permissions.

### Task Field Permissions

- **`task.edit.status`** — Can change the status of a task (e.g. To Do → In Progress → Done).
- **`task.edit.priority`** — Can set or change the priority of a task.
- **`task.edit.tags`** — Can add or remove tags on a task.
- **`task.edit.estimated_effort`** — Can set or edit the estimated effort/story points of a task.
- **`task.edit.assigned_to`** — Can assign or reassign team members to a task.
- **`task.edit.link_repository_branch`** — Can link a repository branch to a task.

### Checklist

- **`task.checklist.view`** — Can see checklists on tasks.
- **`task.checklist.add`** — Can add a new checklist to a task. When OFF: the "Add Checklist" button is not visible.
- **`task.checklist.edit`** — Can edit items within an existing checklist.
- **`task.checklist.delete`** — Can delete a checklist from a task.

### Comments

- **`task.comments.view`** — Can view comments on a task.
- **`task.comments.add`** — Can post a comment on a task.
- **`task.comments.edit_own`** — Can edit their own previously posted comments.
- **`task.comments.delete_own`** — Can delete their own comments.
- **`task.comments.delete_any`** — Can delete any comment on a task (moderation-level permission).

### Activity Log

- **`task.activity.view`** — Can view the activity history of a task (who changed what, when). When OFF: the activity panel/tab is hidden.

### Resources (Task-Level)

- **`task.resources.view`** — Can see attached resources on a task.
- **`task.resources.add_link`** — Can attach a hyperlink resource to a task.
- **`task.resources.add_file`** — Can upload a file as a resource on a task.
- **`task.resources.delete`** — Can remove a resource attachment from a task.

### Dependencies

- **`task.dependencies.view`** — Can see the dependencies listed on a task.
- **`task.dependencies.add`** — Can add another task as a dependency of this task.
- **`task.dependencies.remove`** — Can remove a dependency from a task.

### Time Logging (Task-Level)

- **`task.time.log_manual`** — Can manually log time directly on a task.
- **`task.time.log_timer`** — Can use the timer feature to log time on a task.

### AI Assistant (In-Ticket)

- **`task.ai.view`** — Can see the AI chat panel on a ticket. When OFF: the AI panel is not visible at all.
- **`task.ai.interact`** — Can send messages and interact with the AI on a ticket. When OFF: the AI panel is visible but the input is disabled with a clear message indicating this is a permission restriction. NOTE: `task.ai.view` must be ON for this to be meaningful.

### Task Deletion

- **`task.delete`** — Can delete a task/ticket.

---

## Part 5 — Invoice Permissions

Invoicing permissions govern access to the invoicing section of the project.

- **`invoices.view`** — Can see the Invoices section. When OFF: the Invoices section is hidden entirely. Sub-permissions below are implicitly off if this is off.
- **`invoices.create`** — Can create a new invoice.
- **`invoices.edit`** — Can edit an existing invoice.
- **`invoices.delete`** — Can delete an invoice.
- **`invoices.export_pdf`** — Can export an invoice as a PDF.
- **`invoices.send`** — Can send an invoice to a client/recipient.

---

## Part 6 — Timesheet Permissions

- **`timesheets.view`** — Can see the Timesheets section. When OFF: the Timesheets section is hidden entirely.
- **`timesheets.view_own`** — Can view their own timesheet entries.
- **`timesheets.view_team`** — Can view all team members' timesheet entries.
- **`timesheets.edit_own`** — Can edit their own timesheet entries.
- **`timesheets.edit_any`** — Can edit any team member's timesheet entries (manager-level).
- **`timesheets.approve`** — Can approve timesheet submissions.
- **`timesheets.export`** — Can export timesheet data.

---

## Part 7 — Default Roles & Custom Roles

### 7.1 Default Roles

Continuum ships with a set of pre-packaged default roles. These serve as a universal starting point for every project.

| Role Name | Intent |
|---|---|
| **Project Owner** | The "god role". One per project at all times. All permissions enabled with no restrictions. The only role that can delete the project and transfer ownership. Cannot be edited or removed. |
| **Admin** | All permissions except ownership transfer. Can manage roles, members, and all project content. |
| **Project Manager** | Role and member management, full sprint and task control. Operational lead below Admin. |
| **Developer** | Task CRUD, sprint views, time logging, comments, repository linking. The standard working-member role. Placeholder for the future Member category. |
| **View Only** | Pure observation. Can see the project and its content but cannot create, update, or delete anything. Cannot move boards, cannot move tickets, cannot log time, cannot comment. Read access only. |
| **Contractor** | Limited to assigned tasks, time logging, comments. No access to project configuration or team data. |

**Member Category Note (Future Iteration)**

The "Developer" role above is a placeholder for a broader Member role category. In a future iteration, the Member role will serve as the base default for working team members, with named subtypes (e.g. Developer, Designer, Marketer, Finance, HR) that can be selected or auto-suggested based on the type of project created. For now, "Developer" is the working default and this expansion is deferred.

**Default Role Behaviour:**

- Default roles ship with a fixed, pre-defined permission bundle.
- They CAN be overridden (specific permissions toggled) without losing their identity as a default role.
- When overridden, the system tracks this and presents a "Reset to Default" action that restores the original packaged permission bundle and clears all overrides.
- When a default role is overridden or reset, ALL members holding that role are immediately affected.

> **NOTE:** The exact default permission bundle for each of these roles must be defined in collaboration between Design and Development before implementation. The table above captures INTENT only, not the final boolean mapping.

### 7.2 Custom Roles

Admins and project owners can create custom roles that live alongside default roles.

**Custom Role Creation Methods:**

1. **Create from scratch** — define a new role name and build its permission bundle from zero.
2. **Duplicate from a default role** — start from a default role's permission bundle and customise it. This is the recommended workflow. The action should be surfaced clearly (e.g. "Create custom role from [Default Name]").

**Custom Role Behaviour:**

- Custom roles can be edited at any time. Changes propagate to all members holding that role.
- Custom roles can be deleted. Deleting a custom role must trigger a reassignment flow for all affected members before deletion is confirmed.
- Custom roles do NOT have a "Reset to Default" action — they have no packaged default to return to. They can only be edited or deleted.
- A custom role created from a default role is INDEPENDENT of that default from the moment of creation. Subsequent changes to the default role do NOT cascade into derived custom roles.

---

## Part 8 — Behaviour Rules & Edge Cases

### 8.1 Section Visibility Rule

If a section-level "view" permission is OFF, the entire section is hidden. The user has no visual indicator that the section exists. They will not see disabled buttons or greyed-out sections. The section simply does not render.

### 8.2 Sub-Permission Dependency

If a parent-level view permission is OFF, all sub-permissions within it are treated as OFF regardless of their individual setting. The system should not expose sub-features without their parent context. Example: `task.ai.interact` = ON has no effect if `task.ai.view` = OFF.

### 8.3 Override Precedence

When a project owner or admin applies a specific permission override to a role:

- The override takes precedence over the role's default bundle.
- Overrides are stored separately from the role bundle (they do not modify the base role, they annotate it).
- Resetting a role to default removes all overrides and restores the base permission bundle.

### 8.4 Sprint Visibility Per Role

Sprint visibility (`sprint.view`) can be managed per sprint, per role. When a new sprint is created, the project owner or admin should be prompted to confirm which roles can see it. The default should be configurable.

### 8.5 Audit Trail

All permission changes (role edits, overrides applied, role assignments, ownership transfers) must be recorded in an audit log, capturing:

- Who performed the action.
- What was changed (before/after state).
- Timestamp.

### 8.6 Roleless Member State

A member whose last role is removed does not lose their project membership. Instead, they enter a roleless fallback state:

- The member can still log in and reach the project.
- The project view renders a prominent notification: *"You currently have no role assigned on [Project Name]."* [Request Role Access]
- The Request Role Access CTA sends a notification to the project owner and any members with the `members.assign_role` permission.
- The request can be approved (triggers role assignment) or denied (member receives a notification of the denial).
- Until a role is assigned, the member has ZERO permissions within the project — no content is visible beyond the notification itself.

> **Design note:** The roleless state should feel clear and non-threatening. The member is not locked out — they are simply waiting. The notification should be the only thing they see, with a single clear action.

### 8.7 Multi-Role Access (Additive / Permissive)

> **!! CRITICAL IMPLEMENTATION RULE — DEVELOPER READ CAREFULLY !!**

A member CAN hold more than one role simultaneously. When a member holds multiple roles, their effective permission set is the UNION of all permissions across all their roles. **ACCESS IS ALWAYS ADDITIVE — NEVER RESTRICTIVE.**

If Role A has `task.delete` = OFF and Role B has `task.delete` = ON, a member holding both roles GETS `task.delete`. The more permissive state always wins. Multiple roles can NEVER be used to take access away — only to add it.

If the intent is to restrict access, the correct action is to assign a single, appropriately scoped role — NOT to combine roles and expect one to cancel out another.

### 8.8 Permission Conflict Resolution

The system should prevent conflicting override states. If an admin attempts to apply an override that conflicts with a dependency rule (e.g. enabling `task.ai.interact` while `task.ai.view` is OFF), the system should surface a warning and resolve it logically (enable the parent, or block the sub).

---

## Part 9 — Open Questions for Design & Development Review

**Q1: SCOPE FIELD** — The "scope" field on a task was identified as informational (not a permission). Confirm: is there ever a case where we want to restrict who can set or view the scope?

**Q2: INVOICE SECTION PLACEMENT** — Are invoices project-level or organisation-level? The permission model above treats them as project-level. Clarify before implementation.

**Q3: TIMESHEET vs. TIME LOGGING SEPARATION** — Time logging (`task.time.`) and Timesheets (`timesheets.`) are modelled separately above. Confirm this split is correct or whether they should merge into a single permission group.

**Q4: ROLE VISIBILITY FOR MEMBERS** — Should a regular member be able to SEE their own role and permissions? Or only the admin/owner can view role configurations? Consider the UX of a team member understanding why a button is missing.

**Q5: CONTRACTOR DEFAULT ROLE** — What is the minimum viable permission set for a contractor? Confirm whether contractors should be able to view activity logs and team data.

**Q6: AI INTERACT vs. AI VIEW — UX DECISION** — When `task.ai.view` = ON but `task.ai.interact` = OFF, the panel is visible but the input is disabled. Is this the right pattern, or should the whole panel be hidden in this case too? (Consistency with section rule.)

**Q7: PER-SPRINT PERMISSION GRANULARITY** — `sprint.view` is described as being settable per-sprint, per-role. This introduces significant configuration surface. Consider whether this granularity is needed at launch or should be a V2 feature.

**Q8: ROLE REQUEST NOTIFICATIONS** — When a roleless member requests access, who receives the notification? Only members with `members.assign_role`, only the project owner, or both?

**Q9: PROFILE-LEVEL DEFAULT ROLE TEMPLATES (BACKLOG)** — Out of scope for this document, but noted: a future feature would allow a user to configure their preferred default role set at the organisation/profile level, auto-applied when they create a new project. This should be tracked as a backlog item.

---

## Related Artefacts

- **DES-001:** Design the RBAC Interface
- **DEV-005:** Implement Core RBAC System (backend)
- **DEV-006:** Implement Custom Permission Overrides
- **DEV-007:** Implement Permissions-as-Pricing Configuration Layer

---

# Appendix — Default Permission Matrix

**Version 1.0 — Draft** · Status: For Design & Development Review
Related: RBAC_Permission_Model.md · DES-001 · DEV-005

## How to Read This Document

This matrix shows **Layer 2 (Role Defaults)** only.

Project Owner has every permission ON without exception and is immune to Layer 1 overrides. Their column is omitted from the table — assume ✓ for all 101 permissions.

### Role & Member Management

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

### Project Details

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

### Recent Activity

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.activity.view | ✓ | ✓ | ✓ | ✓ | ✗ |

### Resources *(project level)*

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.resources.view | ✓ | ✓ | ✓ | ✓ | ✗ |
| project.resources.add | ✓ | ✓ | ✓ | ✗ | ✗ |
| project.resources.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

### Milestones & Sprints *(project overview)*

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.milestones.view_timeline | ✓ | ✓ | ✓ | ✓ | ✗ |
| project.milestones.view_history | ✓ | ✓ | ✓ | ✓ | ✗ |
| project.milestones.create | ✓ | ✓ | ✗ | ✗ | ✗ |

### Repositories

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.repositories.view | ✓ | ✓ | ✓ | ✓ | ✗ |
| project.repositories.connect | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.repositories.index | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.repositories.remove | ✓ | ✓ | ✗ | ✗ | ✗ |

### Team

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| project.team.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| project.team.view_hours | ✓ | ✓ | ✗ | ✗ | ✗ |
| project.team.view_tasks_completed | ✓ | ✓ | ✓ | ✓ | ✗ |
| project.team.invite | ✓ | ✓ | ✗ | ✗ | ✗ |

> **Note:** `project.team.view` is ON for Contractors — members must always know who their teammates are.

### Sprint Visibility & Status

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| sprint.status.view | ✓ | ✓ | ✓ | ✓ | ✗ |

### Sprint Management

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.create | ✓ | ✓ | ✗ | ✗ | ✗ |
| sprint.edit.name | ✓ | ✓ | ✗ | ✗ | ✗ |
| sprint.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

### Sprint Views

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.view.kanban | ✓ | ✓ | ✓ | ✓ | ✓ |
| sprint.view.list | ✓ | ✓ | ✓ | ✓ | ✓ |
| sprint.view.gantt | ✓ | ✓ | ✓ | ✓ | ✗ |
| sprint.view.calendar | ✓ | ✓ | ✓ | ✓ | ✗ |

### Board Management

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.board.reorder | ✓ | ✓ | ✗ | ✗ | ✗ |
| sprint.board.create | ✓ | ✓ | ✗ | ✗ | ✗ |
| sprint.board.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

### Task Movement

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.task.move_within_sprint | ✓ | ✓ | ✓ | ✗ | ✗ |
| sprint.task.move_to_other_sprint | ✓ | ✓ | ✗ | ✗ | ✗ |

### Time Logging *(sprint level)*

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| sprint.time.log_manual | ✓ | ✓ | ✓ | ✗ | ✓ |
| sprint.time.log_timer | ✓ | ✓ | ✓ | ✗ | ✓ |

### Task Creation

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.create | ✓ | ✓ | ✓ | ✗ | ✗ |

### Task Field Editing

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.edit.status | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.edit.priority | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.edit.tags | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.edit.estimated_effort | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.edit.assigned_to | ✓ | ✓ | ✗ | ✗ | ✗ |
| task.edit.link_repository_branch | ✓ | ✓ | ✓ | ✗ | ✗ |

> **Note:** `task.edit.assigned_to` is OFF for Developers — assigning people to tasks is a PM responsibility by default. This is a common override point.

### Checklist

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.checklist.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| task.checklist.add | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.checklist.edit | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.checklist.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

> **Note:** Contractors can edit checklist items (tick them off) but cannot add or delete whole checklists.

### Comments

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.comments.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| task.comments.add | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.comments.edit_own | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.comments.delete_own | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.comments.delete_any | ✓ | ✓ | ✗ | ✗ | ✗ |

### Activity Log

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.activity.view | ✓ | ✓ | ✓ | ✓ | ✓ |

### Resources *(task level)*

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.resources.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| task.resources.add_link | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.resources.add_file | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.resources.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

### Dependencies

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.dependencies.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| task.dependencies.add | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.dependencies.remove | ✓ | ✓ | ✓ | ✗ | ✗ |

### Time Logging *(task level)*

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.time.log_manual | ✓ | ✓ | ✓ | ✗ | ✓ |
| task.time.log_timer | ✓ | ✓ | ✓ | ✗ | ✓ |

### AI Assistant

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.ai.view | ✓ | ✓ | ✓ | ✗ | ✗ |
| task.ai.interact | ✓ | ✓ | ✓ | ✗ | ✗ |

### Task Deletion

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| task.delete | ✓ | ✓ | ✗ | ✗ | ✗ |

### Invoices

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| invoices.view | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices.create | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices.edit | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices.delete | ✓ | ✗ | ✗ | ✗ | ✗ |
| invoices.export_pdf | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices.send | ✓ | ✓ | ✗ | ✗ | ✗ |

> **Note:** `invoices.delete` is Admin-only. Deleting an invoice is a high-risk financial action.

### Timesheets

| Permission | Admin | Project Manager | Developer | View Only | Contractor |
|---|:---:|:---:|:---:|:---:|:---:|
| timesheets.view | ✓ | ✓ | ✓ | ✗ | ✓ |
| timesheets.view_own | ✓ | ✓ | ✓ | ✗ | ✓ |
| timesheets.view_team | ✓ | ✓ | ✗ | ✗ | ✗ |
| timesheets.edit_own | ✓ | ✓ | ✓ | ✗ | ✓ |
| timesheets.edit_any | ✓ | ✓ | ✗ | ✗ | ✗ |
| timesheets.approve | ✓ | ✓ | ✗ | ✗ | ✗ |
| timesheets.export | ✓ | ✓ | ✗ | ✗ | ✗ |

## Summary — Permissions ON per Role

| Role | Permissions ON | Out of 101 |
|---|:---:|:---:|
| Project Owner | 101 | 101 |
| Admin | 86 | 101 |
| Project Manager | 72 | 101 |
| Developer | 40 | 101 |
| View Only | 22 | 101 |
| Contractor | 24 | 101 |

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

---

*END OF DOCUMENT*
