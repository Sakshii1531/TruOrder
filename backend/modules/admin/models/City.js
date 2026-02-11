import mongoose from 'mongoose';

const citySchema = new mongoose.Schema(
    {
        cityName: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Index for status and city name
citySchema.index({ status: 1 });
citySchema.index({ cityName: 1 });

export default mongoose.model('City', citySchema);
