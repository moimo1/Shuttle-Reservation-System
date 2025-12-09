import jwt from "jsonwebtoken";
import User from "../models/User.js";
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "No token provided" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user)
            return res.status(401).json({ message: "Invalid token" });
        req.user = user;
        next();
    }
    catch (err) {
        res.status(401).json({ message: "Token error" });
    }
};
export default authMiddleware;
//# sourceMappingURL=authMiddleware.js.map