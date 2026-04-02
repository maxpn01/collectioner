export class Failure {}
export class NotFoundFailure extends Failure {}
export class NotAuthorizedFailure extends Failure {}
export class BadRequestFailure extends Failure {}
export class ValidateLengthFailure extends Failure {
	satisfiesMinLength: boolean;
	satisfiesMaxLength: boolean;

	constructor({
		satisfiesMinLength,
		satisfiesMaxLength,
	}: {
		satisfiesMinLength: boolean;
		satisfiesMaxLength: boolean;
	}) {
		super();

		const isValid = satisfiesMinLength && satisfiesMaxLength;
		if (isValid) throw new Error("This failure is not really a failure");

		this.satisfiesMinLength = satisfiesMinLength;
		this.satisfiesMaxLength = satisfiesMaxLength;
	}
}
