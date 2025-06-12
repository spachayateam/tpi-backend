import cron from "node-cron";
import db from "../config/connection.js";

export const ejecutarVencimientoCita = async () => {
  cron.schedule("00 00 * * *", async () => {
    // actualizar appointments a vencido si la columna date y el rango de la columna time son anteriores al día de hoy
    const [query] = await db.query(
      "SELECT * FROM appointments WHERE state = 'ATENDIDO' AND DATE(date) < CURDATE() AND TIME(time) < CURTIME()"
    );
  });

//   select * from appointments as a
// where a.date < curdate()
// 	and STR_TO_DATE(SUBSTRING_INDEX(a.time, ' -', 1), '%H:%i') < CURTIME()
// ORDER BY 
//     a.date ASC, 
//     STR_TO_DATE(SUBSTRING_INDEX(a.time, ' -', 1), '%H:%i') ASC;
};