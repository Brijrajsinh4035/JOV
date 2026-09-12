/**
 * State Data Access Object (DAO)
 */

let states = [
  { id: 'st-1', name: 'Maharashtra', code: 'MH', zone: 'West' },
  { id: 'st-2', name: 'Gujarat', code: 'GJ', zone: 'West' },
  { id: 'st-3', name: 'Uttar Pradesh', code: 'UP', zone: 'North' },
  { id: 'st-4', name: 'Karnataka', code: 'KA', zone: 'South' },
  { id: 'st-5', name: 'Tamil Nadu', code: 'TN', zone: 'South' },
  { id: 'st-6', name: 'Madhya Pradesh', code: 'MP', zone: 'Central' },
  { id: 'st-7', name: 'Delhi (NCT)', code: 'DL', zone: 'North' },
  { id: 'st-8', name: 'Rajasthan', code: 'RJ', zone: 'North' },
  { id: 'st-9', name: 'Bihar', code: 'BR', zone: 'East' },
  { id: 'st-10', name: 'Assam', code: 'AS', zone: 'North-East' },
];

export const stateDao = {
  getAll: async () => [...states],
  getById: async (id) => states.find((s) => s.id === id || s.code === id || s.name === id) || null,
};

export default stateDao;
