import { motion } from 'framer-motion';
import './Card.css';

const Card = ({
    children,
    className = '',
    role,
    hover = true,
    onClick,
    animate = true,
    delay = 0,
    ...props
}) => {
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                delay,
                ease: 'easeOut'
            }
        }
    };

    const hoverVariants = hover ? {
        whileHover: {
            y: -4,
            transition: { duration: 0.2 }
        }
    } : {};

    return (
        <motion.div
            className={`card glass-card ${role ? `card-${role}` : ''} ${className}`}
            variants={animate ? cardVariants : undefined}
            initial={animate ? 'hidden' : undefined}
            animate={animate ? 'visible' : undefined}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            {...hoverVariants}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const CardHeader = ({ children, className = '' }) => (
    <div className={`card-header ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
    <div className={`card-body ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
    <div className={`card-footer ${className}`}>{children}</div>
);

export default Card;
