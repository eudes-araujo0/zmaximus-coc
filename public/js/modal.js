function openWeeklyModal(name, weekly) {
    document.getElementById('modalPlayerName').innerText = name;
    document.getElementById('modalWeeklyDonations').innerText = "Doações na semana: " + weekly;
    document.getElementById('weeklyModal').classList.remove('hidden');
  }
  function closeWeeklyModal() {
    document.getElementById('weeklyModal').classList.add('hidden');
  }