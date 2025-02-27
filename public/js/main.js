document.addEventListener('DOMContentLoaded', () => {
  const donationSummary = document.querySelector('.summary-card');
  const inputBusca = document.getElementById("playerSearch");
  const suggestions = document.getElementById("suggestions");
  const membros = document.querySelectorAll("ul.divide-y li"); // Pegando o card de doações

  inputBusca.addEventListener("input", function() {
    const pesquisa = inputBusca.value.trim().toLowerCase();
    let encontrouAlgum = false;

    membros.forEach(membro => {
      const nome = membro.getAttribute("data-name");
      if (nome.includes(pesquisa)) {
        membro.style.display = "";
        encontrouAlgum = true;
      } else {
        membro.style.display = "none";
      }
    });

    // Exibe a mensagem caso não encontre nenhum jogador com a busca realizada
    if (pesquisa && !encontrouAlgum) {
      suggestions.textContent = "Jogador não encontrado!";
    } else {
      suggestions.textContent = "";
    }
  });

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
document.addEventListener("DOMContentLoaded", function () {
  const burger = document.getElementById("navbarBurger");
  const menu = document.getElementById("navbarMenu");
  const close = document.getElementById("navbarClose");
  const backdrop = document.querySelector(".navbar-backdrop");

  function openMenu() {
    menu.classList.remove("-translate-x-full", "opacity-0");
    menu.classList.add("translate-x-0", "opacity-100");
    if(backdrop) {
      backdrop.classList.remove("opacity-0");
      backdrop.classList.add("opacity-25");
    }
  }

  function closeMenu() {
    menu.classList.remove("translate-x-0", "opacity-100");
    menu.classList.add("-translate-x-full", "opacity-0");
    if(backdrop) {
      backdrop.classList.remove("opacity-25");
      backdrop.classList.add("opacity-0");
    }
  }

  if(burger) {
    burger.addEventListener("click", openMenu);
  }
  if(close) {
    close.addEventListener("click", closeMenu);
  }
  if(backdrop) {
    backdrop.addEventListener("click", closeMenu);
  }
});