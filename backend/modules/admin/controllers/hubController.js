import Hub from '../models/Hub.js';
import { successResponse, errorResponse } from '../../../shared/utils/response.js';
import asyncHandler from '../../../shared/middleware/asyncHandler.js';
import mongoose from 'mongoose';

/**
 * Get all hubs
 * GET /api/admin/hubs
 */
export const getHubs = asyncHandler(async (req, res) => {
    try {
        const { cityId, status, search } = req.query;
        const query = {};

        if (cityId) {
            query.cityId = new mongoose.Types.ObjectId(cityId);
        }

        if (status) {
            query.status = status;
        }

        if (search) {
            query.hubName = { $regex: search, $options: 'i' };
        }

        const hubs = await Hub.find(query)
            .populate('cityId', 'cityName')
            .sort({ hubName: 1 })
            .lean();

        return successResponse(res, 200, 'Hubs retrieved successfully', { hubs });
    } catch (error) {
        console.error('Error fetching hubs:', error);
        return errorResponse(res, 500, 'Failed to fetch hubs');
    }
});

/**
 * Create new hub
 * POST /api/admin/hubs
 */
export const createHub = asyncHandler(async (req, res) => {
    try {
        const { cityId, hubName, hubArea, serviceablePincodes, status } = req.body;

        if (!cityId || !hubName) {
            return errorResponse(res, 400, 'City ID and Hub name are required');
        }

        const hubExists = await Hub.findOne({
            cityId,
            hubName: { $regex: `^${hubName}$`, $options: 'i' }
        });
        if (hubExists) {
            return errorResponse(res, 400, 'Hub with this name already exists in this city');
        }

        const hub = new Hub({
            cityId,
            hubName,
            hubArea,
            serviceablePincodes: serviceablePincodes || [],
            status: status || 'active',
            createdBy: req.admin?._id || null
        });

        await hub.save();

        return successResponse(res, 201, 'Hub created successfully', { hub });
    } catch (error) {
        console.error('Error creating hub:', error);
        return errorResponse(res, 500, 'Failed to create hub');
    }
});

/**
 * Update hub
 * PUT /api/admin/hubs/:id
 */
export const updateHub = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const hub = await Hub.findById(id);
        if (!hub) {
            return errorResponse(res, 404, 'Hub not found');
        }

        if (updateData.hubName && updateData.cityId) {
            const hubExists = await Hub.findOne({
                cityId: updateData.cityId,
                hubName: { $regex: `^${updateData.hubName}$`, $options: 'i' },
                _id: { $ne: id }
            });
            if (hubExists) {
                return errorResponse(res, 400, 'Hub with this name already exists in this city');
            }
        }

        Object.assign(hub, updateData);
        await hub.save();

        return successResponse(res, 200, 'Hub updated successfully', { hub });
    } catch (error) {
        console.error('Error updating hub:', error);
        return errorResponse(res, 500, 'Failed to update hub');
    }
});

/**
 * Delete hub
 * DELETE /api/admin/hubs/:id
 */
export const deleteHub = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const hub = await Hub.findByIdAndDelete(id);
        if (!hub) {
            return errorResponse(res, 404, 'Hub not found');
        }

        return successResponse(res, 200, 'Hub deleted successfully');
    } catch (error) {
        console.error('Error deleting hub:', error);
        return errorResponse(res, 500, 'Failed to delete hub');
    }
});
