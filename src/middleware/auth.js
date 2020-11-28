const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET) // get the payload {id: 'dasda3432423', iat: '542423423'}
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token }) // 'tokens.token' → will find in array of tokens, foreach

        if (! user) {
            throw new Error();
        }

        req.token = token
        req.user = user

    } catch (e) {
        res.status(401).send({ error: 'Please authenticate.' })
    }

    next();
}

const isAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET) // get the payload {id: 'dasda3432423', iat: '542423423'}
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token, 'role': 'admin' }) // 'tokens.token' → will find in array of tokens, foreach

        if (! user) throw new Error();

        req.token = token
        req.user = user

    } catch (e) {
        return res.status(401).send({ error: 'Unable to proceed.' })
    }

    next();
}

module.exports = {
    auth,
    isAdmin
}