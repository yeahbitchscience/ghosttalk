const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided.' });
  
  const tokenParts = token.split(' ');
  const tokenString = tokenParts.length > 1 ? tokenParts[1] : token;

  jwt.verify(tokenString, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized.' });
    req.userId = decoded.id;
    next();
  });
};

const verifyTokenSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
};

module.exports = { verifyToken, verifyTokenSocket };
