const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Funções para carregar e salvar os dados em data.json
const dataFilePath = path.join(__dirname, 'data.json');

function loadPersistedData() {
  if (fs.existsSync(dataFilePath)) {
    const content = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(content);
  } else {
    // Estrutura inicial dos dados
    const defaultData = {
      seasonData: {
        endTime: Date.now() + (9 * 24 * 60 * 60 * 1000) + (13 * 60 * 60 * 1000), // 9d13h
        members: [],
        weeklyDonations: {}
      },
      seasonHistory: [],
      weeklyHistory: []
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

function savePersistedData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Carrega os dados persistidos
let persistedData = loadPersistedData();
let seasonData = persistedData.seasonData;
let seasonHistory = persistedData.seasonHistory;
let weeklyHistory = persistedData.weeklyHistory || [];

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API Key e URL base
const KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjhiNGFjYmM2LWQ1MDgtNGM5Yy1iODFjLTQzZTg1MjBhMDJlOCIsImlhdCI6MTczOTYzNjk0NSwic3ViIjoiZGV2ZWxvcGVyL2UyYzE5ZTJjLTM2OGQtYmJjOC1hOTY4LTdjYzZjZjMwNjY2MCIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjIxMy4yMTQuNTUiLCIxODYuMjMzLjE2OC41OCJdLCJ0eXBlIjoiY2xpZW50In1dfQ.yljOGKXjBdk6EjL8jlJfHntj3Q6VsvjyZEw1eGu3zMljoHEiC6uYVNHvR9HxRwsPTkh8A5rwvu_4C9k4TJCb_A";
const BASE_URL = "https://api.clashofclans.com/v1/clans/";

// Rota GET: Página inicial
app.get('/', async (req, res) => {
  // Busca o clã whitelisted para exibir o badge no card menor
  const allowedTag = "#LY2RGCYU";
  const encodedTag = allowedTag.replace("#", "%23");
  let featuredData = null;

  try {
    const clanUrl = BASE_URL + encodedTag;
    const response = await fetch(clanUrl, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${KEY}`
      }
    });
    if (response.ok) {
      featuredData = await response.json();
    }
  } catch (err) {
    console.error("Erro ao buscar dados do clã whitelisted:", err);
  }

  // Na tela inicial: card menor sim (showFeaturedCard = true), card maior não (showBigCard = false).
  res.render('index', {
    data: featuredData,   // Usado para exibir o badge no card menor
    showBigCard: false,   // Card maior oculto na página inicial
    showFeaturedCard: true,
    error: null,
    members: [],
    totalDonations: 0,
    seasonEnd: seasonData.endTime,
    weeklyHistory: persistedData.weeklyHistory
  });
});

// Rota POST: Pesquisa/clique no card
app.post('/', async (req, res) => {
  let { clan_tag } = req.body;
  clan_tag = clan_tag.trim();
  let data = null;
  let error = null;
  let members = [];
  let totalDonations = 0;
  let showBigCard = false;        // Por padrão, oculto
  let showFeaturedCard = false;   // Ao pesquisar/clique, sumimos com o card menor

  if (clan_tag) {
    if (!clan_tag.startsWith("#")) {
      clan_tag = "#" + clan_tag;
    }

    // WHITELIST: somente #LY2RGCYU
    const allowedTag = "#LY2RGCYU";
    if (clan_tag.toUpperCase() !== allowedTag.toUpperCase()) {
      error = "❌ Este clã não está na whitelist! Entre em contato no <a href='https://instagram.com/eudes.jr1' target='_blank' class='text-blue-500 underline'>Instagram</a> ou <a href='https://wa.me/5582991588035' target='_blank' class='text-green-500 underline'>WhatsApp</a> para adquirir a whitelist ou um site personalizado.";
      return res.render('index', {
        data: null,
        error,
        members,
        totalDonations,
        seasonEnd: seasonData.endTime,
        weeklyHistory: persistedData.weeklyHistory,
        showBigCard,
        showFeaturedCard
      });
    }

    // Se for #LY2RGCYU, buscamos o clã e exibimos o card maior
    const encoded_tag = clan_tag.replace("#", "%23");
    const clanUrl = BASE_URL + encoded_tag;

    try {
      const response = await fetch(clanUrl, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${KEY}`
        }
      });

      if (response.ok) {
        data = await response.json();
        // Ativamos a flag para exibir o card maior
        showBigCard = true;

        // Busca lista de membros
        const membersUrl = BASE_URL + encoded_tag + '/members';
        const membersResponse = await fetch(membersUrl, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${KEY}`
          }
        });

        if (membersResponse.ok) {
          const membersJson = await membersResponse.json();
          members = membersJson.items || [];

          if (members.length > 0) {
            totalDonations = members.reduce((acc, m) => acc + m.donations, 0);
            seasonData.members = members.map(m => ({ name: m.name, donation: m.donations }));

            if (!seasonData.weeklyDonations) {
              seasonData.weeklyDonations = {};
            }

            // Sempre usar o nome do jogador como chave
            members.forEach(m => {
              const key = m.name; 
              if (!seasonData.weeklyDonations[key]) {
                seasonData.weeklyDonations[key] = {
                  lastKnow: m.donations,
                  weeklyDonations: 0
                };
              } else {
                const diff = m.donations - seasonData.weeklyDonations[key].lastKnow;
                if (diff > 0) {
                  seasonData.weeklyDonations[key].weeklyDonations += diff;
                }
                seasonData.weeklyDonations[key].lastKnow = m.donations;
              }
            });

            // Mapear as doações semanais para cada membro
            members = members.map(m => {
              const key = m.name;
              const weekly = seasonData.weeklyDonations[key] ? seasonData.weeklyDonations[key].weeklyDonations : 0;
              return { ...m, weeklyDonation: weekly };
            });
          }
        }
      } else {
        error = `Erro ${response.status}: ${await response.text()}`;
      }
    } catch (err) {
      error = err.message;
    }
  } else {
    error = "Por favor, insira a tag do clã.";
  }

  // Salvamos os dados
  persistedData.seasonData = seasonData;
  persistedData.seasonHistory = seasonHistory;
  persistedData.weeklyHistory = weeklyHistory;
  savePersistedData(persistedData);

  res.render('index', {
    data,
    error,
    members,
    totalDonations,
    seasonEnd: seasonData.endTime,
    weeklyHistory: persistedData.weeklyHistory,
    showBigCard,
    showFeaturedCard
  });
});

// Rota para resetar as doações semanais (manual)
app.get('/resetWeekly', (req, res) => {
  console.log(seasonData.weeklyDonations);
  const membersSorted = Object.entries(seasonData.weeklyDonations)
    .sort(([, a], [, b]) => b.weeklyDonations - a.weeklyDonations)
    .map(([key, value]) => ({ name: key, donations: value.weeklyDonations }));
  console.log("Membros ordenados:", membersSorted);

  const topDonors = membersSorted.slice(0, 3);
  const weeklyData = seasonData.weeklyDonations || {};
  const totalWeeklyDonations = Object.values(weeklyData).reduce(
    (acc, m) => acc + m.weeklyDonations,
    0
  );
  const numMembers = Object.keys(weeklyData).length;
  // Cálculo da média diária da semana (dividindo por 7)
  const weeklyAverageDaily = totalWeeklyDonations / 7;

  if (!persistedData.weeklyHistory) {
    persistedData.weeklyHistory = [];
  }
  const weekNumber = persistedData.weeklyHistory.length + 1;

  persistedData.weeklyHistory.push({
    weekNumber,
    totalDonations: totalWeeklyDonations,
    averageDonation: weeklyAverageDaily.toFixed(2),
    date: new Date().toISOString(),
    topDonors
  });

  // Reseta os valores semanais para cada membro
  Object.keys(weeklyData).forEach(key => {
    weeklyData[key].weeklyDonations = 0;
  });
  console.log("✅ Doações semanais resetadas!");

  persistedData.seasonData = seasonData;
  persistedData.weeklyHistory = persistedData.weeklyHistory;
  savePersistedData(persistedData);

  res.json({ success: true, message: "Doações semanais resetadas!" });
});

// Rota para exibir weeklyHistory
app.get('/weeklyHistory', (req, res) => {
  res.render('weeklyHistory', {
    weeklyHistory: persistedData.weeklyHistory || []
  });
});

app.get('/resetTestDonations', (req, res) => {
  // Reseta os valores em seasonData.weeklyDonations para zero
  Object.keys(seasonData.weeklyDonations).forEach(key => {
    seasonData.weeklyDonations[key].weeklyDonations = 0;
  });

  // Opcional: resetar o weeklyHistory para reiniciar o histórico
  persistedData.weeklyHistory = [];
  savePersistedData(persistedData);
  
  res.json({ success: true, message: "Doações de teste resetadas!" });
});

// Rota para resetar a season automaticamente
app.get('/resetSeason', (req, res) => {
  const now = Date.now();

  if (now >= seasonData.endTime) {
    console.log("⏳ Resetando a season automaticamente...");

    const sortedMembers = [...seasonData.members].sort((a, b) => b.donation - a.donation);
    const top3 = sortedMembers.slice(0, 3);
    const totalDonated = sortedMembers.reduce((acc, m) => acc + m.donation, 0);
    const weeklyAverage = totalDonated / (9 / 7); // 9 dias ~ 1.28 semanas

    const seasonNumber = seasonHistory.length + 1;
    const weeklyDataThisSeason = persistedData.weeklyHistory || [];

    seasonHistory.push({
      seasonNumber,
      top3,
      weeklyAverage: weeklyAverage.toFixed(2),
      totalDonated,
      weeklyBreakdown: weeklyDataThisSeason
    });

    persistedData.weeklyHistory = [];
    seasonData.members.forEach(member => member.donation = 0);
    console.log("✅ Temporada resetada!");

    persistedData.seasonData = seasonData;
    persistedData.seasonHistory = seasonHistory;
    weeklyHistory = [];
    savePersistedData(persistedData);

    res.json({ success: true, message: "Season resetada com sucesso!", seasonHistory });
  } else {
    res.json({ success: false, message: "A season ainda não terminou." });
  }
});

app.get('/seasonResults', (req, res) => {
  res.render('seasonResults', { seasonHistory });
});

// Rota para configurar manualmente o tempo da season
app.post('/setSeasonTime', (req, res) => {
  const { endTime } = req.body;
  if (endTime) {
    seasonData.endTime = new Date(endTime).getTime();
    persistedData.seasonData = seasonData;
    savePersistedData(persistedData);
    res.json({ success: true, message: `Novo tempo de season definido para ${new Date(seasonData.endTime).toLocaleString()}` });
  } else {
    res.json({ success: false, message: "Forneça um tempo válido para a season." });
  }
});

app.get('/resetAll', (req, res) => {
  // Zera as doações semanais
  if (seasonData.weeklyDonations) {
    Object.keys(seasonData.weeklyDonations).forEach(key => {
      seasonData.weeklyDonations[key].weeklyDonations = 0;
    });
  }

  // Limpa outras informações usadas na renderização:
  seasonData.members = [];
  persistedData.weeklyHistory = [];
  
  savePersistedData(persistedData);

  res.json({ success: true, message: "Todas as informações foram resetadas!" });
});

// Função para resetar as doações semanais via agendamento
function resetWeeklyDonations() {
  const weeklyData = seasonData.weeklyDonations || {};
  const totalWeeklyDonations = Object.values(weeklyData).reduce(
    (acc, m) => acc + m.weeklyDonations,
    0
  );
  // Cálculo da média diária da semana
  const weeklyAverageDaily = totalWeeklyDonations / 7;

  // Calcula os 3 maiores doadores
  const membersSorted = Object.entries(weeklyData)
    .sort(([, a], [, b]) => b.weeklyDonations - a.weeklyDonations)
    .map(([key, value]) => ({ name: key, donations: value.weeklyDonations }));
  const topDonors = membersSorted.slice(0, 3);

  if (!persistedData.weeklyHistory) {
    persistedData.weeklyHistory = [];
  }
  const weekNumber = persistedData.weeklyHistory.length + 1;
  persistedData.weeklyHistory.push({
    weekNumber,
    totalDonations: totalWeeklyDonations,
    averageDonation: weeklyAverageDaily.toFixed(2),
    date: new Date().toISOString(),
    topDonors
  });

  Object.keys(weeklyData).forEach(key => {
    weeklyData[key].weeklyDonations = 0;
  });

  persistedData.seasonData = seasonData;
  savePersistedData(persistedData);
}

// Agenda o reset semanal para as 23:15 todos os dias
cron.schedule('0 3 0 * * *', () => {
  resetWeeklyDonations();
  console.log("✅ Doações semanais resetadas via agendamento!");
});

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
