import { dashboardPageRoute } from "@/admin/dashboard";
import { Button } from "@/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { Input } from "@/components/input";
import { homePageRoute } from "@/home";
import { searchPageRoute } from "@/item/search";
import { signInPageRoute } from "@/user/signin";
import { userPageRoute } from "@/user/view-user";
import {
	ErrorIndicator,
	Loaded,
	LoadingIndicator,
	StatePromise,
} from "@/utils/state-promise";
import { cn } from "@/utils/ui";
import { ProfileCircle, Search, Xmark } from "iconoir-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ok } from "ts-results";

type HeaderState = {
	showsSignIn: boolean;
	showsDashboardLink: boolean;
};

const HeaderStateContext = createContext<StatePromise<HeaderState>>(
	Loaded(
		Ok({
			showsSignIn: false,
			showsDashboardLink: true,
		}),
	),
);

export function Header() {
	const navigate = useNavigate();

	const [isSearchMode, setIsSearchMode] = useState(false);
	const mobileSearchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!mobileSearchInputRef.current) return;
		mobileSearchInputRef.current.focus();
	}, [isSearchMode]);

	const mobileSearch = (
		<form
			className={cn("flex space-x-2 md:hidden", !isSearchMode && "hidden")}
			onSubmit={(e) => {
				e.preventDefault();
				navigate(searchPageRoute);
			}}
		>
			<Input ref={mobileSearchInputRef} placeholder="Search..." />
			<Button size="icon">
				<Search />
			</Button>
			<Button
				onClick={() => setIsSearchMode(false)}
				type="button"
				variant="outline"
				size="icon"
			>
				<Xmark />
			</Button>
		</form>
	);

	return (
		<header className="py-2 border">
			<div
				className={cn(
					"container md:flex items-center justify-between max-w-screen-md px-4 lg:px-0",
					!isSearchMode && "flex",
				)}
			>
				{mobileSearch}
				<Link
					to={homePageRoute}
					className={cn(
						"text-4xl font-semibold text-slate-700 great-vibes-regular",
						isSearchMode && "hidden",
						"md:inline-block",
					)}
				>
					Collectioner
				</Link>
				<HeaderNav
					openSearch={() => setIsSearchMode(true)}
					className={cn(isSearchMode && "hidden", "md:flex")}
				/>
			</div>
		</header>
	);
}

function HeaderNav({
	openSearch,
	className,
}: {
	openSearch: () => void;
	className?: string;
}) {
	const statePromise = useContext(HeaderStateContext);
	if (statePromise.loading) return <LoadingIndicator />;
	const stateResult = statePromise.val;
	if (stateResult.err) return <ErrorIndicator />;
	const state = stateResult.val;
	const trailingButton = state.showsSignIn ? (
		<Button variant="outline" asChild>
			<Link to={signInPageRoute}>Sign in</Link>
		</Button>
	) : (
		<ProfileButton showsDashboardLink={state.showsDashboardLink} />
	);
	const mobileSearchButton = (
		<Button
			variant="outline"
			size="icon"
			className="md:hidden"
			onClick={openSearch}
		>
			<Search />
		</Button>
	);

	return (
		<nav className={cn("flex items-center space-x-2 md:space-x-4", className)}>
			{mobileSearchButton}
			<DesktopSearchBar />
			{trailingButton}
		</nav>
	);
}

function DesktopSearchBar() {
	const navigate = useNavigate();

	const [isFocused, setIsFocused] = useState(false);

	return (
		<form
			className={cn("items-center space-x-2 hidden", "md:flex")}
			onSubmit={(e) => {
				e.preventDefault();
				navigate(searchPageRoute);
			}}
		>
			<Input
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				placeholder="Search..."
			/>
			<Button size="icon" variant={isFocused ? "default" : "outline"}>
				<Search />
			</Button>
		</form>
	);
}

function ProfileButton({
	showsDashboardLink,
}: {
	showsDashboardLink: boolean;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					<ProfileCircle />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem asChild>
					<Link to={userPageRoute}>Profile</Link>
				</DropdownMenuItem>

				{showsDashboardLink && (
					<DropdownMenuItem asChild>
						<Link to={dashboardPageRoute}>Dashboard</Link>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem>Log out</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
