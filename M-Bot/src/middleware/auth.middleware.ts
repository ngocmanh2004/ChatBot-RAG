import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response.util";
import type UserPayload from "../models/userPayload.model";
const ACCESS_TOKEN_SECRET = Bun.env.ACCESS_TOKEN_SECRET || '';

interface RequestWithUser extends Request {
  user?: UserPayload
}

const authenticateAccessToken = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader?.split(" ")[1];

    if (!accessToken) {
      errorResponse(res, 401, "Unauthorized", "Access token is required!");
      return
    }

    const decodedAccessToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as UserPayload;
    req.user = decodedAccessToken;
    next();
  } catch (err: unknown) {
    errorResponse(res, 401, "Unauthorized", "User is not authenticated!");
  }
};

const authorizeRoles = (roles: string[] = [], subscriptions?: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const hasValidRole =
      roles.length === 0 ||
      Boolean(req?.user?.role && roles.includes(req.user.role));
    const hasValidSubscription =
      !subscriptions ||
      subscriptions.length === 0 ||
      Boolean(
        req?.user?.subscription &&
          subscriptions.includes(req.user.subscription)
      );

    if (!(hasValidRole && hasValidSubscription)) {
      errorResponse(res, 403, "Forbidden", "You do not have permission to access this resource!");
      return;
    }

    next();
  };
};

const validate = (cb: (req: Request) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      cb(req);
      next();
    } catch (err: unknown) {
      if (err instanceof Error) {
        errorResponse(res, 400, "Bad Request", err.message);
      }
    }
  };
};

export { authenticateAccessToken, authorizeRoles, validate };
