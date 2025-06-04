import { Router } from 'express';
const router = Router();

import { createMessage } from '../controllers/message.js';
import { register, login, logout } from '../controllers/user.js';
import { create, getList, remove } from '../controllers/appointment.js';
import { authenticateToken } from '../helper/auth.js';

router.post('/users/auth/login', login)
router.post('/users/auth/register', register)
router.post('/users/auth/logout', logout)
router.post('/appointments',authenticateToken, create)
router.get('/appointments', authenticateToken, getList)
router.delete('/appointments/:turnoToken', authenticateToken, remove)
router.post('/messages', createMessage)

export default router;