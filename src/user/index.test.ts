import { User } from ".";

export function createTestUser(id: string): User {
	return {
		id,
		email: "",
		fullname: "",
		blocked: false,
		isAdmin: false,
		passwordHash: "",
	};
}
