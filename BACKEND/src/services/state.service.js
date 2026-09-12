import { stateDao } from '../dao/state.dao.js';

export const stateService = {
  getAllStates: async () => {
    return await stateDao.getAll();
  },

  getStateById: async (id) => {
    return await stateDao.getById(id);
  },
};

export default stateService;
