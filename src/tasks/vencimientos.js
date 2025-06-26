import cron from "node-cron";
import db from "../config/connection.js";

export const ejecutarVencimientoCita = async () => {
  cron.schedule("00 00 * * *", async () => {
    console.log("Ejecutando el cron para vencimientos");
    
    const [query] = await db.query(
      `select id from appointments
        where state = 'PENDIENTE'
        and concat(date, ' ', str_to_date(substring_index(time, ' - ', -1), '%H:%i')) <= now();
      `
    );

    if (!query.length) return;

    const ids = query.map((q) => q.id);

    console.log({ ids });

    const [exec] = await db.execute(
      `update appointments
        set state = 'VENCIDO'
        where id in (${ids});`
    );

    console.log(exec);
  });
};