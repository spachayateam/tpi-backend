import db from "../config/connection.js";

// Obtener todos los productos (vendedora puede ver stock, admin puede ver todo)
export async function getProductos(req, res) {
    try {
        // Intentar obtener productos con diferentes estrategias según lo que esté disponible
        let productos;
        let errorPrincipal = null;
        
        // Estrategia 1: Con JOIN de proveedores y orden por created_at
        try {
            const [productosConFecha] = await db.query(`
                SELECT p.*, pr.nombre as proveedor_nombre 
                FROM productos p 
                LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
                ORDER BY p.created_at DESC
            `);
            productos = productosConFecha;
        } catch (err) {
            errorPrincipal = err;
            console.warn('Estrategia 1 falló, intentando estrategia 2:', err.message);
            
            // Estrategia 2: Con JOIN pero sin created_at
            try {
                const [productosSinFecha] = await db.query(`
                    SELECT p.*, pr.nombre as proveedor_nombre 
                    FROM productos p 
                    LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
                    ORDER BY p.id DESC
                `);
                productos = productosSinFecha;
            } catch (err2) {
                console.warn('Estrategia 2 falló, intentando estrategia 3:', err2.message);
                
                // Estrategia 3: Sin JOIN de proveedores
                try {
                    const [productosSimples] = await db.query(`
                        SELECT p.*
                        FROM productos p
                        ORDER BY p.id DESC
                    `);
                    productos = productosSimples;
                } catch (err3) {
                    console.error('Todas las estrategias fallaron. Error final:', err3);
                    throw err3;
                }
            }
        }
        
        return res.status(200).json(productos || []);
    } catch (err) {
        console.error('Error en getProductos:', err);
        return res.status(500).json({ 
            error: "Server internal error",
            message: err.message,
            details: "Verifique la conexión a la base de datos y que la tabla 'productos' exista"
        });
    }
}

