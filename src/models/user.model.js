const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['ADMIN', 'SCOLARITE', 'STUDENT'],
        required: true
    },
    id: { type: Number, unique: true, sparse: true },
}, { timestamps: true });

userSchema.pre('validate', async function (next) {
    if (this.role === 'STUDENT') {
        if (this.isNew && this.id == null) {
            const lastStudent = await mongoose.model('User').findOne(
                { role: 'STUDENT' },
                {},
                {
                    sort: { id: -1 }
                });

            this.id = lastStudent ? lastStudent.id + 1 : 1;
        }
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
