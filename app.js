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
        weeklyDonations: {}  // Usado como objeto para armazenar as doações semanais por chave (tag ou nome)
      },
      seasonHistory: [],
      // ADIÇÃO: histórico de doações por semana
      weeklyHistory: []
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

function savePersistedData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Carrega os dados persistidos (ou cria se não existirem)
let persistedData = loadPersistedData();
let seasonData = persistedData.seasonData;
let seasonHistory = persistedData.seasonHistory;
// ADIÇÃO: referência ao array de histórico semanal
let weeklyHistory = persistedData.weeklyHistory || [];

// Configuração do EJS como engine de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares para processar JSON e formulários
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API Key e URL base do Clash of Clans
const KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjhiNGFjYmM2LWQ1MDgtNGM5Yy1iODFjLTQzZTg1MjBhMDJlOCIsImlhdCI6MTczOTYzNjk0NSwic3ViIjoiZGV2ZWxvcGVyL2UyYzE5ZTJjLTM2OGQtYmJjOC1hOTY4LTdjYzZjZjMwNjY2MCIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjIxMy4yMTQuNTUiLCIxODYuMjMzLjE2OC41OCJdLCJ0eXBlIjoiY2xpZW50In1dfQ.yljOGKXjBdk6EjL8jlJfHntj3Q6VsvjyZEw1eGu3zMljoHEiC6uYVNHvR9HxRwsPTkh8A5rwvu_4C9k4TJCb_A";
const BASE_URL = "https://api.clashofclans.com/v1/clans/";

// Rota para exibir a página inicial
app.get('/', (req, res) => {
  res.render('index', { data: null, error: null, members: [], totalDonations: 0, seasonEnd: seasonData.endTime });
});

