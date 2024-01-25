import { Request, Response, NextFunction } from "express";

export const requireAuth = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	//@ts-ignore
	// console.log(req.session.userId);
	//@ts-ignore
	if (req.session.userId) next();
	else res.redirect("/signin");
};
