const db = require('../config/database');

exports.criarEquipe = (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Nome da equipe é obrigatório' });
  }

  const checkSql = 'SELECT id_equipe FROM equipes WHERE nome = ?';
  db.query(checkSql, [name.trim()], (err, results) => {
    if (err) {
      console.error('Erro ao verificar equipe:', err);
      return res.status(500).json({ message: 'Erro ao verificar equipe' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ message: 'Equipe já existe' });
    }

    const insertSql = 'INSERT INTO equipes (nome) VALUES (?)';
    db.query(insertSql, [name.trim()], (err, result) => {
      if (err) {
        console.error('Erro ao criar equipe:', err);
        return res.status(500).json({ message: 'Erro ao criar equipe' });
      }

      res.status(201).json({
        message: 'Equipe criada com sucesso',
        team: {
          id: result.insertId.toString(),
          name: name.trim()
        }
      });
    });
  });
};


exports.listarEquipes = (req, res) => {
  const sql = 'SELECT id_equipe, nome FROM equipes ORDER BY nome';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar equipes:', err);
      return res.status(500).json({ message: 'Erro ao buscar equipes' });
    }
    
    const teams = results.map(team => ({
      id: team.id_equipe.toString(),
      name: team.nome
    }));
    
    res.json({ teams });
  });
};

exports.deletarEquipe = (req, res) => {
    const { teamId } = req.params;
    const checkSql = 'SELECT COUNT(*) as count FROM usuarios WHERE id_equipe = ?';
    db.query(checkSql, [teamId], (err, results) => {
        if (err) {
            console.error('Erro ao verificar equipe:', err);
            return res.status(500).json({ message: 'Erro ao verificar equipe' });
        }

    const userCount = results[0].count;
    if (userCount > 0) {
      return res.status(400).json({ 
        message: `Não é possível excluir: esta equipe possui ${userCount} usuário(s). Remova-os primeiro.` 
      });
    }

    const deleteSql = 'DELETE FROM equipes WHERE id_equipe = ?';
    db.query(deleteSql, [teamId], (err, result) => {
      if (err) {
        console.error('Erro ao deletar equipe:', err);
        return res.status(500).json({ message: 'Erro ao deletar equipe' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Equipe não encontrada' });
      }

      res.json({ message: 'Equipe deletada com sucesso' });
    });
  });
};