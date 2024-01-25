import { computed, useComputed } from "@preact/signals-react";
import { Navigate } from "react-router-dom";
import { authenticatedUserState } from "./user/auth";
import { signInPageRoute } from "./user/signin";

const redirectLink = computed(() => {
	const authenticatedUserOption = authenticatedUserState.value;
	if (authenticatedUserOption.none) return signInPageRoute;
	const authenticatedUser = authenticatedUserOption.val;

	return authenticatedUser.link;
});

export const homePageRoute = "/" as const;
export function HomePage() {
	return useComputed(() => <Navigate to={redirectLink.value} />);
}