// Obtener un producto por ID
export async function getProductoById(req, res) {
    try {
        const { id } = req.params;
        
        const [productos] = await db.query(`
            SELECT p.*, pr.nombre as proveedor_nombre 
            FROM productos p 
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            WHERE p.id = ?
        `, [id]);
        
        if (productos.length === 0) {
            return res.status(404).send({ message: "Producto no encontrado" });
        }
        
        return res.status(200).json(productos[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Crear producto (solo admin)
export async function createProducto(req, res) {
    try {
        const { name, tipo, categoria, precio, descripcion, imagen, stock, proveedor_id } = req.body;
        
        if (!name || !tipo || !categoria || !precio || stock === undefined) {
            return res.status(400).send({ 
                message: "Datos requeridos: name, tipo, categoria, precio, stock" 
            });
        }
        
        // Aceptar diferentes variaciones de tipo/categoría
        const tipoNormalizado = tipo?.trim();
        if (tipoNormalizado && !['Skincare', 'Relajacion', 'skincare', 'relajacion', 'Relajación', 'relajación'].includes(tipoNormalizado)) {
            return res.status(400).send({ 
                message: "Tipo debe ser 'Skincare' o 'Relajacion'" 
            });
        }
        
        const [result] = await db.execute(
            `INSERT INTO productos (name, tipo, categoria, precio, descripcion, imagen, stock, proveedor_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, tipo, categoria, precio, descripcion || '', imagen || '', stock, proveedor_id || null]
        );
        
        if (!result.affectedRows) {
            return res.status(400).send({ message: "Error al crear el producto" });
        }
        
        return res.status(201).send({ 
            message: "Producto creado con éxito", 
            id: result.insertId 
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Actualizar producto (solo admin)
export async function updateProducto(req, res) {
    try {
        const { id } = req.params;
        const { name, tipo, categoria, precio, descripcion, imagen, stock, proveedor_id } = req.body;
        
        // Verificar que el producto existe
        const [productos] = await db.query("SELECT * FROM productos WHERE id = ?", [id]);
        if (productos.length === 0) {
            return res.status(404).send({ message: "Producto no encontrado" });
        }
        
        // Construir query dinámicamente
        const updates = [];
        const values = [];
        
        if (name !== undefined) { updates.push("name = ?"); values.push(name); }
        if (tipo !== undefined) { 
            if (!['Skincare', 'Relajacion'].includes(tipo)) {
                return res.status(400).send({ message: "Tipo debe ser 'Skincare' o 'Relajacion'" });
            }
            updates.push("tipo = ?"); 
            values.push(tipo); 
        }
        if (categoria !== undefined) { updates.push("categoria = ?"); values.push(categoria); }
        if (precio !== undefined) { updates.push("precio = ?"); values.push(precio); }
        if (descripcion !== undefined) { updates.push("descripcion = ?"); values.push(descripcion); }
        if (imagen !== undefined) { updates.push("imagen = ?"); values.push(imagen); }
        if (stock !== undefined) { updates.push("stock = ?"); values.push(stock); }
        if (proveedor_id !== undefined) { updates.push("proveedor_id = ?"); values.push(proveedor_id || null); }
        
        if (updates.length === 0) {
            return res.status(400).send({ message: "No hay campos para actualizar" });
        }
        
        values.push(id);
        
        await db.execute(
            `UPDATE productos SET ${updates.join(", ")} WHERE id = ?`,
            values
        );
        
        return res.status(200).send({ message: "Producto actualizado con éxito" });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Eliminar producto (solo admin)
export async function deleteProducto(req, res) {
    try {
        const { id } = req.params;
        
        const [result] = await db.execute("DELETE FROM productos WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Producto no encontrado" });
        }
        
        return res.status(200).send({ message: "Producto eliminado con éxito" });
    } catch (err) {
        console.error(err);
        // Si hay una foreign key constraint, no se puede eliminar
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).send({ 
                message: "No se puede eliminar el producto porque tiene ventas asociadas" 
            });
        }
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Obtener productos por tipo
export async function getProductosByTipo(req, res) {
    try {
        const { tipo } = req.params;
        
        if (!['Skincare', 'Relajacion'].includes(tipo)) {
            return res.status(400).send({ message: "Tipo inválido" });
        }
        
        const [productos] = await db.query(`
            SELECT p.*, pr.nombre as proveedor_nombre 
            FROM productos p 
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            WHERE p.tipo = ?
            ORDER BY p.categoria, p.name
        `, [tipo]);
        
        return res.status(200).json(productos);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Obtener productos por categoría
export async function getProductosByCategoria(req, res) {
    try {
        const { categoria } = req.params;
        
        const [productos] = await db.query(`
            SELECT p.*, pr.nombre as proveedor_nombre 
            FROM productos p 
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            WHERE p.categoria = ?
            ORDER BY p.name
        `, [categoria]);
        
        return res.status(200).json(productos);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Obtener stock de productos (solo vendedora)
export async function getStock(req, res) {
    try {
        let productos;
        try {
            const [productosConProveedor] = await db.query(`
                SELECT p.id, p.name, p.tipo, p.categoria, p.precio, p.stock, p.imagen, p.descripcion,
                       pr.nombre as proveedor_nombre 
                FROM productos p 
                LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
                ORDER BY p.categoria, p.tipo, p.name
            `);
            productos = productosConProveedor;
        } catch (err) {
            // Si falla con proveedores, intentar sin el JOIN
            console.warn('Error con JOIN de proveedores, intentando sin JOIN:', err.message);
            const [productosSimples] = await db.query(`
                SELECT p.id, p.name, p.tipo, p.categoria, p.precio, p.stock, p.imagen, p.descripcion
                FROM productos p
                ORDER BY p.categoria, p.tipo, p.name
            `);
            productos = productosSimples;
        }
        
        return res.status(200).json(productos || []);
    } catch (err) {
        console.error('Error en getStock:', err);
        return res.status(500).json({ 
            error: "Server internal error",
            message: err.message,
            details: "Verifique que la tabla 'productos' existe en la base de datos"
        });
    }
}