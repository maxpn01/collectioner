import { Failure, BadRequestFailure } from "./utils/failure";

export class HttpFailure extends Failure {
	status: number;

	constructor(status: number) {
		super();
		this.status = status;
	}
}
export class JsonHttpFailure extends HttpFailure {
	json: any;

	constructor(status: number, json: any) {
		super(status);
		this.json = json;
	}
}

export class HttpFailurePresenter {
	execute(failure: Failure): HttpFailure {
		if (failure instanceof BadRequestFailure) {
			return new HttpFailure(400);
		}

		throw new Error("Not implemented");
	}
}

import { Response } from "express";

export function expressSendHttpFailure(failure: HttpFailure, res: Response) {
	if (failure instanceof JsonHttpFailure) {
		const { status, json } = failure;
		res.status(status).send(json);
		return;
	}

	res.status(failure.status).send();
}
