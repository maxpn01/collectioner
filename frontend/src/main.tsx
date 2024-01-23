import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
	CollectionPage,
	collectionPageRoute,
} from "./collection/view-collection";
import "./index.css";
import { ItemPage, itemPageRoute } from "./item/view-item";
import { UserPage, userPageRoute } from "./user/view-user";
import { SignInPage, signInPageRoute } from "./user/signin";
import { SignUpPage, signUpPageRoute } from "./user/signup";
import { CreateItemPage, createItemPageRoute } from "./item/create-item";
import {
	EditCollectionPage,
	editCollectionPageRoute,
} from "./collection/edit-collection";
import { HomePage, homePageRoute } from "./home";
import { EditItemPage, editItemPageRoute } from "./item/edit-item";
import { SearchPage, searchPageRoute } from "./item/search";
import { PageTemplate } from "./page-template";
import { DashboardPage, dashboardPageRoute } from "./admin/dashboard";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path={signInPageRoute} element={<SignInPage />} />
				<Route path={signUpPageRoute} element={<SignUpPage />} />
				<Route
					path="/*"
					element={
						<PageTemplate>
							<Routes>
								<Route path={homePageRoute} element={<HomePage />} />
								<Route path={userPageRoute} element={<UserPage />} />
								<Route
									path={collectionPageRoute}
									element={<CollectionPage />}
								/>
								<Route
									path={editCollectionPageRoute}
									element={<EditCollectionPage />}
								/>
								<Route path={itemPageRoute} element={<ItemPage />} />
								<Route
									path={createItemPageRoute}
									element={<CreateItemPage />}
								/>
								<Route path={editItemPageRoute} element={<EditItemPage />} />
								<Route path={searchPageRoute} element={<SearchPage />} />
								<Route path={dashboardPageRoute} element={<DashboardPage />} />
							</Routes>
						</PageTemplate>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
}

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
