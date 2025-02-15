document.addEventListener("DOMContentLoaded", () => {
  const sortOrder = document.getElementById("sortOrder");
  const membersList = document.getElementById("membersList");

  // Verifica se o elemento membersList existe
  if (!membersList) {
    console.error("Elemento 'membersList' não encontrado no DOM.");
    return;
  }

  function sortMembers() {
    const order = sortOrder.value; // "asc" ou "desc"

    // Converte os <li> da lista em um array e filtra apenas os que ainda pertencem ao clã
    let itemsArray = Array.from(membersList.querySelectorAll("li")).filter(member => {
      return member.getAttribute("data-donation") !== null; // Filtra apenas os jogadores válidos
    });

    // Ordena os itens com base no atributo data-donation
    itemsArray.sort((a, b) => {
      const donationA = Number(a.getAttribute("data-donation"));
      const donationB = Number(b.getAttribute("data-donation"));
      return order === "asc" ? donationA - donationB : donationB - donationA;
    });

    // Reanexa os itens ordenados na lista
    membersList.innerHTML = ""; // Limpa a lista antes de adicionar os membros ordenados
    itemsArray.forEach(item => membersList.appendChild(item));
  }

  // Executa a ordenação ao mudar o select
  sortOrder.addEventListener("change", sortMembers);

  // Ordena a lista ao carregar a página
  sortMembers();
});
