import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Fixed dark theme + high z-index so toasts show above the phone frame and modals. */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="dark"
    position="top-center"
    className="toaster group !z-[300]"
    toastOptions={{
      classNames: {
        toast:
          "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
        description: "group-[.toast]:text-muted-foreground",
        actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
        cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
      },
    }}
    {...props}
  />
);

export { Toaster, toast };
