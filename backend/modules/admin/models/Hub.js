import mongoose from 'mongoose';

const hubSchema = new mongoose.Schema(
    {
        cityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            required: true,
            index: true
        },
        hubName: {
            type: String,
            required: true,
            trim: true
        },
        hubArea: {
            type: String,
            trim: true
        },
        serviceablePincodes: [{
            type: String,
            trim: true
        }],
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

// Compound index for unique hub name within a city
hubSchema.index({ cityId: 1, hubName: 1 }, { unique: true });
hubSchema.index({ serviceablePincodes: 1 });
hubSchema.index({ status: 1 });

export default mongoose.model('Hub', hubSchema);
