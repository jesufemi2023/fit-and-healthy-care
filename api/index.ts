import { createServer } from "../server.js";

let app: any;

export default async (req: any, res: any) => {
  try {
    if (!app) {
      app = await createServer();
    }
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
