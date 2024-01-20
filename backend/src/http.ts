import {
	Failure,
	BadRequestFailure,
	NotAuthorizedFailure,
	NotFoundFailure,
} from "./utils/failure";

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

export function httpFailurePresenter(failure: Failure): HttpFailure {
	if (failure instanceof BadRequestFailure) {
		return new HttpFailure(400);
	}

	if (failure instanceof NotAuthorizedFailure) {
		return new HttpFailure(401);
	}

	if (failure instanceof NotFoundFailure) {
		return new HttpFailure(404);
	}

	console.error("Unexpected error:", failure);
	return new HttpFailure(500);
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
