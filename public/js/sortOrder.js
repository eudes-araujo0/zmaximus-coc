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
  
      itemsArray.forEach((item, index) => {
        let nameElement = item.querySelector("span.font-medium");
  
        if (nameElement) {
          // Remove apenas a tag "TOP DOADOR", preservando o conteúdo original
          let topDoadorSpan = nameElement.querySelector(".top-doador-tag");
          if (topDoadorSpan) {
            topDoadorSpan.remove();
          }
  
          // Adiciona a tag apenas ao primeiro colocado, mantendo a estrutura original
          if (index === 0) {
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
  