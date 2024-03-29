import { PrismaUserRepository } from "../user";
import {
	ExpressUserBlockedSetMany,
	ExpressUserIsAdminSetMany,
	UserBlockedSetManyUseCase,
	UserIsAdminSetManyUseCase,
} from "../user/admin";
import {
	UserDeleteManyUseCase,
	ExpressUserDeleteMany,
} from "../user/delete-user";
import { SignInWithEmailUseCase, ExpressSignInWithEmail } from "../user/signin";
import { ExpressSignOut } from "../user/signout";

export const prismaUserRepository = new PrismaUserRepository();

import { SignUpWithEmailUseCase, ExpressSignUpWithEmail } from "../user/signup";
import {
	AdminViewUsersUseCase,
	ExpressAdminViewUsers,
	ExpressViewUser,
	ViewUserUseCase,
} from "../user/view-user";
import { expressApp } from "./http";
import { requireAuth } from "./middleware/auth";

const signUpWithEmail = new SignUpWithEmailUseCase(prismaUserRepository);
const expressSignUpWithEmail = new ExpressSignUpWithEmail(signUpWithEmail);
expressApp.post("/api/signup/email", expressSignUpWithEmail.execute);

const signInWithEmail = new SignInWithEmailUseCase(prismaUserRepository);
const expressSignInWithEmail = new ExpressSignInWithEmail(signInWithEmail);
expressApp.post("/api/signin/email", expressSignInWithEmail.execute);

const expressSignOut = new ExpressSignOut();
expressApp.post("/api/signout", requireAuth, expressSignOut.execute);

const setUserIsAdmin = new UserIsAdminSetManyUseCase(prismaUserRepository);
const expressSetUserIsAdmin = new ExpressUserIsAdminSetMany(setUserIsAdmin);
expressApp.put(
	"/api/user/is-admin",
	requireAuth,
	expressSetUserIsAdmin.execute,
);

const userBlockedSetMany = new UserBlockedSetManyUseCase(prismaUserRepository);
const expressUserBlockedSetMany = new ExpressUserBlockedSetMany(
	userBlockedSetMany,
);
expressApp.put(
	"/api/user/blocked",
	requireAuth,
	expressUserBlockedSetMany.execute,
);

const userDeleteMany = new UserDeleteManyUseCase(prismaUserRepository);
const expressUserDeleteMany = new ExpressUserDeleteMany(userDeleteMany);
expressApp.delete("/api/user", requireAuth, expressUserDeleteMany.execute);

const viewUser = new ViewUserUseCase(prismaUserRepository);
const expressViewUser = new ExpressViewUser(viewUser);
expressApp.get("/api/user", expressViewUser.execute);

const adminViewUsers = new AdminViewUsersUseCase(prismaUserRepository);
const expressAdminViewUsers = new ExpressAdminViewUsers(adminViewUsers);
expressApp.get("/api/users", requireAuth, expressAdminViewUsers.execute);
