import bcrypt from "bcrypt";

import db from "../config/connection.js";
import { ROLES } from "../helper/constants.js";
import jwt from "jsonwebtoken";

export async function loginProfessional(req, res) {
    try {
        const email = req.body?.email;
        const password = req.body?.password;

        if (!email || !password) return res.status(400).send({ message: "Missing email or password" });

        const [query] = await db.query("SELECT * FROM professional WHERE email = ?", [email]);
        if (!query.length) return res.status(401).send({ message: "Invalid email or password" });

        const user = query[0];

        if (user.role !== 'PROFESSIONAL') return res.status(401).send({ message: "No autorizado" });

        const compare = await bcrypt.compare(password, user.password);
        if (!compare) return res.status(401).send({ message: "Invalid email or password" });

        req.session.user = user.id;

        const token = jwt.sign({
            userId: user.id,
            role: user.role,
            name: user.name,
        }, process.env.SECRET_KEY, {
            expiresIn: "1d",
        });

        return res.send({ accessToken: token });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Internal server error" });
    }
}

export async function registerProfessional(req, res) {
    try {
        const email = req.body?.email ?? "";
        const password = req.body?.password;
        const name = req.body?.nombre;
        const phone = req.body?.phone;
        const role = ROLES.PREPROFESSIONAL;
        const section = req.body?.section;
        const age = req.body?.age;

        if (!email || !password || !name || !phone || !section || !age)
            return res.status(400).send({ message: "Datos requeridos: email, password, nombre, phone" });

        const [query] = await db.query("SELECT * FROM professional WHERE email = ?", [email]);
        if (query.length > 0) return res.status(409).send({ message: "Email already exists" });

        const hash = await bcrypt.hash(password, 10);

        const [exec] = await db.execute(
            "INSERT INTO professional (email, password, name, phone, section, age, role) VALUES(?, ?, ?, ?, ?, ?, ?)",
            [email, hash, name, phone, section, age, role]
        );

        if (!exec.affectedRows) return res.status(400).send({ message: "Failed to register user" });

        return res.send({ message: "Usuario registrado con éxito" });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

export async function getAllProfessionals(req, res) {
    try {
        const isADMIN = req.headers?.role === 'ADMIN';
        if (isADMIN) {
            const [query] = await db.query("SELECT age, created_at, id, name, phone, role, section, updated_at FROM professional");
            return res.send(query);
        }
        return res.send("Invalid token");
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Internal server error" });
    }
}

export async function deleteProfessional(req, res) {
    try {
        const isADMIN = req.headers?.role === 'ADMIN';
        if (isADMIN) {
            const id = req.params?.id;
            await db.query("DELETE FROM professional WHERE id = ?", [id]);

            return res.status(200).send({ message: "Profesional eliminado con éxito" });
        }
        return res.send("Invalid token");
    }
    catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}

export async function updateRoleProfessional(req, res) {
    try {
        const isADMIN = req.body?.roleOfAdmin === 'ADMIN';
        if (isADMIN) {
            const id = req.params?.id;
            const role = req.body?.role;
            await db.query("UPDATE professional SET role = ? WHERE id = ?", [role, id]);
            return res.status(200).send({ message: "El rol de profesional se actualizo con exito" });
        }
        return res.send("Invalid token");
    }
    catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Server internal error" });
    }
}