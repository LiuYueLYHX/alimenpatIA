const db = require('../config/database');

function normalizarRole(role) {
  const normalizado = role
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .toUpperCase();

  if (normalizado === 'CONSELHO_DE_MENTORIA') {
    return 'CONSELHO_MENTORIA';
  }

  return normalizado;
}

exports.getSettings = (req, res) => {
  const idUsuario = req.usuario.id;

  const sql = `
    SELECT 
      u.id_usuario,
      u.nome,
      u.username,
      r.nome AS role
    FROM usuarios u
    JOIN roles r ON u.id_role = r.id_role
    WHERE u.id_usuario = ?
  `;

  db.query(sql, [idUsuario], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = result[0];
    const role = normalizarRole(user.role);

    res.json({
      user: {
        id: `usr_${String(user.id_usuario).padStart(3, '0')}`,
        name: user.nome,
        username: user.username,
        role
      },
      rolesHierarchy: [
        'OPERADOR',
        'SUPERVISAO',
        'CONSELHO_MENTORIA',
        'COORDENACAO',
        'ADMINISTRADOR'
      ],
      permissions: {
        canAccessAdminPanel: role === 'ADMINISTRADOR',
        canEditOwnName: true,
        canChangePassword: true
      }
    });
  });
};

exports.updateName = (req, res) => {
  const idUsuario = req.usuario.id;
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Nome não pode ser vazio' });
  }
  const sql = `
    UPDATE usuarios 
    SET nome = ? 
    WHERE id_usuario = ?
  `;

  db.query(sql, [name.trim(), idUsuario], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar nome:', err);
      return res.status(500).json({ message: 'Erro interno ao atualizar nome' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ 
      message: 'Nome atualizado com sucesso',
      name: name.trim()
    });
  });
};

exports.updatePassword = (req, res) => {
  const idUsuario = req.usuario.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ 
      message: 'Senha atual e nova senha são obrigatórias' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      message: 'Nova senha deve ter pelo menos 6 caracteres' 
    });
  }

  const checkSql = `
    SELECT senha_hash FROM usuarios 
    WHERE id_usuario = ?
  `;

  db.query(checkSql, [idUsuario], (err, result) => {
    if (err) {
      console.error('Erro ao verificar senha:', err);
      return res.status(500).json({ message: 'Erro interno ao verificar senha' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = result[0];

    if (oldPassword !== user.senha_hash) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    const updateSql = `
      UPDATE usuarios 
      SET senha_hash = ? 
      WHERE id_usuario = ?
    `;

    db.query(updateSql, [newPassword, idUsuario], (err, updateResult) => {
      if (err) {
        console.error('Erro ao atualizar senha:', err);
        return res.status(500).json({ message: 'Erro interno ao atualizar senha' });
      }

      res.json({ message: 'Senha atualizada com sucesso' });
    });
  });
};


