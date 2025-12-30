import { motion } from 'framer-motion';
import './StatusBadge.css';

const statusConfig = {
    draft: {
        label: 'Draft',
        className: 'badge-draft',
        dot: true
    },
    submitted: {
        label: 'Submitted',
        className: 'badge-submitted',
        dot: true
    },
    under_review: {
        label: 'Under Review',
        className: 'badge-review',
        dot: true,
        pulse: true
    },
    approved: {
        label: 'Approved',
        className: 'badge-approved',
        dot: true
    },
    rejected: {
        label: 'Rejected',
        className: 'badge-rejected',
        dot: true
    },
    completed: {
        label: 'Completed',
        className: 'badge-completed',
        dot: true
    }
};

const StatusBadge = ({ status, size = 'md', showDot = true }) => {
    const config = statusConfig[status] || statusConfig.draft;

    return (
        <motion.span
            className={`status-badge ${config.className} status-${size}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            {showDot && config.dot && (
                <span className={`status-dot ${config.pulse ? 'pulse' : ''}`}></span>
            )}
            {config.label}
        </motion.span>
    );
};

export default StatusBadge;
