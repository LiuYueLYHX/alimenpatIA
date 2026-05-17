const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

router.get('/users', authMiddleware, adminController.listarUsuarios);
router.post('/users', authMiddleware, adminController.criarUsuario);
router.delete('/users/:userId', authMiddleware, adminController.deletarUsuario);
router.put('/users/:userId/role', authMiddleware, adminController.atualizarRole);

module.exports = router;