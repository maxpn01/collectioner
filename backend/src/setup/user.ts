import { PrismaUserRepository } from "../user";

export const prismaUserRepository = new PrismaUserRepository();

import {
	SignUpJsonHttpFailurePresenter,
	JsonSignUpWithEmailController,
	SignUpWithEmailUseCase,
	ExpressSignUpWithEmail,
} from "../user/signup";
import { expressApp, httpFailurePresenter } from "./http";

const signUpWithEmail = new SignUpWithEmailUseCase(prismaUserRepository);
const jsonSignUpWithEmailController = new JsonSignUpWithEmailController();
const signUpJsonHttpFailurePresenter = new SignUpJsonHttpFailurePresenter();
const expressSignUpWithEmail = new ExpressSignUpWithEmail(
	signUpWithEmail,
	jsonSignUpWithEmailController,
	signUpJsonHttpFailurePresenter,
	httpFailurePresenter,
);

expressApp.post("/signup/email", expressSignUpWithEmail.execute);
