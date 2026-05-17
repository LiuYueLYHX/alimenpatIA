const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const feedbackController = require('../controllers/feedbackController');

// Rotas para Supervisor
router.get('/notas/supervisor', authMiddleware, feedbackController.buscarNotasPorSupervisor);
router.get('/feedbacks/concluidos', authMiddleware, feedbackController.buscarFeedbacksConcluidos);
router.post('/feedbacks/concluidos', authMiddleware, feedbackController.criarFeedbackConcluido);

// Rotas para Mentor (Conselho de Mentoria)
router.get('/equipes', authMiddleware, feedbackController.buscarEquipes);
router.get('/equipes/:equipeId/operadores', authMiddleware, feedbackController.buscarOperadoresPorEquipe);
router.post('/notas', authMiddleware, feedbackController.criarNotaMentoria);

module.exports = router;