import express from 'express';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Evaluation from '../models/Evaluation.js';
import protect from '../middleware/auth.js';
import { authorize } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes require authentication and director role
router.use(protect);
router.use(authorize('director'));

// @route   GET /api/director/analytics
// @desc    Get university-wide analytics
// @access  Private (Director)
router.get('/analytics', async (req, res) => {
    try {
        const totalProjects = await Project.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalProfessors = await User.countDocuments({ role: 'professor' });
        const totalHODs = await User.countDocuments({ role: 'hod' });

        // Status breakdown
        const statusBreakdown = await Project.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Department-wise distribution
        const departmentDistribution = await Project.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);

        // Monthly project submissions (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySubmissions = await Project.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Completion rate
        const completedProjects = await Project.countDocuments({ status: 'completed' });
        const completionRate = totalProjects > 0
            ? Math.round((completedProjects / totalProjects) * 100)
            : 0;

        // Average marks by department
        const avgMarksByDept = await Evaluation.aggregate([
            {
                $lookup: {
                    from: 'projects',
                    localField: 'project',
                    foreignField: '_id',
                    as: 'projectData'
                }
            },
            { $unwind: '$projectData' },
            {
                $group: {
                    _id: '$projectData.department',
                    avgMarks: { $avg: '$marks' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalProjects,
                    totalStudents,
                    totalProfessors,
                    totalHODs,
                    completionRate
                },
                statusBreakdown: statusBreakdown.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                departmentDistribution: departmentDistribution.map(d => ({
                    department: d._id,
                    count: d.count
                })),
                monthlySubmissions: monthlySubmissions.map(m => ({
                    month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
                    count: m.count
                })),
                avgMarksByDept: avgMarksByDept.map(d => ({
                    department: d._id,
                    avgMarks: Math.round(d.avgMarks * 10) / 10
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/director/departments
// @desc    Get department details
// @access  Private (Director)
router.get('/departments', async (req, res) => {
    try {
        const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Technology'];

        const departmentStats = await Promise.all(
            departments.map(async (dept) => {
                const projects = await Project.countDocuments({ department: dept });
                const students = await User.countDocuments({ role: 'student', department: dept });
                const professors = await User.countDocuments({ role: 'professor', department: dept });
                const completed = await Project.countDocuments({ department: dept, status: 'completed' });

                return {
                    name: dept,
                    projects,
                    students,
                    professors,
                    completed,
                    completionRate: projects > 0 ? Math.round((completed / projects) * 100) : 0
                };
            })
        );

        res.json({
            success: true,
            data: departmentStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/director/projects
// @desc    Get all university projects
// @access  Private (Director)
router.get('/projects', async (req, res) => {
    try {
        const { department, status, limit = 50, page = 1 } = req.query;

        let query = {};
        if (department) query.department = department;
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const projects = await Project.find(query)
            .populate('submittedBy', 'name email')
            .populate('assignedProfessor', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Project.countDocuments(query);

        res.json({
            success: true,
            count: projects.length,
            total,
            pages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/director/top-projects
// @desc    Get top performing projects
// @access  Private (Director)
router.get('/top-projects', async (req, res) => {
    try {
        const topProjects = await Evaluation.find()
            .populate({
                path: 'project',
                populate: [
                    { path: 'submittedBy', select: 'name' },
                    { path: 'assignedProfessor', select: 'name' }
                ]
            })
            .populate('evaluator', 'name')
            .sort({ marks: -1 })
            .limit(10);

        res.json({
            success: true,
            data: topProjects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/director/dashboard
// @desc    Get director dashboard summary
// @access  Private (Director)
router.get('/dashboard', async (req, res) => {
    try {
        const [
            totalProjects,
            completedProjects,
            ongoingProjects,
            pendingProjects,
            totalStudents,
            totalProfessors
        ] = await Promise.all([
            Project.countDocuments(),
            Project.countDocuments({ status: 'completed' }),
            Project.countDocuments({ status: { $in: ['submitted', 'under_review', 'approved'] } }),
            Project.countDocuments({ status: 'draft' }),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'professor' })
        ]);

        const recentProjects = await Project.find()
            .populate('submittedBy', 'name')
            .populate('assignedProfessor', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                stats: {
                    totalProjects,
                    completedProjects,
                    ongoingProjects,
                    pendingProjects,
                    totalStudents,
                    totalProfessors,
                    completionRate: totalProjects > 0
                        ? Math.round((completedProjects / totalProjects) * 100)
                        : 0
                },
                recentProjects
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
