// Role-based authorization middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        // Always allow guest users
        if (req.user.isGuest) {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }

        next();
    };
};

// Check if user belongs to same department (for HOD)
export const sameDepartment = async (req, res, next) => {
    if (req.user.role === 'director') {
        return next();
    }

    if (req.body.department && req.body.department !== req.user.department) {
        return res.status(403).json({
            success: false,
            message: 'You can only manage resources in your department'
        });
    }

    next();
};

export default authorize;
