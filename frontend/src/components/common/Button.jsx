import { motion } from 'framer-motion';
import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    role,
    disabled = false,
    loading = false,
    icon,
    onClick,
    type = 'button',
    className = '',
    ...props
}) => {
    const getVariantClass = () => {
        if (role) return `btn-${role}`;
        return `btn-${variant}`;
    };

    return (
        <motion.button
            type={type}
            className={`btn ${getVariantClass()} btn-${size} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            {...props}
        >
            {loading ? (
                <span className="btn-loader"></span>
            ) : (
                <>
                    {icon && <span className="btn-icon">{icon}</span>}
                    {children}
                </>
            )}
        </motion.button>
    );
};

export default Button;
