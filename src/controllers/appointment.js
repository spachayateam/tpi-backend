import { sendConfirmationEmail } from "../helper/email.js";
import crypto from "crypto";
import { DateTime } from "luxon";

import db from "../config/connection.js";

export async function create(req, res) {
  const userId = req.user?.userId ?? "";

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
    const [qtyTurno] = await db.query(
      "SELECT * FROM appointments WHERE mode = ? and state = 'PENDIENTE'",
      [mode]
    );
    if (qtyTurno.length > 0)
      return res
        .status(400)
        .send({ message: "No se puede registrar un turno repetido" });

    const [exec] = await db.execute(
      "INSERT INTO appointments (userId, name, phone_number, date, time, professional, duration, mode, payment_method, token) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        name,
        phone_number,
        date,
        time,
        professional,
        duration,
        mode,
        payment_method,
        token,
      ]
    );

    if (!exec.affectedRows)
      return res
        .status(400)
        .send({ message: "Failed to register appointment" });

      // Enviar comprobante por email
        await sendConfirmationEmail(userFound.email, {
       name,
       date,
       time,
       professional,
       duration,
       payment_method,
       token,
        });


    const [query] = await db.query("SELECT * FROM appointments WHERE id = ?", [
      exec.insertId,
    ]);

    return res.send({ message: "Turno guardado y comprobante enviado exitosamente" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
}

export async function getList(req, res) {
  const userId = req.user?.userId ?? "";

  if (req.user.role === 'PROFESSIONAL') {
    const [query] = await db.query(
      "SELECT * FROM appointments a WHERE professionalId = ? order by date asc, STR_TO_DATE(SUBSTRING_INDEX(a.time, ' -', 1), '%H:%i') ASC",
      [userId]
    );
    return res.send(query);
  }

  if (req.user.role !== "ADMIN") {
    const [query] = await db.query(
      "SELECT * FROM appointments a WHERE userId = ? order by date asc, STR_TO_DATE(SUBSTRING_INDEX(a.time, ' -', 1), '%H:%i') ASC",
      [userId]
    );
    return res.send(query);
  }

  const [query] = await db.query(
    "SELECT * FROM appointments a order by date asc, STR_TO_DATE(SUBSTRING_INDEX(a.time, ' -', 1), '%H:%i') ASC"
  );
  return res.send(query);
}

export async function getServices(req, res) {
  try {
    const [query] = await db.query("SELECT s.*, p.name as professional FROM servicios s join professional p on s.professionalId = p.id");
    return res.send(query);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ statusText: "Internal server error" });
  }
}

export async function createService(req, res) {
  const service = req.body;
  try {
    await db.query("INSERT INTO servicios SET ?", service);
    return res.status(200).send({ message: "Servicio agregado con éxito" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
}

export async function updateServices(req, res) {
  const serviceData = req.body;
  try {
    const id = req.params.id;
    await db.query("UPDATE servicios SET ? WHERE id = ?", [serviceData, id]);
    return res.status(200).send({ message: "Servicio actualizado con éxito" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
}

export async function deleteService(req, res) {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM servicios WHERE id = ?", [id]);
    return res.status(200).send({ message: "Servicio eliminado con éxito" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
}

export async function remove(req, res) {
  try {
    const token = req.params?.turnoToken;

    if (!token) return res.status(400).send({ message: "Missing token" });

    const [query] = await db.query(
      "SELECT * FROM appointments WHERE token = ?",
      [token]
    );
    if (!query.length)
      return res.status(400).send({ message: "Invalid token" });

    const [exec] = await db.execute(
      "UPDATE appointments SET state = 'CANCELADO' WHERE token = ?",
      [token]
    );
    if (!exec.affectedRows)
      return res.status(400).send({ message: "Failed to delete appointment" });

    return res.send({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
}
