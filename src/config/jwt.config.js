const fs = require('fs');
const path = require('path');

/**
 * Load RSA keys and create JWT configuration
 */
const loadJWTKeys = () => {
    const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || path.join(__dirname, '../../keys/private.pem');
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || path.join(__dirname, '../../keys/public.pem');

    try {
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        console.log('✅ JWT RSA keys loaded successfully');
        return { privateKey, publicKey };
    } catch (error) {
        console.error('❌ Failed to load JWT keys:', error.message);
        console.error('Make sure to generate RSA keys first:');
        console.error('openssl genrsa -out keys/private.pem 2048');
        console.error('openssl rsa -in keys/private.pem -pubout -out keys/public.pem');
        throw new Error('JWT keys not found. Please generate RSA key pair first.');
    }
};

// Load keys
const { privateKey, publicKey } = loadJWTKeys();

/**
 * JWT Configuration object
 */
const jwtConfig = {
    privateKey,
    publicKey,
    algorithm: 'RS256', // RSA with SHA-256
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'smart-note-app',
    audience: 'smart-note-app-users'
};

/**
 * Get signing options for JWT creation
 * @param {string} jti - JWT ID for token tracking
 * @param {string} subject - User ID
 * @returns {Object} Signing options
 */
const getSignOptions = (jti, subject) => ({
    algorithm: jwtConfig.algorithm,
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    jwtid: jti, // Unique token identifier for revocation
    subject: subject, // User ID
    audience: jwtConfig.audience
});

/**
 * Get verification options for JWT validation
 * @returns {Object} Verification options
 */
const getVerifyOptions = () => ({
    algorithms: [jwtConfig.algorithm],
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    complete: true // Return header, payload, and signature
});

module.exports = {
    ...jwtConfig,
    getSignOptions,
    getVerifyOptions
};
