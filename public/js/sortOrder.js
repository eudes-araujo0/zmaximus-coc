document.addEventListener("DOMContentLoaded", () => {
    const sortOrder = document.getElementById("sortOrder");
    const membersList = document.getElementById("membersList");
  
    if (!membersList) {
      console.error("Elemento 'membersList' não encontrado no DOM.");
      return;
    }
  
    function sortMembers() {
      const order = sortOrder.value;
  
      let itemsArray = Array.from(membersList.querySelectorAll("li")).filter(member => 
        member.getAttribute("data-donation") !== null
      );
  
      itemsArray.sort((a, b) => {
        const donationA = Number(a.getAttribute("data-donation"));
        const donationB = Number(b.getAttribute("data-donation"));
        return order === "asc" ? donationA - donationB : donationB - donationA;
      });
  
      membersList.innerHTML = "";
  
      // Obtém o maior número de doações atual (ignora se for 0)
      const maiorDoacao = itemsArray.length > 0 
        ? Math.max(...itemsArray.map(item => Number(item.getAttribute("data-donation")))) 
        : 0;
  
      itemsArray.forEach(item => {
        let nameElement = item.querySelector("span.font-medium");
  
        if (nameElement) {
          let topDoadorSpan = nameElement.querySelector(".top-doador-tag");
          if (topDoadorSpan) {
            topDoadorSpan.remove();
          }
  
          const doacoesAtuais = Number(item.getAttribute("data-donation"));
  
          // Adiciona a tag somente ao jogador que tem o maior número de doações
          if (doacoesAtuais === maiorDoacao && maiorDoacao > 0) {
            let tagSpan = document.createElement("span");
            tagSpan.classList.add("text-yellow-400", "font-bold", "top-doador-tag");
            tagSpan.innerHTML = " 🏆 TOP DOADOR";
            nameElement.appendChild(tagSpan);
          }
        }
  
        membersList.appendChild(item);
      });
    }
  
    sortOrder.addEventListener("change", sortMembers);
    sortMembers();
  });
  