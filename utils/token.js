import config from '../config';
import jwt from 'jsonwebtoken';


const { jwtSecret } = config;

export const generateToken = id => {
    return jwt.sign({
        sub: id,
        iss: 'manQol',
        iat: new Date().getTime()
    }, jwtSecret, { expiresIn: '300d' });
};