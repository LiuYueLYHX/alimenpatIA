const db = require('../config/database');

// Buscar notas de mentoria para o supervisor (por equipe)
exports.buscarNotasPorSupervisor = (req, res) => {
    const supervisorId = req.usuario.id;
    const equipeId = req.usuario.id_equipe;

    if (!equipeId) {
        return res.json({ notas: [] });
    }

    const sql = `
        SELECT 
            nm.id_note,
            nm.id_mentor,
            m.nome AS nome_mentor,
            nm.id_equipe,
            e.nome AS nome_equipe,
            nm.id_operador,
            o.nome AS nome_operador,
            nm.mensagem,
            nm.criado_em
        FROM mentorship_notes nm
        JOIN usuarios m ON nm.id_mentor = m.id_usuario
        LEFT JOIN usuarios o ON nm.id_operador = o.id_usuario
        JOIN equipes e ON nm.id_equipe = e.id_equipe
        WHERE nm.id_equipe = ?
        ORDER BY nm.criado_em DESC
    `;

    db.query(sql, [equipeId], (err, resultados) => {
        if (err) {
            console.error('Erro:', err);
            return res.json({ notas: [] });
        }
        res.json({ notas: resultados });
    });
};

// Buscar todas as equipes (para o mentor escolher)
exports.buscarEquipes = (req, res) => {
    const sql = `SELECT id_equipe, nome FROM equipes ORDER BY nome`;
    
    db.query(sql, (err, resultados) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ equipes: resultados });
    });
};

// Buscar operadores de uma equipe específica
exports.buscarOperadoresPorEquipe = (req, res) => {
    const { equipeId } = req.params;
    
    const sql = `
        SELECT 
            u.id_usuario,
            u.nome,
            u.username
        FROM usuarios u
        WHERE u.id_role = 1 AND u.id_equipe = ?
        ORDER BY u.nome
    `;
    
    db.query(sql, [equipeId], (err, resultados) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ operadores: resultados });
    });
};

// Criar nota de mentoria (mentor envia feedback)
exports.criarNotaMentoria = (req, res) => {
    const mentorId = req.usuario.id;
    const { equipeId, operadorId, mensagem } = req.body;
    
    if (!equipeId || !mensagem) {
        return res.status(400).json({ mensagem: 'Equipe e mensagem são obrigatórios' });
    }
    
    const sql = `
        INSERT INTO mentorship_notes (id_mentor, id_equipe, id_operador, mensagem)
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(sql, [mentorId, equipeId, operadorId || null, mensagem], (err, resultado) => {
        if (err) {
            console.error('Erro:', err);
            return res.status(500).json({ erro: err.message });
        }
        
        res.status(201).json({
            mensagem: 'Feedback enviado com sucesso',
            nota: {
                id: resultado.insertId,
                mentorId,
                equipeId,
                operadorId,
                mensagem,
                criadoEm: new Date()
            }
        });
    });
};

// Buscar feedbacks concluídos do supervisor
exports.buscarFeedbacksConcluidos = (req, res) => {
    const supervisorId = req.usuario.id;
    const equipeId = req.usuario.id_equipe;
    
    const sql = `
        SELECT 
            fc.id_feedback,
            fc.id_supervisor,
            s.nome AS nome_supervisor,
            fc.id_equipe,
            e.nome AS nome_equipe,
            fc.conclusao,
            fc.total_notas,
            fc.criado_em
        FROM feedbacks_concluidos fc
        JOIN usuarios s ON fc.id_supervisor = s.id_usuario
        JOIN equipes e ON fc.id_equipe = e.id_equipe
        WHERE fc.id_equipe = ?
        ORDER BY fc.criado_em DESC
    `;
    
    db.query(sql, [equipeId], (err, resultados) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ feedbacks: resultados });
    });
};

// Criar feedback concluído (supervisor finaliza)
exports.criarFeedbackConcluido = (req, res) => {
    const supervisorId = req.usuario.id;
    const equipeId = req.usuario.id_equipe;
    const { conclusao, totalNotas } = req.body;
    
    if (!conclusao) {
        return res.status(400).json({ mensagem: 'Conclusão não pode estar vazia' });
    }
    
    const sql = `
        INSERT INTO feedbacks_concluidos (id_supervisor, id_equipe, conclusao, total_notas)
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(sql, [supervisorId, equipeId, conclusao, totalNotas || 0], (err, resultado) => {
        if (err) return res.status(500).json({ erro: err.message });
        
        res.status(201).json({
            mensagem: 'Conclusão salva com sucesso',
            feedback: {
                id: resultado.insertId,
                supervisorId,
                equipeId,
                conclusao,
                totalNotas: totalNotas || 0,
                criadoEm: new Date()
            }
        });
    });
};