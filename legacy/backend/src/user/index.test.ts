import { User } from ".";

export function createTestUser(id: string): User {
	return {
		id,
		email: "",
		username: "",
		fullname: "",
		blocked: false,
		isAdmin: false,
		passwordHash: "",
	};
}
