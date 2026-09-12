import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const aiApi = {
  chat: async (message, history = []) => {
    return await axiosClient.post(API_ENDPOINTS.AI.CHAT, { message, history });
  },

  getSuggestions: async () => {
    return await axiosClient.get(API_ENDPOINTS.AI.SUGGESTIONS);
  },
};

export default aiApi;
