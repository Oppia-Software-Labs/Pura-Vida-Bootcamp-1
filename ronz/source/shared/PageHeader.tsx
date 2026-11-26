import { Link } from "react-router";

type PageHeaderProps = {
  title: string;
  description: string;
  back?: { to: string; label: string };
};

export default function PageHeader({ title, description, back }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      {back && (
        <Link to={back.to} className="w-fit text-sm text-muted transition-colors hover:text-fg">
          ← {back.label}
        </Link>
      )}
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted">{description}</p>
    </div>
  );
}
