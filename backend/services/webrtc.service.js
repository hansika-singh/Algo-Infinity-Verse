/**
 * Attaches WebRTC signaling event handlers to a socket instance.
 * @param {import("socket.io").Socket} socket - The connected socket
 */
export function setupWebRTCSignaling(socket) {
  socket.on("webrtc-join", (roomId, userId) => {
    const webrtcRoom = `webrtc-${roomId}`;
    socket.join(webrtcRoom);
    // Notify other peers in the room that a new peer has joined
    socket.to(webrtcRoom).emit("webrtc-user-joined", userId, socket.id);
  });

  socket.on("webrtc-offer", (roomId, offer, targetSocketId) => {
    socket.to(targetSocketId).emit("webrtc-offer", offer, socket.id);
  });

  socket.on("webrtc-answer", (roomId, answer, targetSocketId) => {
    socket.to(targetSocketId).emit("webrtc-answer", answer, socket.id);
  });

  socket.on("webrtc-ice-candidate", (roomId, candidate, targetSocketId) => {
    socket.to(targetSocketId).emit("webrtc-ice-candidate", candidate, socket.id);
  });

  socket.on("webrtc-leave", (roomId, userId) => {
    const webrtcRoom = `webrtc-${roomId}`;
    socket.leave(webrtcRoom);
    socket.to(webrtcRoom).emit("webrtc-user-left", userId, socket.id);
  });
}
