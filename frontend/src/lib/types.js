// Tipos compartidos del frontend. Migrar gradualmente a .ts.

/**
 * @typedef {Object} PublicUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role
 * @property {string|null} avatar_color
 * @property {number} active
 * @property {string|null} created_at
 * @property {string|null} phone
 * @property {string|null} linkedin
 * @property {string|null} github
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} code
 * @property {string} title
 * @property {string|null} description
 * @property {string} type
 * @property {string} status
 * @property {string} priority
 * @property {string|null} assignee_id
 * @property {string} reporter_id
 * @property {string|null} parent_id
 * @property {string|null} epic_id
 * @property {string|null} sprint_id
 * @property {string|null} project_id
 * @property {number|null} estimate_hours
 * @property {number} time_spent_hours
 * @property {string|null} due_date
 * @property {string} deliverable
 * @property {number} position
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Task & {
 *   assignee: PublicUser|null,
 *   reporter: PublicUser,
 *   labels: string[],
 *   subtask_count: number,
 *   completed_subtask_count: number,
 *   comment_count: number,
 *   attachment_count: number
 * }} TaskWithDetails
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} color
 * @property {string} status
 * @property {string} sector
 * @property {string} code
 * @property {string|null} po_user_id
 * @property {string} created_at
 */

/**
 * @typedef {Object} ProjectMemberWithUser
 * @property {string} user_id
 * @property {string} role
 * @property {string} name
 * @property {string} email
 * @property {string|null} avatar_color
 */

/**
 * @typedef {Project & {
 *   task_count: number,
 *   done_count: number,
 *   members: ProjectMemberWithUser[]
 * }} ProjectWithStats
 */

/**
 * @typedef {Object} Sprint
 * @property {string} id
 * @property {string} name
 * @property {string|null} goal
 * @property {string|null} start_date
 * @property {string|null} end_date
 * @property {number} is_active
 * @property {string|null} project_id
 * @property {string} risks
 * @property {string} team_dependencies
 * @property {string} third_party_dependencies
 * @property {string} created_at
 */

/**
 * @typedef {Sprint & {
 *   total_tasks: number,
 *   done_tasks: number,
 *   total_estimate: number,
 *   total_spent: number
 * }} SprintWithStats
 */

/**
 * @typedef {Object} PaginatedResponse
 * @template T
 * @property {T[]} items
 * @property {number} total
 * @property {number} limit
 * @property {number} offset
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} user_id
 * @property {string} type
 * @property {string|null} task_id
 * @property {string|null} actor_id
 * @property {string} message
 * @property {number} is_read
 * @property {string} created_at
 */

/**
 * @typedef {Object} StatusCount
 * @property {string} status
 * @property {number} count
 */

/**
 * @typedef {Object} PriorityCount
 * @property {string} priority
 * @property {number} count
 */

/**
 * @typedef {Object} AssigneeCount
 * @property {string|null} assignee_id
 * @property {string|null} assignee_name
 * @property {number} count
 */

/**
 * @typedef {Object} DashboardStats
 * @property {number} total_tasks
 * @property {StatusCount[]} by_status
 * @property {PriorityCount[]} by_priority
 * @property {AssigneeCount[]} by_assignee
 * @property {Task[]} upcoming_due
 * @property {ActivityWithUser[]} recent_activity
 */

export {};
