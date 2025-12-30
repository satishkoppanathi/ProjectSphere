import mongoose from 'mongoose';

const guestActivitySchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        trim: true
    },
    details: {
        type: Object,
        default: {}
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

guestActivitySchema.index({ timestamp: -1 });
guestActivitySchema.index({ action: 1 });

const GuestActivity = mongoose.model('GuestActivity', guestActivitySchema);

export default GuestActivity;
