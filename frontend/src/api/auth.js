import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

//INITIALISE START UP
export const signupUser = (data) =>
  API.post("/pending/signup/start", data);

//USERNAME CREATION
export const saveUsername = (data) =>
  API.post("/pending/signup/username", data);

//USER TABLE IMPLEMENT
export const completeSignup = (data) =>
  API.post("/pending/signup/complete", data);
