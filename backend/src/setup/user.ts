import { PrismaUserRepository } from "../user";
import {
	ExpressSetUserBlocked,
	ExpressSetUserIsAdmin,
	SetUserBlockedUseCase,
	SetUserIsAdminUseCase,
} from "../user/admin";
import { DeleteUserUseCase, ExpressDeleteUser } from "../user/delete-user";
import { SignInWithEmailUseCase, ExpressSignInWithEmail } from "../user/signin";
import { ExpressSignOut } from "../user/signout";

export const prismaUserRepository = new PrismaUserRepository();

import { SignUpWithEmailUseCase, ExpressSignUpWithEmail } from "../user/signup";
import { ExpressViewUser, ViewUserUseCase } from "../user/view-user";
import { expressApp } from "./http";
import { requireAuth } from "./middleware/auth";

const signUpWithEmail = new SignUpWithEmailUseCase(prismaUserRepository);
const expressSignUpWithEmail = new ExpressSignUpWithEmail(signUpWithEmail);
expressApp.post("/signup/email", expressSignUpWithEmail.execute);

const signInWithEmail = new SignInWithEmailUseCase(prismaUserRepository);
const expressSignInWithEmail = new ExpressSignInWithEmail(signInWithEmail);
expressApp.post("/signin/email", expressSignInWithEmail.execute);

const expressSignOut = new ExpressSignOut();
expressApp.post("/signout", expressSignOut.execute);

const setUserIsAdmin = new SetUserIsAdminUseCase(prismaUserRepository);
const expressSetUserIsAdmin = new ExpressSetUserIsAdmin(setUserIsAdmin);
expressApp.put("/user/is-admin", requireAuth, expressSetUserIsAdmin.execute);

const setUserBlocked = new SetUserBlockedUseCase(prismaUserRepository);
const expressSetUserBlocked = new ExpressSetUserBlocked(setUserBlocked);
expressApp.put("/user/blocked", requireAuth, expressSetUserBlocked.execute);

const deleteUser = new DeleteUserUseCase(prismaUserRepository);
const expressDeleteUser = new ExpressDeleteUser(deleteUser);
expressApp.delete("/user", requireAuth, expressDeleteUser.execute);

const viewUser = new ViewUserUseCase(prismaUserRepository);
const expressViewUser = new ExpressViewUser(viewUser);
expressApp.get("/user", expressViewUser.execute);
