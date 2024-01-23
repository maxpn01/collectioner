import { Navigate } from "react-router-dom";
import { userPageRoute } from "./user/view-user";

export const homePageRoute = "/" as const;
export function HomePage() {
	return <Navigate to={userPageRoute} />;
}
