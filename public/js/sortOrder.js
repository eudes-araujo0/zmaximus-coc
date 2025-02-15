document.addEventListener("DOMContentLoaded", () => {
  const sortOrder = document.getElementById("sortOrder");
  const membersList = document.getElementById("membersList");

  if (!membersList) {
    console.error("Elemento 'membersList' não encontrado no DOM.");
    return;
  }

  function sortMembers() {
    const order = sortOrder.value;

    let itemsArray = Array.from(membersList.querySelectorAll("li")).filter(
      member => member.getAttribute("data-donation") !== null
    );

    // Ordena pelo número de doações
    itemsArray.sort((a, b) => {
      const donationA = Number(a.getAttribute("data-donation"));
      const donationB = Number(b.getAttribute("data-donation"));
      return order === "asc" ? donationA - donationB : donationB - donationA;
    });

    // Limpa a UL para reapendá-los na nova ordem
    membersList.innerHTML = "";

    // Maior número de doações atual (ignora se for 0)
    const maiorDoacao =
      itemsArray.length > 0
        ? Math.max(...itemsArray.map(item => Number(item.getAttribute("data-donation"))))
        : 0;

    // Recoloca cada <li> e exibe/esconde a tag "TOP DOADOR"
    itemsArray.forEach(item => {
      // Pega a tag .top-doador-tag dentro do <li>
      const topDoadorSpan = item.querySelector(".top-doador-tag");
      if (topDoadorSpan) {
        // Esconde por padrão
        topDoadorSpan.classList.add("hidden");
      }

      const doacoesAtuais = Number(item.getAttribute("data-donation"));

      // Se for o maior doador e > 0, remove a classe hidden
      if (doacoesAtuais === maiorDoacao && maiorDoacao > 0) {
        if (topDoadorSpan) {
          topDoadorSpan.classList.remove("hidden");
        }
      }

      membersList.appendChild(item);
    });
  }

  // Ordena ao trocar select e na primeira carga
  sortOrder.addEventListener("change", sortMembers);
  sortMembers();
});
