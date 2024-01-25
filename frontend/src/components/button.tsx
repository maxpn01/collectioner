import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/ui";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
	{
		variants: {
			variant: {
				default: "bg-slate-800 text-primary-foreground hover:bg-slate-700",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline:
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3",
				lg: "h-11 rounded-md px-8",
				icon: "h-10 w-12 flex-shrink-0",
			},
			withIcon: {
				default: "",
				true: "pl-2",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			withIcon: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, withIcon, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, withIcon, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };

export function DangerButton({
	dialog,
	...buttonProps
}: Omit<ButtonProps, "onClick"> & {
	dialog: {
		title: React.ReactNode;
		body: React.ReactNode;
		okButton: {
			label: string;
			onClick: () => void;
		};
	};
}) {
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					{...buttonProps}
					className={cn(
						"text-red-500 border-red-500 hover:text-red-500 hover:bg-red-50",
						buttonProps.className,
					)}
				/>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{dialog.title}</DialogTitle>
				</DialogHeader>
				{dialog.body}
				<DialogFooter>
					<Button variant="secondary" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={dialog.okButton.onClick}>
						{dialog.okButton.label}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
