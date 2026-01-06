const cards = JSON.parse(localStorage.getItem("myCards") || "[]");
const list = document.getElementById("cardsList");

cards.forEach(card => {
    const li = document.createElement("li");
    li.textContent = `${card.word}: ${card.definition}`;
    list.appendChild(li);
});
