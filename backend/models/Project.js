import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a project title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [3000, 'Description cannot be more than 3000 characters']
    },
    department: {
        type: String,
        required: [true, 'Please specify a department'],
        enum: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Technology']
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed'],
        default: 'draft'
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Changed from true to allow guest submissions
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    guestDetails: {
        name: String,
        email: String
    },
    teamMembers: [{
        name: String,
        email: String,
        rollNumber: String
    }],
    assignedProfessor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deadline: {
        type: Date
    },
    files: [{
        filename: String,
        originalName: String,
        path: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    githubLink: {
        type: String,
        trim: true
    },
    liveLink: {
        type: String,
        trim: true
    },
    documentationLink: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
projectSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for efficient queries
projectSchema.index({ department: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ submittedBy: 1 });
projectSchema.index({ assignedProfessor: 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
