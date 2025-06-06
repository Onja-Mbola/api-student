const jwt = require('jsonwebtoken');

const authenticateMiddleware = {

    authenticate: (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Access Denied. No token provided.' });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            res.status(400).json({ message: 'Invalid Token' });
        }
    },

    authorizeRoles: (...roles) => {
        return (req, res, next) => {
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Access Denied: Insufficient permissions' });
            }
            next();
        };
    }
}

module.exports = authenticateMiddleware;
