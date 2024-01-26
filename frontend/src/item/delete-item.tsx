import { Failure } from "@/utils/failure";
import { None, Ok, Result } from "ts-results";

export async function httpDeleteItemService(): Promise<Result<None, Failure>> {
	return Ok(None);
}
