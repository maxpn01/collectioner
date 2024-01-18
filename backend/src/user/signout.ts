import { Request, Response } from "express";

export class ExpressSignOut {
	constructor() {
		this.execute = this.execute.bind(this);
	}

	async execute(req: Request, res: Response): Promise<void> {
		req.session.destroy(() => {
			res.status(200).send();
		});
	}
}
