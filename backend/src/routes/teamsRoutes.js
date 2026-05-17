const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const teamsController = require('../controllers/teamsController');

router.post('/', authMiddleware, teamsController.criarEquipe);
router.get('/', authMiddleware, teamsController.listarEquipes);
router.delete('/:teamId', authMiddleware, teamsController.deletarEquipe);

module.exports = router;