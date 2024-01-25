import env from "@/env";
import { Failure } from "@/utils/failure";
import { Err, None, Ok, Result } from "ts-results";

export async function httpDeleteCollectionService(
	id: string,
): Promise<Result<None, Failure>> {
	const res = await fetch(`${env.backendApiBase}/collection`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({id}),
		credentials: "include",
	});
	if (!res.ok) {
		return Err(new Failure());
	}

	return Ok(None);
}
