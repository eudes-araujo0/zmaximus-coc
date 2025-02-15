document.addEventListener('DOMContentLoaded', () => {
  // Seleciona os elementos necessários
  const sortOrderSelect = document.getElementById('sortOrder');
  const membersList = document.querySelector('.members-info ul');
  const playerSearchInput = document.getElementById('playerSearch');
  const suggestionsContainer = document.getElementById('suggestions');

  if (!sortOrderSelect || !membersList) {
    console.error('Elemento de ordenação ou lista de membros não encontrado!');
    return;
  }

  // Função para ordenar os membros
  function sortMembers() {
    const order = sortOrderSelect.value; // 'desc' ou 'asc'
    // Reconsulta os <li> atuais da lista
    const itemsArray = Array.from(membersList.querySelectorAll('li'));

    console.log('Antes da ordenação:', itemsArray.map(item => item.textContent.trim()));

    // Ordena os itens com base no valor do atributo data-donation
    itemsArray.sort((a, b) => {
      const donationA = parseFloat(a.getAttribute('data-donation')) || 0;
      const donationB = parseFloat(b.getAttribute('data-donation')) || 0;
      return order === 'desc' ? donationB - donationA : donationA - donationB;
    });

    // Limpa a lista e reanexa os itens ordenados
    membersList.innerHTML = '';
    itemsArray.forEach(item => membersList.appendChild(item));

    console.log('Depois da ordenação:', itemsArray.map(item => item.textContent.trim()));
  }

  // Chama a ordenação ao carregar a página
  sortMembers();

  // Reordena quando o usuário muda a opção no select
  sortOrderSelect.addEventListener('change', sortMembers);

  // Evento de filtragem: ao digitar, exibe somente os membros que contêm o texto digitado
  if (playerSearchInput && suggestionsContainer) {
    playerSearchInput.addEventListener('input', function() {
      const filter = playerSearchInput.value.trim().toLowerCase();
      let algumVisivel = false;
      // Reconsulta os <li> a cada digitação para pegar a lista atual (ordenada ou não)
      const listItems = membersList.querySelectorAll('li');

      console.log("Input funcionando:", playerSearchInput.value);

      listItems.forEach(item => {
        const playerName = item.getAttribute('data-name') || '';
        if (playerName.toLowerCase().includes(filter)) {
          item.style.display = '';
          algumVisivel = true;
        } else {
          item.style.display = 'none';
        }
      });

      // Se o filtro não estiver vazio e nenhum item for visível, exibe mensagem
      if (filter !== '' && !algumVisivel) {
        suggestionsContainer.textContent = 'Jogador não encontrado!';
      } else {
        suggestionsContainer.textContent = '';
      }
    });
  }

  // Toggle do menu mobile
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', () => {
          mobileMenu.classList.toggle('hidden');
      });
  }

  // Contagem regressiva para o término da season
  if (typeof window.seasonEnd !== 'undefined' && window.seasonEnd && window.seasonEnd !== "null") {
      const countdownEl = document.getElementById('countdown');
      const seasonEndTime = Number(window.seasonEnd);

      if (countdownEl && seasonEndTime) {
          const timer = setInterval(() => {
              const now = new Date().getTime();
              const distance = seasonEndTime - now;

              if (distance < 0) {
                  clearInterval(timer);
                  countdownEl.innerHTML = "Temporada encerrada!";

                  // Chamada para resetar a season (a rota /resetSeason deve estar implementada no backend)
                  fetch('/resetSeason')
                      .then(res => res.json())
                      .then(data => {
                          if (data.success) {
                              const seasonHistoryMenu = document.getElementById('season-history');
                              if (seasonHistoryMenu) {
                                  seasonHistoryMenu.style.display = 'block';
                              }
                              window.location.href = "/seasonResults";
                          } else {
                              console.error("Erro ao resetar a temporada:", data.message);
                          }
                      });
              } else {
                  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                  countdownEl.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s restantes`;
              }
          }, 1000);
      }
  }

  // Exibir menu de temporadas passadas se houver histórico
  fetch('/seasonResults')
      .then(res => res.json())
      .then(data => {
          if (data.length > 0) {
              const seasonHistoryMenu = document.getElementById('season-history');
              if (seasonHistoryMenu) {
                  seasonHistoryMenu.style.display = 'block';
              }
          }
      });
});
