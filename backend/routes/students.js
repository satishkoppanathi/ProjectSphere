import express from 'express';
import Project from '../models/Project.js';
import Submission from '../models/Submission.js';
import Evaluation from '../models/Evaluation.js';
import protect from '../middleware/auth.js';
import { authorize } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes require authentication and student role
router.use(protect);
router.use(authorize('student'));

// @route   GET /api/students/projects
// @desc    Get student's projects
// @access  Private (Student)
router.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find({ submittedBy: req.user.id })
            .populate('assignedProfessor', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @access  Private (Student)
router.post('/projects', async (req, res) => {
    try {
        const { title, description, teamMembers, githubLink, liveLink, documentationLink } = req.body;

        const project = await Project.create({
            title,
            description,
            department: req.body.department || req.user.department,
            submittedBy: req.user.id === 'guest' ? null : req.user.id,
            isGuest: req.user.id === 'guest',
            guestDetails: req.user.id === 'guest' ? {
                name: req.body.guestName || 'Anonymous Guest',
                email: req.body.guestEmail || ''
            } : null,
            teamMembers,
            githubLink,
            liveLink,
            documentationLink,
            status: 'draft'
        });

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/students/projects/:id
// @desc    Get single project
// @access  Private (Student)
router.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('assignedProfessor', 'name email');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Make sure user owns the project (GUESTS CAN SEE GUEST PROJECTS)
        if (!req.user.isGuest && project.submittedBy && project.submittedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this project'
            });
        }

        if (req.user.isGuest && !project.isGuest) {
            return res.status(403).json({
                success: false,
                message: 'Guests can only view guest projects'
            });
        }

        // Get evaluation if exists
        const evaluation = await Evaluation.findOne({ project: project._id })
            .populate('evaluator', 'name');

        const projectData = {
            ...project.toObject(),
            evaluation: evaluation ? {
                marks: evaluation.marks,
                feedback: evaluation.feedback,
                criteria: evaluation.criteria,
                evaluator: evaluation.evaluator,
                evaluatedAt: evaluation.evaluatedAt
            } : null
        };

        res.json({
            success: true,
            data: projectData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/students/projects/:id
// @desc    Update project
// @access  Private (Student)
router.put('/projects/:id', async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Make sure user owns the project
        if (project.submittedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this project'
            });
        }

        // Can only update if not yet approved/completed
        if (['approved', 'completed'].includes(project.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update approved or completed projects'
            });
        }

        project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/students/projects/:id
// @desc    Delete project
// @access  Private (Student)
router.delete('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Make sure user owns the project
        if (project.submittedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this project'
            });
        }

        // Can only delete if in draft status
        if (project.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete draft projects'
            });
        }

        await Project.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/students/projects/:id/submit
// @desc    Submit project for review
// @access  Private (Student)
router.post('/projects/:id/submit', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const isAuthorized = req.user.isGuest ? project.isGuest : (project.submittedBy && project.submittedBy.toString() === req.user.id);

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to submit this project'
            });
        }

        // Update status to submitted
        project.status = 'submitted';
        await project.save();

        // Create submission record
        const submission = await Submission.create({
            project: project._id,
            submittedBy: req.user.id === 'guest' ? null : req.user.id,
            notes: req.body.notes
        });

        res.json({
            success: true,
            data: { project, submission }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/students/projects/:id/evaluation
// @desc    Get project evaluation/feedback
// @access  Private (Student)
router.get('/projects/:id/evaluation', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (project.submittedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this evaluation'
            });
        }

        const evaluation = await Evaluation.findOne({ project: req.params.id })
            .populate('evaluator', 'name email');

        res.json({
            success: true,
            data: evaluation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/students/dashboard
// @desc    Get student dashboard data
// @access  Private (Student)
router.get('/dashboard', async (req, res) => {
    try {
        const query = req.user.isGuest ? { isGuest: true } : { submittedBy: req.user.id };
        const projects = await Project.find(query);

        // Get evaluations for all user's projects
        const projectIds = projects.map(p => p._id);
        const evaluations = await Evaluation.find({ project: { $in: projectIds } })
            .populate('evaluator', 'name');

        const stats = {
            total: projects.length,
            draft: projects.filter(p => p.status === 'draft').length,
            // Submitted = all projects that are not drafts (have been submitted)
            submitted: projects.filter(p => p.status !== 'draft').length,
            underReview: projects.filter(p => p.status === 'under_review').length,
            approved: projects.filter(p => p.status === 'approved').length,
            rejected: projects.filter(p => p.status === 'rejected').length,
            completed: projects.filter(p => p.status === 'completed').length,
            evaluated: evaluations.length
        };

        const recentProjects = await Project.find(query)
            .populate('assignedProfessor', 'name')
            .sort({ updatedAt: -1 })
            .limit(10);

        // Add evaluation data to each project
        const projectsWithEvaluation = recentProjects.map(project => {
            const evaluation = evaluations.find(e => e.project.toString() === project._id.toString());
            return {
                ...project.toObject(),
                evaluation: evaluation ? {
                    marks: evaluation.marks,
                    feedback: evaluation.feedback,
                    criteria: evaluation.criteria,
                    evaluator: evaluation.evaluator,
                    evaluatedAt: evaluation.evaluatedAt
                } : null
            };
        });

        res.json({
            success: true,
            data: { stats, recentProjects: projectsWithEvaluation }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
