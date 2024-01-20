import { Request, Response, NextFunction } from "express";

export const requireAuth = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	//@ts-ignore
	if (req.session.userId) next();
	else res.redirect("/signin/email");
};
