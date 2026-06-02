import { io } from "socket.io-client";
const API_URL = process.env.API_URL;

export const socket = io(API_URL, {
  transports: ["websocket"],
});
