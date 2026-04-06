import {
	ArgumentMetadata,
	BadRequestException,
	Injectable,
	PipeTransform,
} from '@nestjs/common';
import { ZodType, treeifyError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
	constructor(private schema: ZodType) {}

	transform(value: unknown, _metadata: ArgumentMetadata) {
		const { success, error, data } = this.schema.safeParse(value);

		if (!success) {
			throw new BadRequestException({
				message: 'Validation failed',
				errors: treeifyError(error),
			});
		}

		return data;
	}
}
