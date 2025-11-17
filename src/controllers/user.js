import bcrypt from "bcrypt";

import db from "../config/connection.js";
import { ROLES } from "../helper/constants.js";
import jwt from "jsonwebtoken";

export async function login(req, res) {
  try {
    const email = req.body?.email;
    const password = req.body?.password;

    if (!email || !password) return res.status(400).send({ message: "Missing email or password" });

    const [query] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!query.length) return res.status(401).send({ message: "Invalid email or password" });

    const user = query[0];

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

export async function register(req, res) {
  try {
    const email = req.body?.email ?? "";
    const password = req.body?.password;
    const name = req.body?.nombre;
    const phone = req.body?.phone;
    const role = ROLES.USER;
    // const birthdate = req.body?.birthdate;

    if (!email || !password || !name || !phone)
      return res.status(400).send({ message: "Datos requeridos: email, password, nombre, phone" });

    // const date = new Date(birthdate);
    // if (isNaN(date.getTime())) return res.status(400).send({ message: "Invalid birthdate format" });

    const [query] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (query.length > 0) return res.status(409).send({ message: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);

    const [exec] = await db.execute(
      "INSERT INTO users (email, password, name, phone, role) VALUES(?, ?, ?, ?, ?)",
      [email, hash, name, phone, role]
    );

    if (!exec.affectedRows) return res.status(400).send({ message: "Failed to register user" });

    return res.send({ message: "Usuario registrado con éxito" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Server internal error" });
  }
}

export async function logout(req, res) {
  try {
    req.session = null;

    return res.send({ message: "Session destroyed" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
}

export async function getAllUsers(req, res) {
  try {
    const [results] = await db.query("SELECT id, email, created_at, updated_at FROM users");

    return res.send(results);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Server internal error" });
  }
}
