import { PrismaUserRepository } from "../user";
import {
	SignInWithEmailUseCase,
	SignInHttpFailurePresenter,
	JsonSignInWithEmailController,
	ExpressSignInWithEmail,
} from "../user/signin";

export const prismaUserRepository = new PrismaUserRepository();

import {
	SignUpWithEmailUseCase,
	SignUpHttpFailurePresenter,
	JsonSignUpWithEmailController,
	ExpressSignUpWithEmail,
} from "../user/signup";
import { expressApp, httpFailurePresenter } from "./http";

const signUpWithEmail = new SignUpWithEmailUseCase(prismaUserRepository);
const jsonSignUpWithEmailController = new JsonSignUpWithEmailController();
const signUpHttpFailurePresenter = new SignUpHttpFailurePresenter();
const expressSignUpWithEmail = new ExpressSignUpWithEmail(
	signUpWithEmail,
	jsonSignUpWithEmailController,
	signUpHttpFailurePresenter,
	httpFailurePresenter,
);

expressApp.post("/signup/email", expressSignUpWithEmail.execute);

const signInWithEmail = new SignInWithEmailUseCase(prismaUserRepository);
const jsonSignInWithEmailController = new JsonSignInWithEmailController();
const signInHttpFailurePresenter = new SignInHttpFailurePresenter();
const expressSignInWithEmail = new ExpressSignInWithEmail(
	signInWithEmail,
	jsonSignInWithEmailController,
	signInHttpFailurePresenter,
	httpFailurePresenter,
);

expressApp.post("/signin/email", expressSignInWithEmail.execute);
