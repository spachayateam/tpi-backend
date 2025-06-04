import db from "../config/connection.js";

export async function createMessage(req, res) {
  try {
    const name = req.body?.name;
    const email = req.body?.email;
    const subject = req.body?.subject;
    const message = req.body?.message;

    if (!name || !email || !subject || !message)
      return res.status(400).send({ message: "Missing parameters" });

    const [exec] = await db.execute(
      "INSERT INTO messages (name, email, subject, message) VALUES(?, ?, ?, ?)",
      [name, email, subject, message]
    );

    if (!exec.affectedRows) return res.status(400).send({ message: "Failed to create message" });

    return res.send({ message: "Message sent" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
}
