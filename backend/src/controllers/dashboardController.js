const db = require('../config/database');

exports.getDashboard = (req, res) => {
  // ✅ 先定义变量，再使用
  const userRole = req.usuario.role;
  const userTeamId = req.usuario.id_equipe;

  // 调试日志（放在定义之后）
  console.log('=== DASHBOARD DEBUG ===');
  console.log('userRole:', userRole);
  console.log('userTeamId:', userTeamId);

  // 使用数据库中的实际角色名称
  const canSeeAllRoles = ['Administrador', 'Coordenação', 'Conselho de Mentoria'];
  const canSeeAll = canSeeAllRoles.includes(userRole);

  console.log('canSeeAll:', canSeeAll);

  if (canSeeAll) {
    // 高级角色：查看所有记录（不加 WHERE）
    const sqlResumo = `
      SELECT 
        COUNT(*) AS recognizedProducts,
        0 AS unrecognizedProducts,
        COUNT(*) AS teamTotalProducts
      FROM registros
    `;
    
    const sqlPorDia = `
      SELECT 
        DAYOFWEEK(data_registro) AS dia_semana,
        COUNT(*) AS total
      FROM registros
      GROUP BY DAYOFWEEK(data_registro)
    `;

    db.query(sqlResumo, (err, resumoResult) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(sqlPorDia, (err, diasResult) => {
        if (err) return res.status(500).json({ error: err.message });
        sendResponse(resumoResult, diasResult, true, userRole, userTeamId);
      });
    });
  } else {
    // OPERADOR / SUPERVISAO：只查看自己团队的数据
    const sqlResumo = `
      SELECT 
        COUNT(*) AS recognizedProducts,
        0 AS unrecognizedProducts,
        COUNT(*) AS teamTotalProducts
      FROM registros
      WHERE id_equipe = ?
    `;
    
    const sqlPorDia = `
      SELECT 
        DAYOFWEEK(data_registro) AS dia_semana,
        COUNT(*) AS total
      FROM registros
      WHERE id_equipe = ?
      GROUP BY DAYOFWEEK(data_registro)
    `;

    db.query(sqlResumo, [userTeamId], (err, resumoResult) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(sqlPorDia, [userTeamId], (err, diasResult) => {
        if (err) return res.status(500).json({ error: err.message });
        sendResponse(resumoResult, diasResult, false, userRole, userTeamId);
      });
    });
  }

  function sendResponse(resumoResult, diasResult, canSeeAll, userRole, userTeamId) {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const values = [0, 0, 0, 0, 0, 0, 0];

    diasResult.forEach((item) => {
      const index = item.dia_semana - 1;
      values[index] = item.total;
    });

    let acumulado = 0;
    const accumulatedValues = values.map((valor) => {
      acumulado += valor;
      return acumulado;
    });

    const recognizedProducts = resumoResult[0]?.recognizedProducts || 0;
    const unrecognizedProducts = resumoResult[0]?.unrecognizedProducts || 0;
    const teamTotalProducts = resumoResult[0]?.teamTotalProducts || 0;

    let target = 600;
    if (canSeeAll) {
      target = 2000;
    }

    const percentage = target > 0
      ? Math.round((recognizedProducts / target) * 100)
      : 0;

    let subtitle = '';
    if (canSeeAll) {
      subtitle = 'Visão geral de todas as equipes';
    } else if (userRole === 'Operador') {
      subtitle = 'Meu desempenho individual';
    } else {
      subtitle = 'Visão geral da minha equipe';
    }

    res.json({
      title: 'Dashboard',
      subtitle: subtitle,
      summary: {
        recognizedProducts,
        unrecognizedProducts,
        teamTotalProducts
      },
      readingDistribution: {
        recognized: recognizedProducts,
        unrecognized: unrecognizedProducts,
        totalRead: teamTotalProducts
      },
      productsByDay: {
        labels,
        values
      },
      accumulatedEvolution: {
        labels,
        values: accumulatedValues
      },
      teamGoal: {
        current: recognizedProducts,
        target: target,
        percentage: percentage
      },
      userInfo: {
        role: userRole,
        canSeeAll: canSeeAll,
        teamId: userTeamId
      }
    });
  }
};