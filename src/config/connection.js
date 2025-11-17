import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2/promise";

const pool = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

try {
  pool.execute(
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      birthdate DATE NULL,
      role varchar(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  );

  pool.execute(`
    CREATE TABLE IF NOT EXISTS professional (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      section VARCHAR(255) NOT NULL,
      age INT NOT NULL,
      role VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  pool.execute(
    `CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      professionalId INT NOT NULL,
      state enum('PENDIENTE', 'ATENDIDO', 'CANCELADO', 'VENCIDO') NOT NULL default 'PENDIENTE',
      name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      time VARCHAR(255) NOT NULL,
      professional VARCHAR(255) NOT NULL,
      duration VARCHAR(255) NOT NULL,
      mode VARCHAR(255) NOT NULL,
      payment_method ENUM('Efectivo', 'Transferencia') NOT NULL,
      token VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      foreign key (professionalId) references professional(id)
    )`
  );

  pool.execute(
    `CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  pool.execute(`
    CREATE TABLE IF NOT EXISTS servicios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      categoria VARCHAR(255) NOT NULL,
      precio INT NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      imagen VARCHAR(255) NOT NULL,
      professionalId int NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (professionalId) REFERENCES professional(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  pool.execute(`
    CREATE TABLE IF NOT EXISTS proveedores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telefono VARCHAR(30) NOT NULL,
      direccion VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  pool.execute(`
    CREATE TABLE IF NOT EXISTS productos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      tipo ENUM('Skincare', 'Relajacion') NOT NULL,
      categoria VARCHAR(255) NOT NULL,
      precio DECIMAL(10, 2) NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      imagen VARCHAR(255) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      proveedor_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  pool.execute(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vendedora_id INT NOT NULL,
      comprador_nombre VARCHAR(255) NOT NULL,
      comprador_dni VARCHAR(20) NOT NULL,
      producto_id INT NOT NULL,
      cantidad INT NOT NULL,
      precio_unitario DECIMAL(10, 2) NOT NULL,
      descuento DECIMAL(10, 2) DEFAULT 0,
      precio_final DECIMAL(10, 2) NOT NULL,
      metodo_pago ENUM('Efectivo', 'Debito', 'Credito') NOT NULL,
      fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (producto_id) REFERENCES productos(id),
      FOREIGN KEY (vendedora_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `)

  console.log("Tables created successfully");
} catch (error) {
  console.log(error);
}


export default pool;
