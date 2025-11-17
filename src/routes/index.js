import { Router } from 'express';
const router = Router();

import { createMessage } from '../controllers/message.js';
import { register, login, logout } from '../controllers/user.js';
import { registerProfessional, loginProfessional, deleteProfessional, getAllProfessionals, updateRoleProfessional } from '../controllers/professional.js';
import { create, getList, remove, getServices, updateServices, deleteService, createService, getHistorial } from '../controllers/appointment.js';
import { authenticateToken } from '../helper/auth.js';
import { 
    getProductos, 
    getProductoById, 
    createProducto, 
    updateProducto, 
    deleteProducto,
    getProductosByTipo,
    getProductosByCategoria,
    getStock
} from '../controllers/product.js';
import {
    getProveedores,
    getProveedorById,
    createProveedor,
    updateProveedor,
    deleteProveedor
} from '../controllers/proveedor.js';
import {
    createVenta,
    getVentas,
    getVentaById,
    getFlujoCaja,
    getCarritoVendedora
} from '../controllers/venta.js';
import { requireAdmin, requireSeller, requireAdminOrSeller } from '../middlewares/role.js';

// Rutas de autenticación
router.post('/users/auth/login', login)
router.post('/users/auth/register', register)
router.post('/professional/auth/register', registerProfessional)
router.post('/professional/auth/login', loginProfessional)
router.post('/users/auth/logout', logout)

// Rutas de citas
router.post('/appointments', authenticateToken, create)
router.get('/appointments', authenticateToken, getList)
router.delete('/appointments/:turnoToken', authenticateToken, remove)
router.get('/historial', authenticateToken, getHistorial)

// Rutas de mensajes
router.post('/messages', createMessage)

// Rutas de servicios
router.get('/services', getServices)
router.put('/services/:id', updateServices)
router.delete('/services/:id', deleteService)
router.post('/services', createService)

// Rutas de profesionales
router.get('/professionals', getAllProfessionals)
router.delete('/professionals/:id', deleteProfessional)
router.put('/professionals/:id/role', updateRoleProfessional)

// Rutas de productos
// Cualquier usuario autenticado puede ver productos (ajustado para permitir a todos los usuarios)
router.get('/productos', authenticateToken, getProductos)
router.get('/productos/:id', authenticateToken, getProductoById)
router.get('/productos/tipo/:tipo', authenticateToken, getProductosByTipo)
router.get('/productos/categoria/:categoria', authenticateToken, getProductosByCategoria)
// Endpoint de stock (solo vendedora)
router.get('/productos/stock', authenticateToken, requireSeller, getStock)
// Solo admin puede crear, actualizar y eliminar productos
router.post('/productos', authenticateToken, requireAdmin, createProducto)
router.put('/productos/:id', authenticateToken, requireAdmin, updateProducto)
router.delete('/productos/:id', authenticateToken, requireAdmin, deleteProducto)

// Rutas de proveedores (solo admin)
router.get('/proveedores', authenticateToken, requireAdmin, getProveedores)
router.get('/proveedores/:id', authenticateToken, requireAdmin, getProveedorById)
router.post('/proveedores', authenticateToken, requireAdmin, createProveedor)
router.put('/proveedores/:id', authenticateToken, requireAdmin, updateProveedor)
router.delete('/proveedores/:id', authenticateToken, requireAdmin, deleteProveedor)

// Rutas de ventas
// Vendedora puede crear ventas y ver sus propias ventas
router.post('/ventas', authenticateToken, requireSeller, createVenta)
router.get('/ventas/carrito', authenticateToken, requireSeller, getCarritoVendedora)
// Admin puede ver todas las ventas y el flujo de caja
router.get('/ventas', authenticateToken, requireAdminOrSeller, getVentas)
router.get('/ventas/:id', authenticateToken, requireAdminOrSeller, getVentaById)
router.get('/ventas/flujo-caja', authenticateToken, requireAdmin, getFlujoCaja)

export default router;