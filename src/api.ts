import { ApiResponse, create } from "apisauce";

const api = create({
    baseURL: "https://www.trainline.eu",
});

export const searchTrains = (params) => api.get("/api/v5_1/search");
