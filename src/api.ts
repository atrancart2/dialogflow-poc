import { ApiResponse, create } from "apisauce";

const api = create({
    baseURL: "https://www.trainline.eu",
});

export const searchTrains = (params) => api.post("/api/v5_1/search", params);

export const searchStations = (params) => api.get("/api/v5_1/stations", params);