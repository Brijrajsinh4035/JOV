import { clientService } from '../services/client.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getClients = asyncHandler(async (req, res) => {
  const clients = await clientService.getAll(req.query);
  return res.status(200).json(new ApiResponse(200, clients, 'Clients retrieved successfully'));
});

export const getClientById = asyncHandler(async (req, res) => {
  const client = await clientService.getById(req.params.id);
  return res.status(200).json(new ApiResponse(200, client, 'Client retrieved successfully'));
});

export const createClient = asyncHandler(async (req, res) => {
  const client = await clientService.create(req.body);
  return res.status(201).json(new ApiResponse(201, client, 'Client created successfully'));
});

export const updateClient = asyncHandler(async (req, res) => {
  const client = await clientService.update(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, client, 'Client updated successfully'));
});

export const deleteClient = asyncHandler(async (req, res) => {
  await clientService.delete(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Client deleted successfully'));
});

export default {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
