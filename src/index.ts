import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	// const user = await prisma.user.create({
	// 	data: {
	// 		id: "john1",
	// 		email: "john@gmail.com",
	// 		username: "john-doe",
	// 		fullname: "John Doe",
	// 		blocked: false,
	// 		isAdmin: true,
	// 		passwordHash: "1234567890",
	// 	},
	// });

	const users = await prisma.user.findMany();
	console.log(users);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
