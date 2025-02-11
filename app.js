const express = require('express');
const path = require('path');

// Utilizando o fetch nativo do Node.js (disponível no Node 18+)
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do EJS como engine de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares para processar dados de formulários
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sua API key e a URL base da API do Clash of Clans
const KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjM2ZWUzMmJlLTc3NjgtNDcxOC05MzAzLWRlYzRjYmIwNzY5OCIsImlhdCI6MTczOTI0Nzc2MCwic3ViIjoiZGV2ZWxvcGVyL2UyYzE5ZTJjLTM2OGQtY mJjOC1hOTY4LTdjYzZjZjMwNjY2MCIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjE4Ni4yMzMuMTY4LjU4Il0sInR5cGUiOiJjbGllbnQifV19.ZLyGtOQkSfaLrSshkh2ic-40xjuXGf3giyJNIIVq6j4pcdzl_epJkvr4YyDSKi4swlhmKWrYCG4R18UdOqyAJA"; // Substitua pela sua chave
const BASE_URL = "https://api.clashofclans.com/v1/clans/";

app.get('/', (req, res) => {
  res.render('index', { data: null, error: null, members: [], totalDonations: 0 });
});

app.post('/', async (req, res) => {
  let { clan_tag } = req.body;
  let data = null;
  let error = null;
  let members = [];
  let totalDonations = 0;

  if (clan_tag) {
    // Adiciona o '#' se não estiver presente
    if (!clan_tag.startsWith("#")) {
      clan_tag = "#" + clan_tag;
    }
    // A API requer que o '#' seja URL-encoded como '%23'
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
          // O endpoint retorna um objeto com a propriedade "items" contendo o array de membros
          members = membersJson.items;
          if (members && Array.isArray(members)) {
            totalDonations = members.reduce((acc, member) => acc + member.donations, 0);
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
  
  res.render('index', { data, error, members, totalDonations });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
