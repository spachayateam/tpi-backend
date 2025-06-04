export default function authMiddleware(req, res, next) {
  if (req.session?.user) {
    return next();
  }

  return res.status(401).send({ error: "Unauthorized" });
}
