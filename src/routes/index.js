import { Router } from 'express';
const router = Router();

import { createMessage } from '../controllers/message.js';
import { register, login, logout } from '../controllers/user.js';
import { registerProfessional, loginProfessional, deleteProfessional, getAllProfessionals, updateRoleProfessional } from '../controllers/professional.js';
import { create, getList, remove, getServices, updateServices, deleteService, createService } from '../controllers/appointment.js';
import { authenticateToken } from '../helper/auth.js';

router.post('/users/auth/login', login)
router.post('/users/auth/register', register)
router.post('/professional/auth/register', registerProfessional)
router.post('/professional/auth/login', loginProfessional)
router.post('/users/auth/logout', logout)
router.post('/appointments',authenticateToken, create)
router.get('/appointments', authenticateToken, getList)
router.delete('/appointments/:turnoToken', authenticateToken, remove)
router.post('/messages', createMessage)
router.get('/services', getServices)
router.put('/services/:id', updateServices)
router.delete('/services/:id', deleteService)
router.post('/services', createService)
router.get('/professionals', getAllProfessionals)
router.delete('/professionals/:id', deleteProfessional)
router.put('/professionals/:id/role', updateRoleProfessional)

export default router;