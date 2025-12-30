import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    evaluator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    marks: {
        type: Number,
        required: [true, 'Please add marks'],
        min: [0, 'Marks cannot be negative'],
        max: [100, 'Marks cannot exceed 100']
    },
    feedback: {
        type: String,
        required: [true, 'Please provide feedback'],
        maxlength: [2000, 'Feedback cannot be more than 2000 characters']
    },
    criteria: {
        innovation: {
            type: Number,
            min: 0,
            max: 20,
            default: 0
        },
        implementation: {
            type: Number,
            min: 0,
            max: 25,
            default: 0
        },
        documentation: {
            type: Number,
            min: 0,
            max: 15,
            default: 0
        },
        presentation: {
            type: Number,
            min: 0,
            max: 20,
            default: 0
        },
        teamwork: {
            type: Number,
            min: 0,
            max: 20,
            default: 0
        }
    },
    rank: {
        type: Number
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'completed'
    },
    evaluatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one evaluation per project per evaluator
evaluationSchema.index({ project: 1, evaluator: 1 }, { unique: true });
evaluationSchema.index({ evaluator: 1 });
evaluationSchema.index({ marks: -1 });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

export default Evaluation;
