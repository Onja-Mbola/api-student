const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { verifyGoogleToken } = require('../utils/google-auth');

const authController = {

    register: async (req, res) => {
        let users = req.body;

        if (!Array.isArray(users)) {
            users = [users];
        }

        try {
            const createdUsers = [];

            for (const userData of users) {
                const { firstName, lastName, email, password, role } = userData;

                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: `Email already in use: ${email}` });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                const newUser = new User({
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    role
                });

                await newUser.save();
                createdUsers.push(newUser);
            }

            res.status(201).json({ message: 'Users registered successfully', users: createdUsers });

        } catch (err) {
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid Password credentials' });
            }

            const token = jwt.sign(
                {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    id: user.id
                },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.json({ token, user });

        } catch (err) {
            res.status(500).json({ message: 'Server Error', error: err.message });
        }
    },

    loginWithGoogle: async (req, res) => {
        const { token: googleToken } = req.body;

        try {
            const payload = await verifyGoogleToken(googleToken);
            const { email, name, given_name, family_name } = payload;

            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    firstName: given_name || name.split(' ')[0],
                    lastName: family_name || name.split(' ')[1] || '',
                    email,
                    password: '',
                    role: 'STUDENT'
                });
            }

            const appToken = jwt.sign(
                {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    id: user.id
                },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.json({ token: appToken, user });

        } catch (error) {
            console.error('Erreur Google login:', error.message);
            res.status(401).json({ message: 'Token Google invalide' });
        }
    }
};

module.exports = authController;
