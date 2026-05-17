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
exports.listarUsuarios = (req, res) => {
  const currentUserId = req.usuario.id;

  const sql = `
    SELECT 
      u.id_usuario,
      u.nome,
      u.username,
      u.id_equipe,
      r.nome AS role
    FROM usuarios u
    JOIN roles r ON u.id_role = r.id_role
    ORDER BY r.nome, u.nome
  `;

  db.query(sql, (err, usuarios) => {
    if (err) return res.status(500).json(err);

    const users = usuarios.map((u) => ({
      id: `usr_${String(u.id_usuario).padStart(3, '0')}`,
      name: u.nome,
      username: u.username,
      role: normalizarRole(u.role),
      id_equipe: u.id_equipe,
      isSelf: u.id_usuario === currentUserId
    }));

    const countByRole = {
      OPERADOR: 0,
      SUPERVISAO: 0,
      CONSELHO_MENTORIA: 0,
      COORDENACAO: 0,
      ADMINISTRADOR: 0
    };

    users.forEach((u) => {
      if (countByRole[u.role] !== undefined) {
        countByRole[u.role]++;
      }
    });

    const currentUser = users.find((u) => u.isSelf);

    res.json({
      currentUser,
      stats: {
        totalUsers: users.length,
        countByRole
      },
      availableRoles: [
        'OPERADOR',
        'SUPERVISAO',
        'CONSELHO_MENTORIA',
        'COORDENACAO',
        'ADMINISTRADOR'
      ],
      creatableRoles: [
        'SUPERVISAO',
        'CONSELHO_MENTORIA',
        'COORDENACAO',
        'ADMINISTRADOR'
      ],
      users
    });
  });
};

exports.criarUsuario = (req, res) => {
  const { name, username, password, role, id_equipe } = req.body;
  const createdBy = req.usuario;

  if (!name || !username || !password) {
  return res.status(400).json({ message: 'Nome, usuário e senha são obrigatórios' });
}

  const roleMap = {
    'OPERADOR': 1,
    'SUPERVISAO': 2,
    'CONSELHO_MENTORIA': 3,
    'COORDENACAO': 4,
    'ADMINISTRADOR': 5
  };

  const id_role = roleMap[role];
  if (!id_role) {
    return res.status(400).json({ message: 'Perfil inválido' });
  }

  const checkSql = 'SELECT id_usuario FROM usuarios WHERE username = ?';
  db.query(checkSql, [username], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erro ao verificar usuário' });
    if (results.length > 0) {
      return res.status(409).json({ message: 'Username já existe' });}
    const insertSql = `
      INSERT INTO usuarios (nome, username, senha_hash, id_role, id_equipe)
      VALUES (?, ?, ?, ?, ?)
    `;

    const id_equipe_value = id_equipe ? parseInt(id_equipe) : null;

        db.query(insertSql, [name, username, password, id_role, id_equipe_value], (err, result) => {
      if (err) {
        console.error('Erro ao criar usuário:', err);
        return res.status(500).json({ message: 'Erro ao criar usuário' });
      }

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        user: {
          id: `usr_${String(result.insertId).padStart(3, '0')}`,
          name: name,
          username: username,
          role: role,
          id_equipe: id_equipe_value
        }
      });
    });
  });
};

exports.deletarUsuario = (req, res) => {
  const { userId } = req.params;
  const currentUser = req.usuario;

  let id = userId;
  if (userId.startsWith('usr_')) {
    id = userId.replace('usr_', '');
  }

  console.log('Deleting user - received:', userId, 'converted to:', id);

  if (id == currentUser.id) {
    return res.status(400).json({ message: 'Você não pode deletar seu próprio usuário' });
  }

  const checkSql = 'SELECT id_usuario FROM usuarios WHERE id_usuario = ?';
  db.query(checkSql, [id], (err, results) => {
    if (err) {
      console.error('Erro ao verificar usuário:', err);
      return res.status(500).json({ message: 'Erro ao verificar usuário' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const deleteSql = 'DELETE FROM usuarios WHERE id_usuario = ?';
    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        console.error('Erro ao deletar usuário:', err);
        return res.status(500).json({ message: 'Erro ao deletar usuário' });
      }

      res.json({ message: 'Usuário deletado com sucesso' });
    });
  });
};

exports.atualizarRole = (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const currentUser = req.usuario;

  if (currentUser.role !== 'ADMINISTRADOR') {
    return res.status(403).json({ message: 'Apenas administradores podem alterar perfis' });
  }

  const roleMap = {
    'OPERADOR': 1,
    'SUPERVISAO': 2,
    'CONSELHO_MENTORIA': 3,
    'COORDENACAO': 4,
    'ADMINISTRADOR': 5
  };

  const id_role = roleMap[role];
  if (!id_role) {
    return res.status(400).json({ message: 'Perfil inválido' });
  }

  if (userId == currentUser.id) {
    return res.status(400).json({ message: 'Você não pode alterar seu próprio perfil' });
  }

    const sql = 'UPDATE usuarios SET id_role = ? WHERE id_usuario = ?';
  db.query(sql, [id_role, userId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar role:', err);
      return res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ message: 'Perfil atualizado com sucesso' });
  });
};