import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies?.tivit_token;
  if (!token) {
    return res.status(401).json({ error: "No autenticado" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}
