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
import {
	ViewAuthenticatedUserUseCaseContext,
	authenticatedUserState,
} from "@/user/auth";
import { signInPageRoute } from "@/user/signin";
import { SignOutUseCaseContext } from "@/user/signout";
import { cn } from "@/utils/ui";
import { Signal, computed, useComputed } from "@preact/signals-react";
import { ProfileCircle, Search, Xmark } from "iconoir-react";
import { CircleDashed } from "lucide-react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { None, Option } from "ts-results";

type HeaderState = {
	profileButtonOption: Option<UiProfileButton>;
};

type UiProfileButton = {
	profileLink: string;
	showsDashboardLink: boolean;
};

const headerState = computed<HeaderState>(() => {
	const authenticatedUserOption = authenticatedUserState.value;

	return {
		profileButtonOption: authenticatedUserOption.map((user) => {
			return {
				profileLink: `/${user.username}`,
				showsDashboardLink: user.isAdmin,
			};
		}),
	};
});

const HeaderStateContext = createContext<Signal<HeaderState>>(headerState);

export function Header() {
	const [isSearchMode, setIsSearchMode] = useState(false);
	const openMobileSearchBar = useCallback(
		() => setIsSearchMode(true),
		[setIsSearchMode],
	);
	const closeMobileSearchBar = useCallback(
		() => setIsSearchMode(false),
		[setIsSearchMode],
	);

	const viewAuthenticatedUser = useContext(ViewAuthenticatedUserUseCaseContext);
	useEffect(() => {
		viewAuthenticatedUser.execute();
	}, []);

	const mobileSearchButton = (
		<Button
			variant="outline"
			size="icon"
			className="md:hidden"
			onClick={openMobileSearchBar}
		>
			<Search />
		</Button>
	);

	return (
		<header className="py-2 border">
			<div
				className={cn(
					"container md:flex items-center justify-between max-w-screen-md px-4 lg:px-0",
					!isSearchMode && "flex",
				)}
			>
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
					mobileSearchButton={mobileSearchButton}
					className={cn(isSearchMode && "hidden", "md:flex")}
				/>

				<MobileSearchBar
					isSearchMode={isSearchMode}
					close={closeMobileSearchBar}
				/>
			</div>
		</header>
	);
}

function MobileSearchBar(props: { isSearchMode: boolean; close: () => void }) {
	const navigate = useNavigate();
	const mobileSearchInputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");

	useEffect(() => {
		if (!mobileSearchInputRef.current) return;
		mobileSearchInputRef.current.focus();
	}, [props.isSearchMode]);

	return (
		<form
			className={cn(
				"flex space-x-2 md:hidden",
				!props.isSearchMode && "hidden",
			)}
			onSubmit={(e) => {
				e.preventDefault();
				navigate(`${searchPageRoute}?q=${query}`);
			}}
		>
			<Input
				ref={mobileSearchInputRef}
				placeholder="Search..."
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				required
			/>
			<Button size="icon">
				<Search />
			</Button>
			<Button onClick={props.close} type="button" variant="outline" size="icon">
				<Xmark />
			</Button>
		</form>
	);
}

function HeaderNav({
	mobileSearchButton,
	className,
}: {
	mobileSearchButton: React.ReactNode;
	className?: string;
}) {
	const headerState = useContext(HeaderStateContext);
	const trailingButton = useComputed(() => {
		const { profileButtonOption } = headerState.value;
		if (profileButtonOption.none) return <SignInButton />;
		const profileButton = profileButtonOption.val;

		return <ProfileButton {...profileButton} />;
	});

	return (
		<nav className={cn("flex items-center space-x-2 md:space-x-4", className)}>
			{mobileSearchButton}
			<DesktopSearchBar />
			{trailingButton}
		</nav>
	);
}

function SignInButton() {
	return (
		<Button variant="outline" asChild>
			<Link to={signInPageRoute}>Sign in</Link>
		</Button>
	);
}

function DesktopSearchBar() {
	const navigate = useNavigate();
	const [query, setQuery] = useState("");

	const [isFocused, setIsFocused] = useState(false);

	return (
		<form
			className={cn("items-center space-x-2 hidden", "md:flex")}
			onSubmit={(e) => {
				e.preventDefault();
				navigate(`${searchPageRoute}?q=${query}`);
			}}
		>
			<Input
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				placeholder="Search..."
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				required
			/>
			<Button size="icon" variant={isFocused ? "default" : "outline"}>
				<Search />
			</Button>
		</form>
	);
}

function ProfileButton({ profileLink, showsDashboardLink }: UiProfileButton) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					<ProfileCircle />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem asChild>
					<Link to={profileLink}>Profile</Link>
				</DropdownMenuItem>

				{showsDashboardLink && (
					<DropdownMenuItem asChild>
						<Link to={dashboardPageRoute}>Dashboard</Link>
					</DropdownMenuItem>
				)}

				<SignOutDropdownMenuItem />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function SignOutDropdownMenuItem() {
	const signOut = useContext(SignOutUseCaseContext);
	const [isLoading, setIsLoading] = useState(false);

	return (
		<DropdownMenuItem
			onClick={async (e) => {
				e.preventDefault();
				setIsLoading(true);
				const result = await signOut.execute();
				if (result.err) {
					console.error(result);
					return;
				}
				authenticatedUserState.value = None;
			}}
			className={cn(isLoading && "pl-2 bg-gray-200")}
			disabled={isLoading}
		>
			<CircleDashed
				className={cn(
					"transition-all animate-spin",
					isLoading ? "w-5 mr-2" : "w-0",
				)}
			/>
			Sign out
		</DropdownMenuItem>
	);
}
