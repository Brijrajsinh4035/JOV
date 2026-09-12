import { departmentService } from '../services/department.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await departmentService.getAll(req.query);
  return res.status(200).json(new ApiResponse(200, departments, 'Departments fetched successfully'));
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await departmentService.getById(req.params.id);
  return res.status(200).json(new ApiResponse(200, department, 'Department fetched successfully'));
});

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.create(req.body);
  return res.status(201).json(new ApiResponse(201, department, 'Department created successfully'));
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.update(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, department, 'Department updated successfully'));
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  await departmentService.delete(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Department deleted successfully'));
});

export default {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
