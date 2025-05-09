"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missionRoutes = void 0;
const hono_1 = require("hono");
const zod_validator_1 = require("@hono/zod-validator");
const zod_1 = require("zod");
const mission_service_1 = require("../services/mission-service");
const schema_1 = require("../db/schema");
// Create the missions router
exports.missionRoutes = new hono_1.Hono();
/**
 * GET /api/missions
 * Get all missions for a store with optional filtering and pagination
 */
exports.missionRoutes.get('/', async (c) => {
    try {
        const db = c.get('db');
        const storeId = parseInt(c.req.query('store_id') || '0');
        const status = c.req.query('status') || 'all';
        const page = parseInt(c.req.query('page') || '1');
        const limit = parseInt(c.req.query('limit') || '10');
        if (!storeId) {
            return c.json({
                success: false,
                message: 'store_id is required'
            }, 400);
        }
        const missionService = new mission_service_1.MissionService(db);
        const statusParam = status === 'all' ? 'all' : status;
        const { missions, total } = await missionService.getMissionsByStore(storeId, statusParam, page, limit);
        return c.json({
            success: true,
            data: missions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error retrieving missions:', error);
        return c.json({
            success: false,
            message: error.message || 'Failed to retrieve missions',
        }, 500);
    }
});
/**
 * GET /api/missions/:id
 * Get a specific mission by ID with all tasks
 */
exports.missionRoutes.get('/:id', async (c) => {
    try {
        const db = c.get('db');
        const missionId = parseInt(c.req.param('id'));
        const storeId = parseInt(c.req.query('store_id') || '0');
        if (!storeId) {
            return c.json({
                success: false,
                message: 'store_id is required'
            }, 400);
        }
        if (isNaN(missionId)) {
            return c.json({
                success: false,
                message: 'Invalid mission ID'
            }, 400);
        }
        const missionService = new mission_service_1.MissionService(db);
        const mission = await missionService.getMissionWithTasksAndProgress(storeId, missionId);
        if (!mission) {
            return c.json({
                success: false,
                message: 'Mission not found or not available to this store'
            }, 404);
        }
        return c.json({
            success: true,
            data: mission
        });
    }
    catch (error) {
        console.error('Error retrieving mission:', error);
        return c.json({
            success: false,
            message: error.message || 'Failed to retrieve mission',
        }, 500);
    }
});
// Define mission creation schema for validation
const createMissionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    points_required: zod_1.z.number().int().positive(),
    is_active: zod_1.z.boolean().default(true),
    start_date: zod_1.z.string().optional(),
    end_date: zod_1.z.string().optional(),
    is_recurring: zod_1.z.boolean().default(false),
    recurrence_pattern: zod_1.z.string().optional(),
    prerequisite_mission_id: zod_1.z.number().int().positive().optional(),
    target_type: zod_1.z.enum(['all', 'specific', 'filtered']).default('all'),
    target_stores: zod_1.z.string().optional() // JSON string for store IDs or filter criteria
});
/**
 * POST /api/missions
 * Create a new mission (admin only)
 */
exports.missionRoutes.post('/', (0, zod_validator_1.zValidator)('json', createMissionSchema), async (c) => {
    try {
        const db = c.get('db');
        const data = c.req.valid('json');
        // This would typically have authentication/authorization checks
        // to ensure only admin users can create missions
        const result = await db.insert(schema_1.missions).values({
            name: data.name,
            description: data.description,
            pointsRequired: data.points_required,
            isActive: data.is_active,
            startDate: data.start_date,
            endDate: data.end_date,
            isRecurring: data.is_recurring,
            recurrencePattern: data.recurrence_pattern,
            prerequisiteMissionId: data.prerequisite_mission_id,
            targetType: data.target_type,
            targetStores: data.target_stores
        }).returning();
        return c.json({
            success: true,
            message: 'Mission created successfully',
            data: result[0]
        });
    }
    catch (error) {
        console.error('Error creating mission:', error);
        return c.json({
            success: false,
            message: error.message || 'Failed to create mission',
        }, 500);
    }
});
/**
 * GET /api/missions/:id/tasks
 * Get all tasks for a specific mission
 */
exports.missionRoutes.get('/:id/tasks', async (c) => {
    try {
        const db = c.get('db');
        const missionId = parseInt(c.req.param('id'));
        const storeId = parseInt(c.req.query('store_id') || '0');
        if (!storeId) {
            return c.json({
                success: false,
                message: 'store_id is required'
            }, 400);
        }
        if (isNaN(missionId)) {
            return c.json({
                success: false,
                message: 'Invalid mission ID'
            }, 400);
        }
        const missionService = new mission_service_1.MissionService(db);
        const tasks = await missionService.getMissionTasks(storeId, missionId);
        return c.json({
            success: true,
            data: tasks
        });
    }
    catch (error) {
        console.error('Error retrieving mission tasks:', error);
        return c.json({
            success: false,
            message: error.message || 'Failed to retrieve mission tasks',
        }, 500);
    }
});
/**
 * GET /api/missions/:id/rewards
 * Get all rewards for a specific mission
 */
exports.missionRoutes.get('/:id/rewards', async (c) => {
    try {
        const db = c.get('db');
        const missionId = parseInt(c.req.param('id'));
        const storeId = parseInt(c.req.query('store_id') || '0');
        if (!storeId) {
            return c.json({
                success: false,
                message: 'store_id is required'
            }, 400);
        }
        if (isNaN(missionId)) {
            return c.json({
                success: false,
                message: 'Invalid mission ID'
            }, 400);
        }
        const missionService = new mission_service_1.MissionService(db);
        const rewards = await missionService.getMissionRewards(storeId, missionId);
        return c.json({
            success: true,
            data: rewards
        });
    }
    catch (error) {
        console.error('Error retrieving mission rewards:', error);
        return c.json({
            success: false,
            message: error.message || 'Failed to retrieve mission rewards',
        }, 500);
    }
});
