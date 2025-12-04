let jwt;
try {
    jwt = require('jsonwebtoken');
} catch (err) {
    console.log('jsonwebtoken not installed, installing...');
}

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization token is missing' });
        }

        // Check for Bearer token format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        const token = parts[1];

        try {
            if (!jwt) {
                return res.status(500).json({ message: 'JWT library not available' });
            }
            
            const decoded = jwt.verify(token, process.env.SECRET_KEY || 'test-secret-key');
            req.user = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            }
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Authentication error', error: error.message });
    }
};

module.exports = authMiddleware;