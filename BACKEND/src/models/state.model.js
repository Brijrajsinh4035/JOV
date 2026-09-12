/**
 * State & Union Territory Schema
 */
export const StateSchema = {
  id: { type: String, required: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  zone: { type: String, enum: ['North', 'South', 'East', 'West', 'Central', 'North-East'] },
};

export default StateSchema;
