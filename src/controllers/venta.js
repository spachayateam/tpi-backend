import db from "../config/connection.js";

// Crear una venta (vendedora)
export async function createVenta(req, res) {
    try {
        // Aceptar tanto el formato nuevo (frontend) como el antiguo (backward compatibility)
        const { 
            productoId, producto_id, 
            cantidad, 
            metodoPago, metodo_pago,
            precioTotal, precio_total,
            precioUnitario, precio_unitario,
            compradorNombre, comprador_nombre,
            compradorDni, comprador_dni
        } = req.body;
        
        const vendedora_id = req.user.userId;
        
        // Normalizar nombres de variables
        const producto_id_final = productoId || producto_id;
        const metodo_pago_final = metodoPago || metodo_pago;
        const precio_total_final = precioTotal || precio_total;
        const precio_unitario_final = precioUnitario || precio_unitario;
        
        // Validaciones básicas
        if (!producto_id_final || !cantidad || !metodo_pago_final) {
            return res.status(400).send({ 
                message: "Datos requeridos: productoId, cantidad, metodoPago" 
            });
        }
        
        // Normalizar método de pago (aceptar tanto mayúsculas como minúsculas)
        const metodoPagoLower = metodo_pago_final.toLowerCase();
        let metodo_pago_db;
        
        if (metodoPagoLower === 'efectivo') {
            metodo_pago_db = 'Efectivo';
        } else if (metodoPagoLower === 'debito') {
            metodo_pago_db = 'Debito';
        } else if (metodoPagoLower === 'credito') {
            metodo_pago_db = 'Credito';
        } else {
            return res.status(400).send({ 
                message: "Método de pago debe ser 'Efectivo', 'Debito' o 'Credito'" 
            });
        }
        
        if (cantidad <= 0) {
            return res.status(400).send({ message: "La cantidad debe ser mayor a 0" });
        }
        
        // Verificar que el producto existe y tiene stock suficiente
        const [productos] = await db.query("SELECT * FROM productos WHERE id = ?", [producto_id_final]);
        if (productos.length === 0) {
            return res.status(404).send({ message: "Producto no encontrado" });
        }
        
        const producto = productos[0];
        if (producto.stock < cantidad) {
            return res.status(400).send({ 
                message: `Stock insuficiente. Disponible: ${producto.stock}` 
            });
        }
        
        // Calcular precio (usar valores del frontend si están disponibles, sino calcular)
        const precio_unitario_calculado = precio_unitario_final || parseFloat(producto.precio);
        let precio_final_calculado = precio_total_final;
        let descuento = 0;
        
        // Si no se proporciona precio_final, calcularlo
        if (!precio_final_calculado) {
            precio_final_calculado = precio_unitario_calculado * cantidad;
            
            // Aplicar descuento del 10% si es efectivo
            if (metodo_pago_db === 'Efectivo') {
                descuento = precio_final_calculado * 0.1;
                precio_final_calculado = precio_final_calculado - descuento;
            }
        } else {
            // Si se proporciona precio_final, calcular el descuento
            const precio_sin_descuento = precio_unitario_calculado * cantidad;
            descuento = precio_sin_descuento - precio_final_calculado;
        }
        
        // Valores para comprador (nombre y apellido juntos, o solo nombre)
        const comprador_nombre_final = compradorNombre || comprador_nombre || 'Cliente general';
        const comprador_dni_final = compradorDni || comprador_dni || 'N/A';
        
        // Iniciar transacción
        await db.query("START TRANSACTION");
        
        try {
            // Crear la venta
            const [result] = await db.execute(
                `INSERT INTO ventas 
                 (vendedora_id, comprador_nombre, comprador_dni, producto_id, cantidad, 
                  precio_unitario, descuento, precio_final, metodo_pago) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [vendedora_id, comprador_nombre_final, comprador_dni_final, producto_id_final, cantidad, 
                 precio_unitario_calculado, descuento, precio_final_calculado, metodo_pago_db]
            );
            
            // Actualizar stock del producto
            await db.execute(
                "UPDATE productos SET stock = stock - ? WHERE id = ?",
                [cantidad, producto_id_final]
            );
            
            await db.query("COMMIT");
            
            // Obtener la venta creada con información del producto
            const [ventaCreada] = await db.query(`
                SELECT v.*, 
                       p.name as producto_nombre,
                       p.tipo as producto_tipo,
                       p.categoria as producto_categoria,
                       p.imagen as producto_imagen
                FROM ventas v
                INNER JOIN productos p ON v.producto_id = p.id
                WHERE v.id = ?
            `, [result.insertId]);
            
            return res.status(201).send({ 
                message: "Venta realizada con éxito", 
                id: result.insertId,
                venta: ventaCreada[0] || {
                    id: result.insertId,
                    producto: {
                        name: producto.name,
                        tipo: producto.tipo,
                        categoria: producto.categoria
                    },
                    cantidad,
                    precio_unitario: precio_unitario_calculado,
                    descuento,
                    precio_final: precio_final_calculado,
                    metodo_pago: metodo_pago_db
                }
            });
        } catch (err) {
            await db.query("ROLLBACK");
            throw err;
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Obtener todas las ventas (admin puede ver todas, vendedora solo las suyas)
export async function getVentas(req, res) {
    try {
        const userRole = req.user.role;
        const userId = req.user.userId;
        
        let query = `
            SELECT v.*, 
                   p.id as producto_id,
                   p.name as producto_nombre,
                   p.tipo as producto_tipo,
                   p.categoria as producto_categoria,
                   p.imagen as producto_imagen,
                   p.precio as producto_precio,
                   u.name as vendedora_nombre
            FROM ventas v
            INNER JOIN productos p ON v.producto_id = p.id
            INNER JOIN users u ON v.vendedora_id = u.id
        `;
        
        const params = [];
        
        // Si es vendedora, solo ver sus ventas
        if (userRole !== 'ADMIN') {
            query += " WHERE v.vendedora_id = ?";
            params.push(userId);
        }
        
        query += " ORDER BY v.fecha_venta DESC";
        
        const [ventas] = await db.query(query, params);
        
        // Formatear respuesta para incluir objeto producto
        const ventasFormateadas = ventas.map(venta => ({
            ...venta,
            producto: {
                id: venta.producto_id,
                name: venta.producto_nombre,
                tipo: venta.producto_tipo,
                categoria: venta.producto_categoria,
                imagen: venta.producto_imagen,
                precio: venta.producto_precio
            },
            fecha: venta.fecha_venta,
            metodoPago: venta.metodo_pago,
            precioTotal: venta.precio_final,
            precioUnitario: venta.precio_unitario
        }));
        
        return res.status(200).json(ventasFormateadas);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Obtener una venta por ID
export async function getVentaById(req, res) {
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        const userId = req.user.userId;
        
        let query = `
            SELECT v.*, 
                   p.name as producto_nombre,
                   p.tipo as producto_tipo,
                   p.categoria as producto_categoria,
                   u.name as vendedora_nombre
            FROM ventas v
            INNER JOIN productos p ON v.producto_id = p.id
            INNER JOIN users u ON v.vendedora_id = u.id
            WHERE v.id = ?
        `;
        
        const params = [id];
        
        // Si es vendedora, solo puede ver sus propias ventas
        if (userRole !== 'ADMIN') {
            query += " AND v.vendedora_id = ?";
            params.push(userId);
        }
        
        const [ventas] = await db.query(query, params);
        
        if (ventas.length === 0) {
            return res.status(404).send({ message: "Venta no encontrada" });
        }
        
        return res.status(200).json(ventas[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Flujo de caja diario (solo admin) - con filtros de fecha
export async function getFlujoCaja(req, res) {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        // Construir query base
        let whereClause = "1=1";
        const params = [];
        
        if (fecha_inicio) {
            whereClause += " AND DATE(v.fecha_venta) >= ?";
            params.push(fecha_inicio);
        }
        
        if (fecha_fin) {
            whereClause += " AND DATE(v.fecha_venta) <= ?";
            params.push(fecha_fin);
        }
        
        // Obtener ventas con detalles de productos
        const [ventas] = await db.query(`
            SELECT v.*, 
                   p.name as producto_nombre,
                   p.tipo as producto_tipo,
                   p.categoria as producto_categoria,
                   u.name as vendedora_nombre
            FROM ventas v
            INNER JOIN productos p ON v.producto_id = p.id
            INNER JOIN users u ON v.vendedora_id = u.id
            WHERE ${whereClause}
            ORDER BY v.fecha_venta DESC
        `, params);
        
        // Calcular totales por método de pago
        const [totalesMetodo] = await db.query(`
            SELECT 
                metodo_pago,
                COUNT(*) as cantidad_ventas,
                SUM(precio_final) as total
            FROM ventas
            WHERE ${whereClause}
            GROUP BY metodo_pago
        `, params);
        
        // Calcular totales por producto (categoría y nombre)
        const [totalesProducto] = await db.query(`
            SELECT 
                p.categoria,
                p.name as producto_nombre,
                p.tipo,
                COUNT(v.id) as cantidad_ventas,
                SUM(v.cantidad) as unidades_vendidas,
                SUM(v.precio_final) as total_vendido
            FROM ventas v
            INNER JOIN productos p ON v.producto_id = p.id
            WHERE ${whereClause}
            GROUP BY p.id, p.categoria, p.name, p.tipo
            ORDER BY total_vendido DESC
        `, params);
        
        // Calcular total general
        const [totalGeneral] = await db.query(`
            SELECT 
                COUNT(*) as total_ventas,
                SUM(precio_final) as total_general,
                SUM(CASE WHEN metodo_pago = 'Efectivo' THEN precio_final ELSE 0 END) as total_efectivo,
                SUM(CASE WHEN metodo_pago = 'Debito' THEN precio_final ELSE 0 END) as total_debito,
                SUM(CASE WHEN metodo_pago = 'Credito' THEN precio_final ELSE 0 END) as total_credito
            FROM ventas
            WHERE ${whereClause}
        `, params);
        
        return res.status(200).json({
            ventas,
            resumen: {
                totales_por_metodo: totalesMetodo,
                totales_por_producto: totalesProducto,
                total_general: totalGeneral[0] || {
                    total_ventas: 0,
                    total_general: 0,
                    total_efectivo: 0,
                    total_debito: 0,
                    total_credito: 0
                }
            },
            filtros: {
                fecha_inicio: fecha_inicio || null,
                fecha_fin: fecha_fin || null
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Obtener ventas del carrito de una vendedora (ventas pendientes o del día)
export async function getCarritoVendedora(req, res) {
    try {
        const vendedora_id = req.user.userId;
        const { fecha } = req.query; // Opcional: filtrar por fecha específica
        
        let query = `
            SELECT v.*, 
                   p.name as producto_nombre,
                   p.tipo as producto_tipo,
                   p.categoria as producto_categoria,
                   p.imagen as producto_imagen
            FROM ventas v
            INNER JOIN productos p ON v.producto_id = p.id
            WHERE v.vendedora_id = ?
        `;
        
        const params = [vendedora_id];
        
        if (fecha) {
            query += " AND DATE(v.fecha_venta) = ?";
            params.push(fecha);
        } else {
            // Por defecto, mostrar ventas del día actual
            query += " AND DATE(v.fecha_venta) = CURDATE()";
        }
        
        query += " ORDER BY v.fecha_venta DESC";
        
        const [ventas] = await db.query(query, params);
        
        // Calcular total del carrito
        let totalQuery = `
            SELECT 
                COUNT(*) as cantidad_ventas,
                SUM(precio_final) as total_carrito
            FROM ventas
            WHERE vendedora_id = ?
        `;
        const totalParams = [vendedora_id];
        
        if (fecha) {
            totalQuery += " AND DATE(fecha_venta) = ?";
            totalParams.push(fecha);
        } else {
            totalQuery += " AND DATE(fecha_venta) = CURDATE()";
        }
        
        const [total] = await db.query(totalQuery, totalParams);
        
        return res.status(200).json({
            ventas,
            resumen: total[0] || { cantidad_ventas: 0, total_carrito: 0 }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

