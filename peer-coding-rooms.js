document.addEventListener("DOMContentLoaded", () => {
  const roomId = document.getElementById("roomId");

  if (roomId) {
    const randomId =
      "ROOM-" + Math.floor(10000 + Math.random() * 90000);

    roomId.textContent = randomId;
  }

  console.log("Peer Coding Rooms Loaded");
});