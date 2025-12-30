import express from 'express';
import Project from '../models/Project.js';
import Evaluation from '../models/Evaluation.js';
import protect from '../middleware/auth.js';
import { authorize } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes require authentication and professor role
router.use(protect);
router.use(authorize('professor'));

// @route   GET /api/professors/projects
// @desc    Get assigned projects
// @access  Private (Professor)
router.get('/projects', async (req, res) => {
    try {
        const { status, sort } = req.query;

        let query = { assignedProfessor: req.user.id };

        if (status) {
            query.status = status;
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'title') sortOption = { title: 1 };
        if (sort === 'status') sortOption = { status: 1 };

        const projects = await Project.find(query)
            .populate('submittedBy', 'name email')
            .sort(sortOption);

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

// @route   GET /api/professors/projects/:id
// @desc    Get single project details
// @access  Private (Professor)
router.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('submittedBy', 'name email')
            .populate('assignedProfessor', 'name email');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Allow if assigned OR if project is in professor's department
        const isAssigned = project.assignedProfessor?._id.toString() === req.user.id;
        const isSameDept = project.department === req.user.department;

        if (!isAssigned && !isSameDept) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this project'
            });
        }

        const evaluation = await Evaluation.findOne({
            project: req.params.id,
            evaluator: req.user.id
        });

        res.json({
            success: true,
            data: { project, evaluation }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/professors/evaluate/:id
// @desc    Evaluate a project (any project in professor's department)
// @access  Private (Professor)
router.post('/evaluate/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Allow professors to evaluate projects in their department
        if (project.department !== req.user.department) {
            return res.status(403).json({
                success: false,
                message: 'Can only evaluate projects in your department'
            });
        }

        const { marks, feedback, criteria } = req.body;

        // Check if already evaluated
        let evaluation = await Evaluation.findOne({
            project: req.params.id,
            evaluator: req.user.id
        });

        if (evaluation) {
            // Update existing evaluation
            evaluation.marks = marks;
            evaluation.feedback = feedback;
            evaluation.criteria = criteria;
            evaluation.evaluatedAt = Date.now();
            await evaluation.save();
        } else {
            // Create new evaluation
            evaluation = await Evaluation.create({
                project: req.params.id,
                evaluator: req.user.id,
                marks,
                feedback,
                criteria
            });
        }

        // Update project status
        project.status = 'under_review';
        await project.save();

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

// @route   PUT /api/professors/projects/:id/status
// @desc    Update project status (approve/reject) - any department professor can approve
// @access  Private (Professor)
router.put('/projects/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['approved', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Allow any professor in the same department to update status
        if (project.department !== req.user.department) {
            return res.status(403).json({
                success: false,
                message: 'Can only update projects in your department'
            });
        }

        project.status = status;
        await project.save();

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

// @route   GET /api/professors/rankings
// @desc    Get project rankings
// @access  Private (Professor)
router.get('/rankings', async (req, res) => {
    try {
        const evaluations = await Evaluation.find({ evaluator: req.user.id })
            .populate({
                path: 'project',
                select: 'title submittedBy',
                populate: { path: 'submittedBy', select: 'name' }
            })
            .sort({ marks: -1 });

        // Add rank to each evaluation
        const rankings = evaluations.map((evaluation, index) => ({
            rank: index + 1,
            project: evaluation.project,
            marks: evaluation.marks,
            feedback: evaluation.feedback,
            evaluatedAt: evaluation.evaluatedAt
        }));

        res.json({
            success: true,
            data: rankings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/professors/dashboard
// @desc    Get professor dashboard data - shows all submitted projects in department
// @access  Private (Professor)
router.get('/dashboard', async (req, res) => {
    try {
        // Get projects assigned to this professor
        const assignedProjects = await Project.find({ assignedProfessor: req.user.id });

        // Get ALL submitted projects in the professor's department (for evaluation)
        const departmentProjects = await Project.find({
            department: req.user.department,
            status: { $in: ['submitted', 'under_review', 'approved', 'rejected', 'completed'] }
        });

        const evaluations = await Evaluation.find({ evaluator: req.user.id });
        const evaluatedProjectIds = evaluations.map(e => e.project.toString());

        const stats = {
            totalAssigned: assignedProjects.length,
            departmentProjects: departmentProjects.length,
            evaluated: evaluations.length,
            pending: departmentProjects.filter(p => !evaluatedProjectIds.includes(p._id.toString())).length,
            submitted: departmentProjects.filter(p => p.status === 'submitted').length,
            underReview: departmentProjects.filter(p => p.status === 'under_review').length,
            approved: departmentProjects.filter(p => p.status === 'approved').length,
            rejected: departmentProjects.filter(p => p.status === 'rejected').length
        };

        // Get recent projects from department for evaluation
        const recentProjects = await Project.find({
            department: req.user.department,
            status: { $in: ['submitted', 'under_review', 'approved', 'rejected', 'completed'] }
        })
            .populate('submittedBy', 'name email')
            .sort({ updatedAt: -1 })
            .limit(10);

        // Add evaluation status to each project
        const projectsWithEvaluation = recentProjects.map(project => {
            const hasEvaluated = evaluatedProjectIds.includes(project._id.toString());
            const evaluation = evaluations.find(e => e.project.toString() === project._id.toString());
            return {
                ...project.toObject(),
                hasEvaluated,
                evaluation: evaluation ? {
                    marks: evaluation.marks,
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
