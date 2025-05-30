const User = require('../models/user.model');

const userController = {
    getUserByEmail: async (req, res) => {
        const { email } = req.params;

        try {
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json(user);

        } catch (err) {
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const filters = {};

            if (req.query.role) {
                filters.role = req.query.role;
            }

            if (req.query.keyword) {
                const keyword = req.query.keyword;
                filters.$or = [
                    { firstName: new RegExp(keyword, 'i') },
                    { lastName: new RegExp(keyword, 'i') },
                    { email: new RegExp(keyword, 'i') }
                ];
            }

            // Pipeline commun
            const basePipeline = [
                { $match: filters },
                {
                    $addFields: {
                        roleOrder: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$role', 'ADMIN'] }, then: 0 },
                                    { case: { $eq: ['$role', 'SCOLARITE'] }, then: 1 },
                                    { case: { $eq: ['$role', 'STUDENT'] }, then: 2 },
                                ],
                                default: 3
                            }
                        }
                    }
                },
                { $sort: req.query.role === 'STUDENT' ? { id: 1 } : { roleOrder: 1 } }
            ];

            // Pipeline paginé
            const paginatedPipeline = [
                ...basePipeline,
                { $skip: skip },
                { $limit: limit }
            ];

            const [users, countResult] = await Promise.all([
                User.aggregate(paginatedPipeline),
                User.aggregate([
                    ...basePipeline,
                    { $count: 'total' }
                ])
            ]);

            const totalDocuments = countResult[0]?.total || 0;

            res.json({
                users,
                pagination: {
                    totalDocuments,
                    totalPages: Math.ceil(totalDocuments / limit),
                    currentPage: page,
                    pageSize: limit,
                }
            });

        } catch (err) {
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    },

    getAllStudents: async (req, res) => {
        try {
            const students = await User.find({ role: 'STUDENT' });
            res.json(students);
        } catch (err) {
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    },

    getUserById: async (req, res) => {
        const { id } = req.params;
        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (err) {
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    },

    updateUser: async (req, res) => {
        const { id } = req.params;
        const updates = req.body;

        try {
            const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'User updated successfully', user });

        } catch (err) {
            res.status(400).json({ message: 'Cannot update user', error: err.message });
        }
    },

    deleteUser: async (req, res) => {
        const { id } = req.params;

        try {
            const user = await User.findByIdAndDelete(id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'User deleted successfully', user });

        } catch (err) {
            res.status(500).json({ message: 'Cannot delete user', error: err.message });
        }
    }

};

module.exports = userController;