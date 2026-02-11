import City from '../models/City.js';
import { successResponse, errorResponse } from '../../../shared/utils/response.js';
import asyncHandler from '../../../shared/middleware/asyncHandler.js';

/**
 * Get all cities
 * GET /api/admin/cities
 */
export const getCities = asyncHandler(async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            query.cityName = { $regex: search, $options: 'i' };
        }

        const cities = await City.find(query).sort({ cityName: 1 }).lean();

        return successResponse(res, 200, 'Cities retrieved successfully', { cities });
    } catch (error) {
        console.error('Error fetching cities:', error);
        return errorResponse(res, 500, 'Failed to fetch cities');
    }
});

/**
 * Create new city
 * POST /api/admin/cities
 */
export const createCity = asyncHandler(async (req, res) => {
    try {
        const { cityName, status } = req.body;

        if (!cityName) {
            return errorResponse(res, 400, 'City name is required');
        }

        const cityExists = await City.findOne({ cityName: { $regex: `^${cityName}$`, $options: 'i' } });
        if (cityExists) {
            return errorResponse(res, 400, 'City with this name already exists');
        }

        const city = new City({
            cityName,
            status: status || 'active',
            createdBy: req.admin?._id || null
        });

        await city.save();

        return successResponse(res, 201, 'City created successfully', { city });
    } catch (error) {
        console.error('Error creating city:', error);
        return errorResponse(res, 500, 'Failed to create city');
    }
});

/**
 * Update city
 * PUT /api/admin/cities/:id
 */
export const updateCity = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { cityName, status } = req.body;

        const city = await City.findById(id);
        if (!city) {
            return errorResponse(res, 404, 'City not found');
        }

        if (cityName) {
            const cityExists = await City.findOne({
                cityName: { $regex: `^${cityName}$`, $options: 'i' },
                _id: { $ne: id }
            });
            if (cityExists) {
                return errorResponse(res, 400, 'City with this name already exists');
            }
            city.cityName = cityName;
        }

        if (status) {
            city.status = status;
        }

        await city.save();

        return successResponse(res, 200, 'City updated successfully', { city });
    } catch (error) {
        console.error('Error updating city:', error);
        return errorResponse(res, 500, 'Failed to update city');
    }
});

/**
 * Delete city
 * DELETE /api/admin/cities/:id
 */
export const deleteCity = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const city = await City.findByIdAndDelete(id);
        if (!city) {
            return errorResponse(res, 404, 'City not found');
        }

        // Optional: Check if any hubs are linked to this city before deleting
        // const Hub = mongoose.model('Hub');
        // const hubCount = await Hub.countDocuments({ cityId: id });
        // if (hubCount > 0) return errorResponse(res, 400, 'Cannot delete city with linked hubs');

        return successResponse(res, 200, 'City deleted successfully');
    } catch (error) {
        console.error('Error deleting city:', error);
        return errorResponse(res, 500, 'Failed to delete city');
    }
});
