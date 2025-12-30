import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiHome,
    FiFolder,
    FiUsers,
    FiBarChart2,
    FiSettings,
    FiLogOut,
    FiMenu,
    FiX,
    FiUser,
    FiCheckCircle,
    FiFileText,
    FiAward
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const roleConfig = {
    student: {
        color: 'student',
        icon: FiUser,
        title: 'Student Portal',
        links: [
            { to: '/student/dashboard', icon: FiHome, label: 'Dashboard' },
            { to: '/student/projects', icon: FiFolder, label: 'My Projects' },
            { to: '/student/submissions', icon: FiFileText, label: 'Submissions' },
            { to: '/student/results', icon: FiAward, label: 'Results' },
            { to: '/student/analytics', icon: FiBarChart2, label: 'Analytics' }
        ]
    },
    professor: {
        color: 'professor',
        icon: FiUser,
        title: 'Professor Portal',
        links: [
            { to: '/professor/dashboard', icon: FiHome, label: 'Dashboard' },
            { to: '/professor/projects', icon: FiFolder, label: 'Assigned Projects' },
            { to: '/professor/evaluate', icon: FiCheckCircle, label: 'Evaluate' },
            { to: '/professor/rankings', icon: FiAward, label: 'Rankings' },
            { to: '/professor/analytics', icon: FiBarChart2, label: 'Analytics' }
        ]
    },
    hod: {
        color: 'hod',
        icon: FiUser,
        title: 'HOD Portal',
        links: [
            { to: '/hod/dashboard', icon: FiHome, label: 'Dashboard' },
            { to: '/hod/projects', icon: FiFolder, label: 'All Projects' },
            { to: '/hod/assignments', icon: FiUsers, label: 'Assign Projects' },
            { to: '/hod/analytics', icon: FiBarChart2, label: 'Analytics' }
        ]
    },
    director: {
        color: 'director',
        icon: FiUser,
        title: 'Director Portal',
        links: [
            { to: '/director/dashboard', icon: FiHome, label: 'Dashboard' },
            { to: '/director/analytics', icon: FiBarChart2, label: 'Analytics' },
            { to: '/director/departments', icon: FiUsers, label: 'Departments' },
            { to: '/director/reports', icon: FiFileText, label: 'Reports' }
        ]
    }
};

const Sidebar = ({ isOpen, onToggle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Detect role from URL for guest mode
    const getRoleFromUrl = () => {
        const path = window.location.pathname;
        if (path.includes('/student')) return 'student';
        if (path.includes('/professor')) return 'professor';
        if (path.includes('/hod')) return 'hod';
        if (path.includes('/director')) return 'director';
        return 'student';
    };

    const currentRole = user?.role || getRoleFromUrl();
    const isGuest = !user;
    const config = roleConfig[currentRole] || roleConfig.student;

    const handleLogout = () => {
        if (isGuest) {
            navigate('/');
        } else {
            logout();
            navigate('/');
        }
    };

    const sidebarVariants = {
        open: { x: 0 },
        closed: { x: -280 }
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <motion.div
                    className="sidebar-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onToggle}
                />
            )}

            <motion.aside
                className={`sidebar sidebar-${config.color}`}
                initial={false}
                animate={isOpen ? 'open' : 'closed'}
                variants={sidebarVariants}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Logo/Header */}
                <div className="sidebar-header">
                    <div className={`sidebar-logo logo-${config.color}`}>
                        <config.icon size={24} />
                    </div>
                    <div className="sidebar-brand">
                        <span className="sidebar-title">{config.title}</span>
                        <span className="sidebar-subtitle">{user?.department || 'University'}</span>
                    </div>
                    <button className="sidebar-close" onClick={onToggle}>
                        <FiX size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <ul className="sidebar-menu">
                        {config.links.map((link, index) => (
                            <motion.li
                                key={link.to}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `sidebar-link ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <link.icon size={20} />
                                    <span className="sidebar-text">{link.label}</span>
                                </NavLink>
                            </motion.li>
                        ))}
                    </ul>
                </nav>

                {/* User section */}
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className={`sidebar-avatar avatar-${config.color}`}>
                            {isGuest ? 'G' : (user?.name?.charAt(0) || 'U')}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{isGuest ? 'Guest User' : user?.name}</span>
                            <span className="sidebar-user-role">{isGuest ? 'Guest Mode' : user?.role}</span>
                        </div>
                    </div>
                    <button className="sidebar-logout" onClick={handleLogout}>
                        <FiLogOut size={18} />
                        <span className="sidebar-text">{isGuest ? 'Exit' : 'Logout'}</span>
                    </button>
                </div>
            </motion.aside>

            {/* Mobile toggle button */}
            <button className="sidebar-toggle" onClick={onToggle}>
                <FiMenu size={24} />
            </button>
        </>
    );
};

export default Sidebar;
