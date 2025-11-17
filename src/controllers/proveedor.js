import db from "../config/connection.js";

// Obtener todos los proveedores (solo admin)
export async function getProveedores(req, res) {
    try {
        const [proveedores] = await db.query(`
            SELECT p.*, 
                   COUNT(pr.id) as total_productos
            FROM proveedores p
            LEFT JOIN productos pr ON p.id = pr.proveedor_id
            GROUP BY p.id
            ORDER BY p.nombre
        `);
        
        return res.status(200).json(proveedores);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Obtener un proveedor por ID
export async function getProveedorById(req, res) {
    try {
        const { id } = req.params;
        
        const [proveedores] = await db.query(`
            SELECT p.*, 
                   COUNT(pr.id) as total_productos
            FROM proveedores p
            LEFT JOIN productos pr ON p.id = pr.proveedor_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [id]);
        
        if (proveedores.length === 0) {
            return res.status(404).send({ message: "Proveedor no encontrado" });
        }
        
        return res.status(200).json(proveedores[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Crear proveedor (solo admin)
export async function createProveedor(req, res) {
    try {
        const { nombre, email, telefono, direccion } = req.body;
        
        if (!nombre || !email || !telefono) {
            return res.status(400).send({ 
                message: "Datos requeridos: nombre, email, telefono" 
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send({ message: "Email inválido" });
        }
        
        const [result] = await db.execute(
            `INSERT INTO proveedores (nombre, email, telefono, direccion) 
             VALUES (?, ?, ?, ?)`,
            [nombre, email, telefono, direccion || null]
        );
        
        if (!result.affectedRows) {
            return res.status(400).send({ message: "Error al crear el proveedor" });
        }
        
        return res.status(201).send({ 
            message: "Proveedor creado con éxito", 
            id: result.insertId 
        });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "El email ya está registrado" });
        }
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Actualizar proveedor (solo admin)
export async function updateProveedor(req, res) {
    try {
        const { id } = req.params;
        const { nombre, email, telefono, direccion } = req.body;
        
        // Verificar que el proveedor existe
        const [proveedores] = await db.query("SELECT * FROM proveedores WHERE id = ?", [id]);
        if (proveedores.length === 0) {
            return res.status(404).send({ message: "Proveedor no encontrado" });
        }
        
        // Construir query dinámicamente
        const updates = [];
        const values = [];
        
        if (nombre !== undefined) { updates.push("nombre = ?"); values.push(nombre); }
        if (email !== undefined) { 
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).send({ message: "Email inválido" });
            }
            updates.push("email = ?"); 
            values.push(email); 
        }
        if (telefono !== undefined) { updates.push("telefono = ?"); values.push(telefono); }
        if (direccion !== undefined) { updates.push("direccion = ?"); values.push(direccion); }
        
        if (updates.length === 0) {
            return res.status(400).send({ message: "No hay campos para actualizar" });
        }
        
        values.push(id);
        
        await db.execute(
            `UPDATE proveedores SET ${updates.join(", ")} WHERE id = ?`,
            values
        );
        
        return res.status(200).send({ message: "Proveedor actualizado con éxito" });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).send({ message: "El email ya está registrado" });
        }
        return res.status(500).send({ error: "Server internal error" });
    }
}

// Eliminar proveedor (solo admin)
export async function deleteProveedor(req, res) {
    try {
        const { id } = req.params;
        
        const [result] = await db.execute("DELETE FROM proveedores WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Proveedor no encontrado" });
        }
        
        return res.status(200).send({ message: "Proveedor eliminado con éxito" });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

