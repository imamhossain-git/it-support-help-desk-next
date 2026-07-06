import Link from "next/link";

interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}

export function EmptyState({ icon = "📭", title, description, action }: Props) {
  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="text-5xl mb-3 animate-pulse-soft">{icon}</div>
      <h3 className="font-bold text-base mb-1">{title}</h3>
      {description && (
        <p className="muted text-sm max-w-md mx-auto mb-4">{description}</p>
      )}
      {action && (
        <Link href={action.href} className="btn btn-primary inline-flex">
          {action.label}
        </Link>
      )}
    </div>
  );
}
