const Course = require('../models/course.model');

const courseController = {
    getAll: async (req, res) => {
        try {
            const courses = await Course.find();
            res.send(courses);
        } catch (err) {
            res.status(500).send("Erreur serveur lors de la récupération des cours : " + err.message);
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        try {
            const course = await Course.findById(id);
            if (!course) {
                return res.status(404).send("Cours non trouvé");
            }
            res.send(course);
        } catch (err) {
            res.status(500).send("Erreur serveur lors de la récupération du cours : " + err.message);
        }
    },

    create: async (req, res) => {
        const { name, code } = req.body;
        try {
            const course = new Course({ name, code });
            await course.save();
            res.json(course);
        } catch (err) {
            res.status(400).send("Impossible de créer le cours : " + err.message);
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const { name, code } = req.body;
        try {
            const updatedCourse = await Course.findByIdAndUpdate(
                id,
                { name, code },
                { new: true, runValidators: true }
            );
            if (!updatedCourse) {
                return res.status(404).send("Cours non trouvé");
            }
            res.json({
                message: "Cours mis à jour avec succès",
                course: updatedCourse
            });
        } catch (err) {
            res.status(500).send("Impossible de mettre à jour le cours : " + err.message);
        }
    },

    deleteCourse: async (req, res) => {
        const { id } = req.params;
        try {
            const deletedCourse = await Course.findByIdAndDelete(id);
            if (!deletedCourse) {
                return res.status(404).send("Cours non trouvé");
            }
            res.json({
                message: "Cours supprimé avec succès",
                course: deletedCourse
            });
        } catch (err) {
            res.status(500).send("Impossible de supprimer le cours : " + err.message);
        }
    }
};

module.exports = courseController;
