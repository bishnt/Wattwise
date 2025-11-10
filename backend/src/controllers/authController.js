const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
}

exports.register = async (req, res) => {
    try {
        const { email, password, name, household_id, tariff_rate } = req.body;

        const existingUser = await User.findByEmail(email);
        if(existingUser) {
            return res.status(400).json({ error : 'user already exists'})
        }

        const user = await User.create({
            email,
            password,
            name,
            household_id,
            tariff_rate,
        });

        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    hame: user.name,
                    household_id: user.household_id,
                },
                token,
            },
        })
    } catch(error){
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration'});
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if(!user) {
            return res.status(401).json({erroe: 'Invalid Credential'});
        }

        const isMatch = await User.verifyPassword(password, user.password_hash);
        if(!isMatch){
            return res.status(401).json({error: 'Invalid credentials'});
        }

        const token = generateToken(user.id);

        res.json({
            success: true,
            data: {
                user : {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    household_id: user.household_id,
                },
                token,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login'});
    }
};

exports.getMe = async ( req, res) => {
    res.json({
        success: true,
        data: req.user,
    });
};