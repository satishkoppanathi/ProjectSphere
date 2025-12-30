import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    version: {
        type: Number,
        default: 1
    },
    files: [{
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimeType: String
    }],
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot be more than 1000 characters']
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-increment version for same project
submissionSchema.pre('save', async function (next) {
    if (this.isNew) {
        const lastSubmission = await this.constructor
            .findOne({ project: this.project })
            .sort({ version: -1 });

        if (lastSubmission) {
            this.version = lastSubmission.version + 1;
        }
    }
    next();
});

// Indexes
submissionSchema.index({ project: 1 });
submissionSchema.index({ submittedBy: 1 });
submissionSchema.index({ submittedAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
