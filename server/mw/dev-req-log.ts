import { Request, Response, NextFunction } from "express";

export const devReqLogMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "development") {
    const start = Date.now();
    const originalSend = res.send;
    
    res.send = function(body) {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
      return originalSend.call(this, body);
    };
  }
  
  next();
};

