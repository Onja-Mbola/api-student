const Grade = require('../models/grade.model');
const User = require('../models/user.model');
const dayjs = require('dayjs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const pdf = require('html-pdf');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const getAppreciation = (note) => {
  if(note >= 16) return 'Excellent travail';
  if(note >= 14) return 'Très bien';
  if(note >= 12) return 'Bien';
  if(note >= 10) return 'Satisfaisant';
  if(note >= 8) return 'Insuffisant';
  return 'À améliorer';
};

const generateHTMLBulletin = (user, filteredGrades, average, filter) => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Bulletin de notes</title>
  <style>
    body { font-family: 'Arial', sans-serif; color: #34495e; margin: 0; padding: 20px; background: #f4f6f8; }
    .container { max-width: 700px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    header { text-align: center; margin-bottom: 30px; }
    header img { max-height: 80px; margin-bottom: 10px; }
    header h1 { margin: 0; color: #2c3e50; font-size: 28px; letter-spacing: 2px; }
    .student-info { margin-bottom: 25px; font-size: 16px; }
    .student-info strong { color: #2980b9; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    table thead tr { background-color: #2980b9; color: white; text-align: left; }
    table th, table td { padding: 12px 15px; border: 1px solid #ddd; }
    table tbody tr:nth-child(even) { background-color: #f9f9f9; }
    .average { font-size: 18px; font-weight: bold; color: #27ae60; margin-bottom: 30px; }
    .footer { display: flex; justify-content: space-between; margin-top: 40px; font-size: 14px; color: #7f8c8d; }
    .footer div { text-align: center; width: 45%; }
    .signature { margin-top: 60px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <img src="https://img.freepik.com/vecteurs-libre/creation-logo-lycee-degrade_23-2149626932.jpg?semt=ais_hybrid&w=740" alt="Logo Établissement" />
      <h1>Bulletin de notes</h1>
    </header>

    <section class="student-info">
      <p><strong>Nom :</strong> ${user.lastName || 'Nom'} ${user.firstName || ''}</p>
      <p><strong>Filtre :</strong> ${filter === 'all' ? 'Tous les semestres' : filter}</p>
      <p><strong>Date d’émission :</strong> ${dayjs().format('DD/MM/YYYY')}</p>
    </section>

    <table>
      <thead>
        <tr>
          <th>Cours</th>
          <th>Note / 20</th>
          <th>Date</th>
          <th>Appréciation</th>
        </tr>
      </thead>
      <tbody>
        ${filteredGrades.map(g => `
          <tr>
            <td>${g.course?.name || 'Inconnu'}</td>
            <td style="text-align: center;">${g.grade}</td>
            <td>${dayjs(g.date).format('DD/MM/YYYY')}</td>
            <td>${getAppreciation(g.grade)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <p class="average">Moyenne générale : ${average} / 20</p>

    <div class="footer">
      <div>
        <p>Directeur de l'établissement</p>
        <p class="signature">_Onja Mbola_</p>
      </div>
      <div>
        <p>Professeur principal</p>
        <p class="signature">__Rasoa__</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

const gradeController = {
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const grades = await Grade.find()
                .populate('student')
                .populate('course')
                .skip(skip)
                .limit(limit);

            const totalDocuments = await Grade.countDocuments();

            res.json({
                grades,
                pagination: {
                    totalDocuments,
                    totalPages: Math.ceil(totalDocuments / limit),
                    currentPage: page,
                    pageSize: limit,
                },
            });
        } catch (err) {
            res.status(500).send(err.message);
        }
    },

    getById: async (req, res) => {
        const { id } = req.params;
        try {
            const grade = await Grade.findById(id)
                .populate('student')
                .populate('course');
            res.send(grade);
        } catch (err) {
            res.status(500).send(err.message);
        }
    },

    getByStudentId: async (req, res) => {
        const { id } = req.params;
        try {
            const grades = await Grade.find({ student: id })
                .populate('student')
                .populate('course');
            res.status(200).json(grades);
        } catch (err) {
            res.status(500).send(err.message);
        }
    },

    create: async (req, res) => {
        if (!Array.isArray(req.body)) {
            return res.status(400).send('Body should be an array of grade objects');
        }

        try {
            const gradePromises = req.body.map(gradeData => {
                return new Grade({
                    student: gradeData.student,
                    course: gradeData.course,
                    grade: gradeData.grade,
                    date: gradeData.date ? new Date(gradeData.date) : Date.now()
                }).save();
            });

            const grades = await Promise.all(gradePromises);
            const gradeIds = grades.map(grade => grade._id);
            res.json({ message: `Grades saved with ids ${gradeIds.join(', ')}!` });
        } catch (err) {
            console.error(err);
            res.status(400).send('Cannot post grades: ' + err.message);
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const { student, course, grade, date } = req.body;

        try {
            let updatedGrade = await Grade.findByIdAndUpdate(
                id,
                { student, course, grade, date },
                { new: true, runValidators: true }
            );

            if (!updatedGrade) {
                return res.status(404).send('Grade not found');
            }

            const populatedGrade = await Grade.findById(id)
                .populate('student')
                .populate('course');

            res.json({ message: `Grade updated with id ${id}`, grade: populatedGrade });
        } catch (err) {
            res.status(400).send('Cannot update grade: ' + err.message);
        }
    },

    deleteGrade: async (req, res) => {
        const { id } = req.params;

        try {
            const grade = await Grade.findByIdAndDelete(id);
            if (!grade) {
                return res.status(404).send('Grade not found');
            }
            res.json({ message: `Grade deleted with id ${id}` });
        } catch (err) {
            res.status(400).send('Cannot delete grade: ' + err.message);
        }
    },

    sendBulletinByEmail: async (req, res) => {
    const { userId, filter } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user?.email) {
            return res.status(400).json({ message: 'Email non trouvé pour cet utilisateur.' });
        }

        const allGrades = await Grade.find({ student: userId }).populate('course');
        const filteredGrades = filter === 'all'
            ? allGrades
            : allGrades.filter(g => {
                const d = dayjs(g.date);
                const key = `${d.year()}-${d.month() < 6 ? 'S1' : 'S2'}`;
                return key === filter;
            });

        const average = filteredGrades.length > 0
            ? (
                filteredGrades.reduce((sum, g) => sum + Number(g.grade), 0) / filteredGrades.length
            ).toFixed(2)
            : 'N/A';

        const htmlContent = generateHTMLBulletin(user, filteredGrades, average, filter);

        pdf.create(htmlContent, { format: 'A4', border: { top: '20px', bottom: '20px' } }).toBuffer(async (err, buffer) => {
            if (err) {
                console.error('Erreur génération PDF :', err);
                return res.status(500).json({ message: 'Erreur lors de la génération du PDF.' });
            }

            await transporter.sendMail({
                from: `"Bulletin" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: `Votre bulletin de notes (${filter})`,
                html: htmlContent,
                attachments: [
                    {
                        filename: `Bulletin_${user.lastName}_${filter}.pdf`,
                        content: buffer,
                        contentType: 'application/pdf'
                    }
                ],
            });

            res.status(200).json({ message: 'Bulletin envoyé avec succès !' });
        });

        } catch (err) {
            console.error("Erreur envoi bulletin :", err);
            res.status(500).json({ message: "Erreur lors de l'envoi du bulletin." });
        }
    }
};

module.exports = gradeController;
