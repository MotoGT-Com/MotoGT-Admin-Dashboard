import { cn } from "@/lib/utils";

interface WhatsAppIconProps {
  className?: string;
  /** Accessible name; omit when paired with visible text. */
  title?: string;
}

/**
 * WhatsApp mark from /public/icons/whatsapp.png, tinted via currentColor
 * so it works in muted and primary-foreground tab states.
 */
export function WhatsAppIcon({ className, title }: WhatsAppIconProps) {
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn(
        "inline-block size-4 shrink-0 bg-current",
        "[mask-image:url(/icons/whatsapp.png)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]",
        "[-webkit-mask-image:url(/icons/whatsapp.png)] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]",
        className,
      )}
    />
  );
}
