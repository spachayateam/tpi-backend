import crypto from "crypto";

import db from "../config/connection.js";

export async function create(req, res) {
  const userId = req.user?.userId ?? '';

  // buscar usuario por id
  const [query] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

  //validar que el usuario exista
  if (!query.length) return res.status(400).send({ message: "Invalid user" });

  const [userFound] = query;

  try {

    const date = req.body?.date;
    const time = req.body?.time;
    const professional = req.body?.professional;
    const duration = req.body?.duration;
    const mode = req.body?.mode;
    const payment_method = req.body?.payment_method;

    if (
      !date ||
      !time ||
      !professional ||
      !duration ||
      !payment_method ||
      !mode
    ) {
      return res.status(400).send({ message: "Missing parameters" });
    }

    if (isNaN(new Date(date).getTime())) {
      return res.status(400).send({ message: "Invalid date format" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const userId = userFound.id;
    const name = userFound.name;
    const phone_number = userFound.phone;

    // evitar registro de turnos repetidos
    const [qtyTurno] = await db.query("SELECT * FROM appointments WHERE mode = ?", [mode]);
    if (qtyTurno.length > 0) return res.status(400).send({ message: "No se puede registrar un turno repetido" });

    const [exec] = await db.execute(
      "INSERT INTO appointments (userId, name, phone_number, date, time, professional, duration, mode, payment_method, token) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, name, phone_number, date, time, professional, duration, mode, payment_method, token]
    );

    if (!exec.affectedRows)
      return res.status(400).send({ message: "Failed to register appointment" });

    const [query] = await db.query("SELECT * FROM appointments WHERE id = ?", [exec.insertId]);

    return res.send(query[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
}

export async function getList(req, res) {
  const userId = req.user?.userId ?? '';
  const [query] = await db.query("SELECT * FROM appointments WHERE userId = ?", [userId]);
  return res.send(query);
}

export async function remove(req, res) {
  try {
    const token = req.params?.turnoToken;

    if (!token) return res.status(400).send({ message: "Missing token" });

    const [query] = await db.query("SELECT * FROM appointments WHERE token = ?", [token]);
    if (!query.length) return res.status(400).send({ message: "Invalid token" });

    const [exec] = await db.execute("DELETE FROM appointments WHERE token = ?", [token]);
    if (!exec.affectedRows)
      return res.status(400).send({ message: "Failed to delete appointment" });

    return res.send({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
}
