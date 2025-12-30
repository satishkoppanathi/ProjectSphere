import express from 'express';
import Project from '../models/Project.js';
import User from '../models/User.js';
import protect from '../middleware/auth.js';
import { authorize } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes require authentication and HOD role
router.use(protect);
router.use(authorize('hod'));

// @route   GET /api/hod/projects
// @desc    Get all department projects
// @access  Private (HOD)
router.get('/projects', async (req, res) => {
    try {
        const { status, sort, search } = req.query;

        let query = { department: req.user.department };

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'title') sortOption = { title: 1 };
        if (sort === 'status') sortOption = { status: 1 };

        const projects = await Project.find(query)
            .populate('submittedBy', 'name email')
            .populate('assignedProfessor', 'name email')
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

// @route   POST /api/hod/projects
// @desc    Create new project
// @access  Private (HOD)
router.post('/projects', async (req, res) => {
    try {
        const projectData = {
            ...req.body,
            department: req.user.department
        };

        const project = await Project.create(projectData);

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

// @route   PUT /api/hod/projects/:id
// @desc    Update project
// @access  Private (HOD)
router.put('/projects/:id', async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (project.department !== req.user.department) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update projects from other departments'
            });
        }

        project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('submittedBy', 'name email')
            .populate('assignedProfessor', 'name email');

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

// @route   DELETE /api/hod/projects/:id
// @desc    Delete project
// @access  Private (HOD)
router.delete('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (project.department !== req.user.department) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete projects from other departments'
            });
        }

        await project.deleteOne();

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

// @route   POST /api/hod/assign
// @desc    Assign project to professor
// @access  Private (HOD)
router.post('/assign', async (req, res) => {
    try {
        const { projectId, professorId } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (project.department !== req.user.department) {
            return res.status(403).json({
                success: false,
                message: 'Cannot assign projects from other departments'
            });
        }

        const professor = await User.findById(professorId);
        if (!professor || professor.role !== 'professor') {
            return res.status(404).json({
                success: false,
                message: 'Professor not found'
            });
        }

        if (professor.department !== req.user.department) {
            return res.status(403).json({
                success: false,
                message: 'Cannot assign to professors from other departments'
            });
        }

        project.assignedProfessor = professorId;
        await project.save();

        const updatedProject = await Project.findById(projectId)
            .populate('assignedProfessor', 'name email')
            .populate('submittedBy', 'name email');

        res.json({
            success: true,
            data: updatedProject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/hod/professors
// @desc    Get department professors
// @access  Private (HOD)
router.get('/professors', async (req, res) => {
    try {
        const professors = await User.find({
            role: 'professor',
            department: req.user.department
        }).select('name email department');

        res.json({
            success: true,
            data: professors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/hod/students
// @desc    Get department students
// @access  Private (HOD)
router.get('/students', async (req, res) => {
    try {
        const students = await User.find({
            role: 'student',
            department: req.user.department
        }).select('name email department');

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/hod/dashboard
// @desc    Get HOD dashboard data
// @access  Private (HOD)
router.get('/dashboard', async (req, res) => {
    try {
        const projects = await Project.find({ department: req.user.department });
        const professors = await User.countDocuments({
            role: 'professor',
            department: req.user.department
        });
        const students = await User.countDocuments({
            role: 'student',
            department: req.user.department
        });

        const stats = {
            totalProjects: projects.length,
            totalProfessors: professors,
            totalStudents: students,
            draft: projects.filter(p => p.status === 'draft').length,
            submitted: projects.filter(p => p.status === 'submitted').length,
            underReview: projects.filter(p => p.status === 'under_review').length,
            approved: projects.filter(p => p.status === 'approved').length,
            rejected: projects.filter(p => p.status === 'rejected').length,
            completed: projects.filter(p => p.status === 'completed').length,
            unassigned: projects.filter(p => !p.assignedProfessor).length
        };

        const recentProjects = await Project.find({ department: req.user.department })
            .populate('submittedBy', 'name')
            .populate('assignedProfessor', 'name')
            .sort({ updatedAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: { stats, recentProjects }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