// Rota para buscar dados do clã
app.post('/', async (req, res) => {
  let { clan_tag } = req.body;
  let data = null;
  let error = null;
  let members = [];
  let totalDonations = 0;
  seasonEnd = seasonData.endTime;
  weeklyHistory: persistedData.weeklyHistory;

  if (clan_tag) {
    if (!clan_tag.startsWith("#")) {
      clan_tag = "#" + clan_tag;
    }
    const encoded_tag = clan_tag.replace("#", "%23");
    const clanUrl = BASE_URL + encoded_tag;

    try {
      // Busca os dados do clã
      const response = await fetch(clanUrl, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${KEY}`
        }
      });

      if (response.ok) {
        data = await response.json();

        // Busca a lista de membros do clã
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
            totalDonations = members.reduce((acc, member) => acc + member.donations, 0);
            seasonData.members = members.map(m => ({ name: m.name, donation: m.donations }));

            // Atualiza a estrutura de weeklyDonations
            if (!seasonData.weeklyDonations) {
              seasonData.weeklyDonations = {};
            }

            members.forEach(m => {
              const key = m.tag || m.name;
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

            // Mapeia os membros para incluir a propriedade "weeklyDonation"
            members = members.map(m => {
              const key = m.tag || m.name;
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

  // Salva os dados persistidos (seasonData e seasonHistory) em data.json
  persistedData.seasonData = seasonData;
  persistedData.seasonHistory = seasonHistory;
  // ADIÇÃO: também salvamos weeklyHistory, caso tenha sido alterado
  persistedData.weeklyHistory = weeklyHistory;
  savePersistedData(persistedData);

  res.render('index', { data, error, members, totalDonations, seasonEnd, weeklyHistory: persistedData.weeklyHistory });
});

// Rota para resetar as doações semanais (pode ser chamada manualmente ou via cron)
app.get('/resetWeekly', (req, res) => {
  // ADIÇÃO: antes de zerar, somamos todas as doações semanais para guardar o histórico
  const totalWeeklyDonations = Object.values(seasonData.weeklyDonations || {}).reduce(
    (acc, member) => acc + member.weeklyDonations,
    0
  );

  // Se não existir, inicializa
  if (!persistedData.weeklyHistory) {
    persistedData.weeklyHistory = [];
  }

  // Descobre qual é a próxima "semana" (ou reset) contando o length
  const weekNumber = persistedData.weeklyHistory.length + 1;

  // Salva no histórico semanal
  persistedData.weeklyHistory.push({
    weekNumber,
    totalDonations: totalWeeklyDonations,
    date: new Date().toISOString()
  });

  // Agora zera as doações
  Object.keys(seasonData.weeklyDonations || {}).forEach(key => {
    seasonData.weeklyDonations[key].weeklyDonations = 0;
  });
  console.log("✅ Doações semanais resetadas!");

  // Salva os dados atualizados
  persistedData.seasonData = seasonData;
  persistedData.weeklyHistory = persistedData.weeklyHistory;
  savePersistedData(persistedData);

  res.json({ success: true, message: "Doações semanais resetadas!" });
});

app.get('/weeklyHistory', (req, res) => {
    // Renderiza uma nova view "weeklyHistory.ejs"
    // passando a lista de semanas com doações
    res.render('weeklyHistory', {
      weeklyHistory: persistedData.weeklyHistory || []
    });
  });

// Rota para resetar a season automaticamente
app.get('/resetSeason', (req, res) => {
  const now = Date.now();

  if (now >= seasonData.endTime) {
    console.log("⏳ Resetando a season automaticamente...");

    // Calculando os dados da temporada finalizada
    const sortedMembers = [...seasonData.members].sort((a, b) => b.donation - a.donation);
    const top3 = sortedMembers.slice(0, 3);
    const totalDonated = sortedMembers.reduce((acc, member) => acc + member.donation, 0);
    const weeklyAverage = totalDonated / (9 / 7); // Aproximando 9 dias como 1.28 semanas

    // ADIÇÃO: Pega todas as semanas desta temporada e anexa no histórico
    const seasonNumber = seasonHistory.length + 1;
    const weeklyDataThisSeason = persistedData.weeklyHistory || [];

    // Armazenando os resultados da season + o breakdown semanal
    seasonHistory.push({
      seasonNumber,
      top3,
      weeklyAverage: weeklyAverage.toFixed(2),
      totalDonated,
      weeklyBreakdown: weeklyDataThisSeason
    });

    // Limpa o histórico semanal para a próxima temporada
    persistedData.weeklyHistory = [];

    // Resetando os dados da season
    seasonData.members.forEach(member => member.donation = 0);
    console.log("✅ Temporada resetada!");

    // Salva os dados atualizados
    persistedData.seasonData = seasonData;
    persistedData.seasonHistory = seasonHistory;
    // ADIÇÃO: zera o weeklyHistory para a próxima season
    weeklyHistory = [];
    savePersistedData(persistedData);

    res.json({ success: true, message: "Season resetada com sucesso!", seasonHistory });
  } else {
    res.json({ success: false, message: "A season ainda não terminou." });
  }
});

// Rota para exibir os resultados das seasons anteriores
app.get('/seasonResults', (req, res) => {
  res.render('seasonResults', { seasonHistory });
});

// Rota para configurar manualmente o tempo da season
app.post('/setSeasonTime', (req, res) => {
  const { endTime } = req.body;

  if (endTime) {
    seasonData.endTime = new Date(endTime).getTime();

    // Salva os dados atualizados
    persistedData.seasonData = seasonData;
    savePersistedData(persistedData);

    res.json({ success: true, message: `Novo tempo de season definido para ${new Date(seasonData.endTime).toLocaleString()}` });
  } else {
    res.json({ success: false, message: "Forneça um tempo válido para a season." });
  }
});

// Agendamento: Zerando as doações semanais a partir de amanhã às 00:10 e, depois, toda segunda-feira às 00:10
function resetWeeklyDonations() {
  // Mesmo comportamento do /resetWeekly:
  const totalWeeklyDonations = Object.values(seasonData.weeklyDonations || {}).reduce(
    (acc, member) => acc + member.weeklyDonations,
    0
  );

  if (!persistedData.weeklyHistory) {
    persistedData.weeklyHistory = [];
  }
  const weekNumber = persistedData.weeklyHistory.length + 1;
  persistedData.weeklyHistory.push({
    weekNumber,
    totalDonations: totalWeeklyDonations,
    date: new Date().toISOString()
  });

  Object.keys(seasonData.weeklyDonations || {}).forEach(key => {
    seasonData.weeklyDonations[key].weeklyDonations = 0;
  });
  console.log("✅ Doações semanais resetadas via agendamento!");

  persistedData.seasonData = seasonData;
  savePersistedData(persistedData);
}

const agora = new Date();
const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 0, 10, 0, 0);
const delay = amanha.getTime() - agora.getTime();

setTimeout(() => {
  resetWeeklyDonations();
  // Agenda resets recorrentes: toda segunda-feira às 00:10
  cron.schedule('10 0 * * 1', () => {
    resetWeeklyDonations();
  });
}, delay);

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
