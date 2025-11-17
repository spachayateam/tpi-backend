import { ROLES } from "../helper/constants.js";

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Acceso denegado. Se requieren permisos de: " + allowedRoles.join(", ") 
      });
    }

    next();
  };
}

export const requireAdmin = requireRole(ROLES.ADMIN);
export const requireSeller = requireRole(ROLES.SELLER);
export const requireAdminOrSeller = requireRole(ROLES.ADMIN, ROLES.SELLER);

