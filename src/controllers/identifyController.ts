import { Request, Response } from 'express';
import { processIdentity } from '../services/identifyService';

export const identify = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    // Ensure at least one piece of information is provided
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "Email or phone number is required" });
    }

    // Call the core service logic
    const result = await processIdentity(email, String(phoneNumber));
    
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};