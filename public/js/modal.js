function openWeeklyModal(name, weekly) {
    document.getElementById('modalPlayerName').innerText = name;
    document.getElementById('modalWeeklyDonations').innerText = "Doações na semana: " + weekly;
    document.getElementById('weeklyModal').classList.remove('hidden');
  }
  function closeWeeklyModal() {
    document.getElementById('weeklyModal').classList.add('hidden');
  }

  // modal media semanal

  function openAverageModal() {
    const modal = document.getElementById("averageModal");
    const modalContent = modal.querySelector("div");
    modal.classList.remove("opacity-0", "pointer-events-none");
    modal.classList.add("opacity-100");
    modalContent.classList.remove("scale-95");
    modalContent.classList.add("scale-100");
  }
  
  function closeAverageModal() {
    const modal = document.getElementById("averageModal");
    const modalContent = modal.querySelector("div");
    modal.classList.remove("opacity-100");
    modal.classList.add("opacity-0", "pointer-events-none");
    modalContent.classList.remove("scale-100");
    modalContent.classList.add("scale-95");
  }

   // Adiciona a funcionalidade de exibir/ocultar o TOP 3 doadores ao clicar no card
   document.querySelectorAll('li[data-index]').forEach(card => {
    card.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const donorsDiv = document.getElementById('top-donors-' + index);
      const arrowIcon = document.getElementById('arrow-icon-' + index);
      if (donorsDiv) {
        if (donorsDiv.classList.contains('hidden')) {
          donorsDiv.classList.remove('hidden');
          arrowIcon.classList.add('rotate-180');
        } else {
          donorsDiv.classList.add('hidden');
          arrowIcon.classList.remove('rotate-180');
        }
      }
    });
  });